const express = require('express');
const Payment = require('../models/Payment');

const router = express.Router();

// List payments (most recent first)
// Optional query: limit (default 10)
router.get('/', async (req, res) => {
  try {
    const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 10));
    const page = Math.max(1, Number(req.query.page) || 1);
    const { from, to } = req.query;
    const filter = {};
    const dateFilter = {};
    if (from) {
      const d = new Date(from);
      if (!isNaN(d.getTime())) dateFilter.$gte = d;
    }
    if (to) {
      const d = new Date(to);
      if (!isNaN(d.getTime())) dateFilter.$lte = d;
    }
    if (dateFilter.$gte || dateFilter.$lte) filter.date = dateFilter;

    const totalCount = await Payment.countDocuments(filter);
    const payments = await Payment.find(filter)
      .sort({ date: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('store', 'name')
      .populate('bill', 'billNumber');
    const totalPages = Math.max(1, Math.ceil(totalCount / limit));
    res.json({ payments, page, limit, totalCount, totalPages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
