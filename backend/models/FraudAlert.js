const mongoose = require("mongoose");

const fraudAlertSchema = new mongoose.Schema({
  alert_type: { type: String, required: true },
  involved_accounts: [{ type: String }],
  description: { type: String },
  detection_time: { type: Date, default: Date.now }
});

module.exports = mongoose.model("FraudAlert", fraudAlertSchema);
