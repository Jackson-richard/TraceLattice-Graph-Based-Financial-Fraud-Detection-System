const mongoose = require("mongoose");

const investigationReportSchema = new mongoose.Schema({
  report_summary: { type: String, required: true },
  suspicious_accounts: [{ type: String }],
  risk_level: { type: String, enum: ["Low", "Medium", "High"] },
  generated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model("InvestigationReport", investigationReportSchema);
