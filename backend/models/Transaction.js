const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  sender: { type: String, required: true },
  receiver: { type: String, required: true },
  amount: { type: Number, required: true },
  timestamp: { type: Date, required: true }
});

module.exports = mongoose.model("Transaction", transactionSchema);
