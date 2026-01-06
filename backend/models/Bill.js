const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  productName: { type: String, required: true },
  productCode: { type: String },
  price: { type: Number },
  quantity: { type: Number },
  gst: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  subtotal: { type: Number, required: true },
  finalPrice: { type: Number, required: true }
}, { _id: false });

const billSchema = new mongoose.Schema({
  billNumber: { type: Number, index: true },
  date: { type: Date, default: Date.now },
  store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
  products: { type: [productSchema], required: true },
  grandTotal: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  pendingAmount: { type: Number, default: 0 }
});

module.exports = mongoose.model("Bill", billSchema);
