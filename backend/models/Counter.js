const mongoose = require("mongoose");

const counterSchema = new mongoose.Schema({
  name: String,
  seq: Number
});

module.exports = mongoose.model("Counter", counterSchema);
