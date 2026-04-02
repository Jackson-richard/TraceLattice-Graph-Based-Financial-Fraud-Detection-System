import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Graph } from "@antv/g6";
import { AlertCircle, BrainCircuit, ActivitySquare, ListTree, ShieldAlert } from "lucide-react";

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
  
  const containerRef = useRef(null);
  const graphInstance = useRef(null);

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

  useEffect(() => {
    if (loading || !containerRef.current) return;
    if (data.nodes.length === 0) return;

    if (graphInstance.current) {
      graphInstance.current.destroy();
    }

    const g6Nodes = data.nodes.map(n => {
      let isHub = n.role === "smurfing" || n.risk_score > 0.7;
      let isSus = n.role === "layering" || n.is_suspicious;

      let size = isHub ? 45 : isSus ? 30 : 20;
      let fill = isHub ? "#ef4444" : isSus ? "#f97316" : "#3b82f6";
      let stroke = isHub ? "#ffffff" : isSus ? "#ffffff" : "#bfdbfe";
      let lineWidth = isHub ? 3 : isSus ? 2 : 1;
      let shadowBlur = isHub ? 20 : isSus ? 10 : 0;
      let shadowColor = fill;

      return {
        id: n.id,
        data: { ...n },
        style: {
          r: size / 2, 
          fill: fill,
          stroke: stroke,
          lineWidth: lineWidth,
          shadowBlur: shadowBlur,
          shadowColor: shadowColor,
          labelText: n.id,
          labelFill: "#e2e8f0",
          labelPlacement: "bottom",
          labelFontSize: 12,
          labelFontWeight: isHub ? "bold" : "normal"
        }
      };
    });

    const edgeCounts = {};
    const g6Edges = data.edges.map((e, i) => {
      const edgeKey = e.source < e.target ? `${e.source}-${e.target}` : `${e.target}-${e.source}`;
      edgeCounts[edgeKey] = (edgeCounts[edgeKey] || 0) + 1;
      const isParallel = edgeCounts[edgeKey] > 1;

      let stroke = "#475569";
      let lineWidth = 1;
      
      if (e.role === "fan_out") {
        stroke = "#ef4444";
        lineWidth = 2;
      } else if (e.role === "layering") {
        stroke = "#ea580c";
        lineWidth = 2;
      } else if (e.role === "round_trip") {
        stroke = "#b91c1c"; 
        lineWidth = 3;
      }

      return {
        id: `edge-${i}-${e.source}-${e.target}`,
        source: e.source,
        target: e.target,
        type: isParallel ? 'quadratic' : 'polyline',
        style: {
          stroke: stroke,
          lineWidth: lineWidth,
          endArrow: true,
          radius: 10, 
          curveOffset: isParallel ? 30 : 0
        }
      };
    });

    const graph = new Graph({
      container: containerRef.current,
      autoFit: "view",
      animate: true,
      data: {
        nodes: g6Nodes,
        edges: g6Edges
      },
      layout: {
        type: 'fruchterman', 
        gravity: 2,
        speed: 5,
        clustering: true,
        preventOverlap: true,
        nodeSize: 60, 
      },
      modes: {
        default: ["drag-node", "zoom-canvas", "drag-canvas", "activate-relations"]
      },
      node: {
        style: (d) => ({
          ...d.style,
          cursor: 'pointer'
        })
      },
      edge: {
        style: (d) => ({
          ...d.style,
          cursor: 'pointer'
        })
      }
    });

    graph.render();

    graph.on("node:click", (evt) => {
      const nodeId = evt.target.id;
      const nodeData = data.nodes.find(n => n.id === nodeId);
      if (nodeData) {
        setSelectedNode(nodeData);
      }
    });

    graph.on("canvas:click", () => {
      setSelectedNode(null);
    });

    graphInstance.current = graph;

    return () => {
      if (graphInstance.current) {
        graphInstance.current.destroy();
        graphInstance.current = null;
      }
    };
  }, [loading, data]);

  if (loading) return <div style={{ padding: '2rem' }}>Loading dashboard data...</div>;

  const highRiskCount = data.nodes.filter(n => n.risk_score > 0.7 || n.role === "smurfing").length;

  const getRiskLabel = (score, role) => {
    if (role === "smurfing") return "High Risk (Hub)";
    if (role === "layering") return "Medium Risk (Cycle)";
    if (score > 0.7) return "High Risk";
    if (score >= 0.4) return "Medium Risk";
    return "Low Risk";
  };

  const sortedNodes = [...data.nodes].sort((a, b) => b.risk_score - a.risk_score);

  return (
    <div>
      <header className="page-header">
        <h1 className="page-title">Fraud Investigation Dashboard</h1>
        <p className="page-subtitle">Real-time graph analysis, anomaly detection, and risk scoring.</p>
      </header>

      <div className="metrics-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        <div className="metric-card card">
          <div className="metric-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ActivitySquare size={16} color="var(--accent-primary)" />
            Total Accounts
          </div>
          <div className="metric-value">{data.stats.accountCount}</div>
        </div>
        <div className="metric-card card">
          <div className="metric-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ListTree size={16} color="var(--success-color)" />
            Total Transactions
          </div>
          <div className="metric-value">{data.stats.transactionCount}</div>
        </div>
        <div className="metric-card card danger">
          <div className="metric-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} color="var(--danger-color)" />
            Suspicious Patterns
          </div>
          <div className="metric-value" style={{ color: 'var(--danger-color)' }}>
            {data.stats.suspiciousCount}
          </div>
        </div>
        <div className="metric-card card" style={{ borderLeft: '4px solid #ef4444' }}>
          <div className="metric-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={16} color="#ef4444" />
            High Risk Accounts
          </div>
          <div className="metric-value" style={{ color: '#ef4444' }}>
            {highRiskCount}
          </div>
        </div>
      </div>

      <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '1.5rem', alignItems: 'start' }}>
        <div className="graph-container card" style={{ padding: 0, position: 'relative', height: '650px', backgroundColor: '#0f172a', overflow: 'hidden', border: '1px solid #1e293b' }}>
          {data.nodes.length === 0 ? (
             <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', paddingTop: '10rem' }}>
                No network data available. Please upload a dataset.
             </div>
          ) : (
             <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
          )}

          {selectedNode && (
            <div style={{ position: 'absolute', bottom: '20px', left: '20px', background: 'var(--bg-primary)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', zIndex: 10, minWidth: '280px' }}>
              <h4 style={{ marginBottom: '1rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Account Details</h4>
              <p style={{ margin: '0.5rem 0', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                <strong>ID:</strong> <span>{selectedNode.id}</span>
              </p>
              <p style={{ margin: '0.5rem 0', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                <strong>Role:</strong> 
                <span style={{ color: selectedNode.role === 'smurfing' ? '#ef4444' : selectedNode.role === 'layering' ? '#f97316' : '#3b82f6', fontWeight: 'bold', textTransform: 'capitalize' }}>
                  {selectedNode.role}
                </span>
              </p>
              <p style={{ margin: '0.5rem 0', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                <strong>Risk Score:</strong> 
                <span style={{ color: selectedNode.risk_score > 0.7 ? '#ef4444' : selectedNode.risk_score >= 0.4 ? '#f97316' : '#10b981', fontWeight: 'bold' }}>
                  {selectedNode.risk_score.toFixed(2)}
                </span>
              </p>
              <p style={{ margin: '0.5rem 0', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                <strong>Anomaly Score:</strong> <span>{selectedNode.anomaly_score?.toFixed(3) || 'N/A'}</span>
              </p>
              <p style={{ margin: '0.5rem 0', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                <strong>Degree Centrality:</strong> <span>{selectedNode.degree_centrality?.toFixed(3) || 0}</span>
              </p>
              <button className="btn" style={{ padding: '0.5rem 1rem', marginTop: '1rem', width: '100%', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }} onClick={() => setSelectedNode(null)}>Close</button>
            </div>
          )}

          {/* Graph Legend Panel */}
          <div style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)', padding: '1rem', borderRadius: '8px', border: '1px solid #334155', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', zIndex: 10, fontSize: '0.85rem' }}>
            <h4 style={{ marginBottom: '0.5rem', color: '#f8fafc', borderBottom: '1px solid #334155', paddingBottom: '0.25rem', fontWeight: '600' }}>Fraud Topology</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ef4444', border: '2px solid #fff', boxShadow: '0 0 6px #ef4444' }}></div>
                <span style={{ color: '#cbd5e1' }}>High Risk (Hub)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#f97316', border: '2px solid #fff' }}></div>
                <span style={{ color: '#cbd5e1' }}>Suspicious (Cycle)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#3b82f6', border: '1px solid #bfdbfe' }}></div>
                <span style={{ color: '#cbd5e1' }}>Normal Account</span>
              </div>
              <div style={{ height: '1px', backgroundColor: '#334155', margin: '6px 0' }}></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '16px', height: '3px', backgroundColor: '#b91c1c' }}></div>
                <span style={{ color: '#cbd5e1' }}>Round-trip Edge</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '16px', height: '2px', backgroundColor: '#ea580c' }}></div>
                <span style={{ color: '#cbd5e1' }}>Layering Edge</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '16px', height: '1px', backgroundColor: '#475569' }}></div>
                <span style={{ color: '#cbd5e1' }}>Standard Edge</span>
              </div>
            </div>
          </div>
        </div>

        <div className="right-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="card risk-scores-panel">
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <ShieldAlert size={18} color="var(--accent-primary)" />
              Risk Scores Panel
            </h3>
            {sortedNodes.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No accounts available.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {sortedNodes.slice(0, 5).map((n, idx) => {
                  let badgeBg = '#dcfce7'; let badgeColor = '#166534';
                  if (n.role === 'smurfing' || n.risk_score > 0.7) { badgeBg = '#fee2e2'; badgeColor = '#991b1b'; }
                  else if (n.role === 'layering' || n.risk_score >= 0.4) { badgeBg = '#ffedd5'; badgeColor = '#9a3412'; }

                  return (
                    <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '6px' }}>
                      <span style={{ fontWeight: 500 }}>{n.id}</span>
                      <span style={{ 
                        fontSize: '0.85rem', 
                        padding: '2px 8px', 
                        borderRadius: '12px', 
                        backgroundColor: badgeBg,
                        color: badgeColor,
                        fontWeight: 'bold'
                      }}>
                        Score {n.risk_score.toFixed(2)} ({getRiskLabel(n.risk_score, n.role)})
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem', textAlign: 'center' }}>Showing top 5 accounts</p>
          </div>

          <div className="card alerts-panel">
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <AlertCircle size={18} color="var(--warning-color)" />
              Fraud Alerts Panel
            </h3>
            {data.alerts.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No alerts detected.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {data.alerts.map((alert, idx) => (
                  <li key={idx} className="alert-item" style={{ fontSize: '0.9rem', padding: '0.75rem', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '6px', borderLeft: '4px solid #ef4444' }}>
                    {alert}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card ai-panel">
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <BrainCircuit size={18} />
              AI Investigation Report
            </h3>
            <div className="ai-explanation" style={{ fontSize: '0.95rem', lineHeight: '1.5', color: 'var(--text-secondary)' }}>
              {data.aiExplanation}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
