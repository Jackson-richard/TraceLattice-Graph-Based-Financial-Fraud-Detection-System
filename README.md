# TraceLattice – Graph-Based Financial Fraud Detection System

## Overview

TraceLattice is a **Graph-Based Financial Fraud Detection System** designed to identify suspicious transaction patterns within financial networks.
Instead of analyzing transactions individually, the system models them as a **network graph** where accounts are nodes and transactions are edges.
Using graph analytics and anomaly detection, TraceLattice uncovers hidden fraud patterns such as circular transactions, dense clusters of accounts, and rapid fund movements.

---

## Problem

Financial institutions process millions of transactions daily. Fraudsters exploit this scale by distributing illegal transactions across multiple accounts to conceal money flow.
Traditional rule-based fraud detection systems struggle to detect **complex network relationships and coordinated transaction patterns**.

---

## Solution

TraceLattice addresses this challenge by transforming transaction data into a **graph network** and applying advanced analytics techniques to detect suspicious activity.

Key capabilities include:

* Graph-based transaction network modeling
* Fraud risk scoring
* Unsupervised anomaly detection
* Visual investigation dashboard
* Explainable AI fraud reports

---

## System Architecture

```
Transaction Dataset (CSV)
        ↓
Graph Construction (NetworkX)
        ↓
Graph Feature Extraction
  • Degree Centrality
  • Betweenness Centrality
  • Transaction Frequency
        ↓
Risk Score Calculation
        ↓
Isolation Forest (Anomaly Detection)
        ↓
Fraud Pattern Detection
        ↓
Visualization Dashboard + AI Investigation Report
```

---

## Features

* Interactive **transaction network visualization**
* Detection of **circular transaction loops**
* Identification of **high centrality accounts**
* Detection of **dense transaction clusters**
* **Fraud risk scoring system**
* **AI-generated investigation reports**
* CSV dataset upload interface
* Fraud alert monitoring dashboard

---

## Technology Stack

### Frontend

* React
* Cytoscape.js
* TailwindCSS

### Backend

* Node.js / Python API
* NetworkX (Graph Analysis)

### Machine Learning

* Isolation Forest (Anomaly Detection)

### Database

* MongoDB

---

## Dataset Format

CSV file must contain the following columns:

```
sender,receiver,amount,timestamp
```

Example:

```
A,B,5000,2024-01-01
B,C,4800,2024-01-01
C,A,4700,2024-01-01
```

---

## Fraud Patterns Detected

TraceLattice detects several suspicious patterns:

* Circular Transactions
* High Centrality Accounts
* Dense Transaction Clusters
* Rapid Money Movement

---

## Dashboard

The investigation dashboard provides:

* Transaction network visualization
* Fraud alert notifications
* Suspicious account highlighting
* AI-generated fraud explanations

---

## Use Cases

* Banking fraud detection
* Anti-money laundering monitoring
* Financial investigation tools
* Transaction network analysis

---

## Future Improvements

* Graph Neural Networks for advanced fraud prediction
* Real-time transaction monitoring
* Integration with blockchain-based audit trails
* Automated risk classification models

---



---


