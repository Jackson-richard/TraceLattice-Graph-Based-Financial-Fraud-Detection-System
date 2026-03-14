require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const csvParser = require("csv-parser");
const fs = require("fs");
const path = require("path");

const Transaction = require("./models/Transaction");
const FraudAlert = require("./models/FraudAlert");
const InvestigationReport = require("./models/InvestigationReport");
const graphService = require("./graphService");

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/tracelattice")
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));

app.post("/api/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const results = [];
  fs.createReadStream(req.file.path)
    .pipe(csvParser())
    .on("data", (data) => {
      // Validate data maybe?
      if (data.sender && data.receiver && data.amount && data.timestamp) {
        results.push({
          sender: data.sender,
          receiver: data.receiver,
          amount: parseFloat(data.amount),
          timestamp: new Date(data.timestamp),
        });
      }
    })
    .on("end", async () => {
      try {
        await Transaction.insertMany(results);
        res.json({ message: "Dataset uploaded and processed successfully", count: results.length });
      } catch (err) {
        console.error("Error inserting transactions:", err);
        res.status(500).json({ error: "Failed to process dataset" });
      }
    });
});

app.get("/api/analyze", async (req, res) => {
  try {
    const transactions = await Transaction.find({});
    
    // Analyze using graphService
    const { nodes, edges, suspicious_nodes: suspiciousNodes, alerts } = await graphService.analyzeGraph(transactions);
    
    // Save new alerts
    for (const alertMsg of alerts) {
      await FraudAlert.create({
        alert_type: "Graph Pattern",
        involved_accounts: suspiciousNodes,
        description: alertMsg,
        detection_time: new Date()
      });
    }

    // AI Investigation short explanation
    const aiExplanation = `Detected ${suspiciousNodes.length} suspicious accounts involved in complex routing such as cyclic movements or high-density transfers. Further investigation is recommended for: ${suspiciousNodes.slice(0, 5).join(", ")}.`;
    
    await InvestigationReport.create({
      report_summary: aiExplanation,
      suspicious_accounts: suspiciousNodes,
      risk_level: suspiciousNodes.length > 0 ? "High" : "Low",
      generated_at: new Date()
    });

    res.json({
      nodes: nodes,
      edges: edges,
      suspicious_nodes: suspiciousNodes,
      alerts: alerts,
      aiExplanation
    });
  } catch (err) {
    console.error("Error in /api/analyze", err);
    res.status(500).json({ error: "Failed to analyze data" });
  }
});

app.get("/api/dashboard-data", async (req, res) => {
  try {
    const transactions = await Transaction.find({});
    const { nodes, edges, suspicious_nodes: suspiciousNodes, alerts } = await graphService.analyzeGraph(transactions);
    
    // Convert to target frontend format
    // The prompt specified Output JSON Format:
    // { "nodes": ["A","B","C"], "edges": [["A","B"],["B","C"],["C","A"]], "suspicious_nodes": ["B"], "alerts": [] }
    
    const latestReport = await InvestigationReport.findOne().sort({ generated_at: -1 });

    res.json({
      nodes,
      edges,
      suspicious_nodes: suspiciousNodes,
      alerts,
      stats: {
        accountCount: nodes.length,
        transactionCount: edges.length,
        suspiciousCount: suspiciousNodes.length
      },
      aiExplanation: latestReport ? latestReport.report_summary : "No AI report yet. Try running an analysis."
    });
  } catch (err) {
    console.error("Error in /api/dashboard-data", err);
    res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
});

app.post("/api/reset", async (req, res) => {
  try {
    await Transaction.deleteMany({});
    await FraudAlert.deleteMany({});
    await InvestigationReport.deleteMany({});
    res.json({ message: "Database reset successful" });
  } catch (err) {
    console.error("Error resetting database", err);
    res.status(500).json({ error: "Reset failed" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
