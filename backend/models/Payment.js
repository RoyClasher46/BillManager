const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  bill: { type: mongoose.Schema.Types.ObjectId, ref: 'Bill', required: true },
  store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
  amount: { type: Number, required: true },
  previousPaid: { type: Number, required: true },
  newPaid: { type: Number, required: true },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model("Payment", paymentSchema);
