const express = require('express');
const mongoose = require('mongoose');
const Store = require('../models/Store');
const Bill = require('../models/Bill');
const Payment = require('../models/Payment');

const router = express.Router();

// Create a store
router.post('/', async (req, res) => {
  try {
    const { name, address, phone } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Store name is required' });

    const existing = await Store.findOne({ name: name.trim() });
    if (existing) return res.status(409).json({ error: 'Store already exists' });

    const store = await Store.create({ name: name.trim(), address, phone });
    res.status(201).json({ store });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get stores with aggregates (totals, paid, pending)
router.get('/', async (_req, res) => {
  try {
    const agg = await Bill.aggregate([
      { $group: {
          _id: '$store',
          totalAmount: { $sum: '$grandTotal' },
          totalPaid: { $sum: '$paidAmount' },
          totalPending: { $sum: '$pendingAmount' },
          count: { $sum: 1 }
      }}
    ]);

    // Filter out null store ids (legacy bills without a store)
    const validAgg = agg.filter(a => a._id);
    const storeIds = validAgg.map(a => a._id);
    const stores = await Store.find({ _id: { $in: storeIds } }).lean();
    const storeMap = new Map(stores.map(s => [s._id.toString(), s]));

    const result = validAgg.map(a => ({
      storeId: a._id,
      name: storeMap.get(a._id.toString())?.name || 'Unknown',
      totalAmount: a.totalAmount,
      totalPaid: a.totalPaid,
      totalPending: a.totalPending,
      billsCount: a.count
    }));

    // also include stores with 0 bills
    const storesWithoutBills = await Store.find({ _id: { $nin: storeIds } }).lean();
    for (const s of storesWithoutBills) {
      result.push({ storeId: s._id, name: s.name, totalAmount: 0, totalPaid: 0, totalPending: 0, billsCount: 0 });
    }

    res.json({ stores: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get store details with bills
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid store id' });

    const store = await Store.findById(id);
    if (!store) return res.status(404).json({ error: 'Store not found' });

    const bills = await Bill.find({ store: id }).sort({ date: -1, billNumber: -1 });

    const totals = bills.reduce((acc, b) => {
      acc.totalAmount += b.grandTotal || 0;
      acc.totalPaid += b.paidAmount || 0;
      acc.totalPending += b.pendingAmount || 0;
      return acc;
    }, { totalAmount: 0, totalPaid: 0, totalPending: 0 });

    res.json({ store, totals, bills });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Apply a lump-sum payment to oldest pending bills of a store
router.post('/:id/payments/apply', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid store id' });
    let { amount } = req.body;
    amount = Number(amount);
    if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

    const store = await Store.findById(id);
    if (!store) return res.status(404).json({ error: 'Store not found' });

    // Fetch bills with pending > 0 oldest first
    const bills = await Bill.find({ store: id, pendingAmount: { $gt: 0 } }).sort({ date: 1, billNumber: 1 });
    if (bills.length === 0) return res.status(400).json({ error: 'No pending bills for this store' });

    let remaining = amount;
    const applied = [];
    for (const b of bills) {
      if (remaining <= 0) break;
      const pending = Number(b.pendingAmount || 0);
      if (pending <= 0) continue;
      const pay = Math.min(remaining, pending);
      const previousPaid = Number(b.paidAmount || 0);
      b.paidAmount = Number((previousPaid + pay).toFixed(2));
      b.pendingAmount = Number((b.grandTotal - b.paidAmount).toFixed(2));
      await b.save();
      await Payment.create({
        bill: b._id,
        store: b.store,
        amount: Number(pay.toFixed(2)),
        previousPaid: Number(previousPaid.toFixed(2)),
        newPaid: b.paidAmount,
      });
      applied.push({ billId: b._id, billNumber: b.billNumber, pay });
      remaining -= pay;
    }

    // compute new totals
    const billsAfter = await Bill.find({ store: id });
    const totals = billsAfter.reduce((acc, b) => {
      acc.totalAmount += b.grandTotal || 0;
      acc.totalPaid += b.paidAmount || 0;
      acc.totalPending += b.pendingAmount || 0;
      return acc;
    }, { totalAmount: 0, totalPaid: 0, totalPending: 0 });

    res.json({ message: 'Payment applied', applied, remaining: Number(remaining.toFixed(2)), totals });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
