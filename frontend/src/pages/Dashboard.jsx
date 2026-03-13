import { useState, useEffect } from "react";
import axios from "axios";
import CytoscapeComponent from "react-cytoscapejs";
import { AlertCircle, BrainCircuit, ActivitySquare, ListTree } from "lucide-react";

export default function Dashboard() {
  const [data, setData] = useState({
    nodes: [],
    edges: [],
    suspicious_nodes: [],
    alerts: [],
    stats: { accountCount: 0, transactionCount: 0, suspiciousCount: 0 },
    aiExplanation: ""
  });
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/dashboard-data");
      setData(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading dashboard data...</div>;

  const elements = [
    ...data.nodes.map(n => ({
      data: { id: n.id, label: n.id },
      classes: data.suspicious_nodes.includes(n.id) ? "suspicious" : "normal"
    })),
    ...data.edges.map((e, index) => ({
      data: { id: `e${index}`, source: e.source, target: e.target, amount: e.amount }
    }))
  ];

  const stylesheet = [
    {
      selector: "node",
      style: {
        label: "data(label)",
        "background-color": "var(--accent-primary)",
        color: "#fff",
        "text-valign": "center",
        "text-halign": "center",
        "font-size": "12px",
        width: "35px",
        height: "35px",
        "border-width": 2,
        "border-color": "#1e3a8a",
        "transition-property": "background-color",
        "transition-duration": "0.3s"
      }
    },
    {
      selector: "node.suspicious",
      style: {
        "background-color": "var(--danger-color)",
        "border-color": "#7f1d1d",
        "border-width": 4,
        "box-shadow": "0 0 10px var(--danger-color)"
      }
    },
    {
      selector: "edge",
      style: {
        width: 2,
        "line-color": "#475569",
        "target-arrow-color": "#475569",
        "target-arrow-shape": "triangle",
        "curve-style": "bezier",
        "opacity": 0.6
      }
    }
  ];

  return (
    <div>
      <header className="page-header">
        <h1 className="page-title">Fraud Investigation Dashboard</h1>
        <p className="page-subtitle">Real-time graph analysis of transaction network patterns.</p>
      </header>

      <div className="metrics-row">
        <div className="metric-card">
          <div className="metric-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ActivitySquare size={16} color="var(--accent-primary)" />
            Total Accounts
          </div>
          <div className="metric-value">{data.stats.accountCount}</div>
        </div>
        <div className="metric-card">
          <div className="metric-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ListTree size={16} color="var(--success-color)" />
            Total Transactions
          </div>
          <div className="metric-value">{data.stats.transactionCount}</div>
        </div>
        <div className="metric-card danger">
          <div className="metric-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} color="var(--danger-color)" />
            Suspicious Patterns
          </div>
          <div className="metric-value" style={{ color: 'var(--danger-color)' }}>
            {data.stats.suspiciousCount}
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="graph-container card" style={{ padding: 0, position: 'relative' }}>
          {elements.length === 0 ? (
             <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', paddingTop: '10rem' }}>
                No network data available. Please upload a dataset.
             </div>
          ) : (
             <CytoscapeComponent 
               elements={elements} 
               style={{ width: "100%", height: "100%" }} 
               stylesheet={stylesheet}
               layout={{ name: 'circle', padding: 20 }}
               wheelSensitivity={0.2}
               minZoom={0.5}
               maxZoom={2}
               cy={(cy) => {
                 cy.on("tap", "node", (evt) => {
                   const node = evt.target;
                   const nData = data.nodes.find(n => n.id === node.id());
                   if (nData) setSelectedNode(nData);
                 });
                 cy.on("tap", (evt) => {
                   if (evt.target === cy) setSelectedNode(null);
                 });
               }}
             />
          )}

          {selectedNode && (
            <div style={{ position: 'absolute', bottom: '20px', left: '20px', background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', zIndex: 10, minWidth: '250px' }}>
              <h4 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Account Details</h4>
              <p style={{ margin: '0.25rem 0', color: 'var(--text-secondary)' }}><strong>ID:</strong> {selectedNode.id}</p>
              <p style={{ margin: '0.25rem 0', color: 'var(--text-secondary)' }}><strong>In-Degree:</strong> {selectedNode.inDegree}</p>
              <p style={{ margin: '0.25rem 0', color: 'var(--text-secondary)' }}><strong>Out-Degree:</strong> {selectedNode.outDegree}</p>
              <p style={{ margin: '0.25rem 0', color: 'var(--text-secondary)' }}><strong>Total Sent:</strong> ${selectedNode.totalAmountSent}</p>
              <p style={{ margin: '0.25rem 0', color: 'var(--text-secondary)' }}><strong>Total Rcvd:</strong> ${selectedNode.totalAmountReceived}</p>
              <button className="btn" style={{ padding: '0.5rem 1rem', marginTop: '1rem', width: '100%' }} onClick={() => setSelectedNode(null)}>Close</button>
            </div>
          )}
        </div>

        <div className="right-panel">
          <div className="card alerts-panel">
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={18} color="var(--warning-color)" />
              Recent Fraud Alerts
            </h3>
            {data.alerts.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No alerts detected.</p>
            ) : (
              data.alerts.map((alert, idx) => (
                <div key={idx} className="alert-item">
                  <p>{alert}</p>
                </div>
              ))
            )}
          </div>

          <div className="card ai-panel">
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981' }}>
              <BrainCircuit size={18} />
              AI Investigation Report
            </h3>
            <div className="ai-explanation">
              {data.aiExplanation}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
