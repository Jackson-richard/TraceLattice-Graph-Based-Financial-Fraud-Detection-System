function analyzeGraph(transactions) {
  const nodes = new Map();
  const edges = [];
  const alerts = [];
  const suspiciousNodes = new Set();
  
  // Build graph
  transactions.forEach(t => {
    const { sender, receiver, amount } = t;
    if (!nodes.has(sender)) nodes.set(sender, { id: sender, inDegree: 0, outDegree: 0, totalAmountSent: 0, totalAmountReceived: 0 });
    if (!nodes.has(receiver)) nodes.set(receiver, { id: receiver, inDegree: 0, outDegree: 0, totalAmountSent: 0, totalAmountReceived: 0 });
    
    nodes.get(sender).outDegree += 1;
    nodes.get(sender).totalAmountSent += amount;
    
    nodes.get(receiver).inDegree += 1;
    nodes.get(receiver).totalAmountReceived += amount;
    
    edges.push({ source: sender, target: receiver, amount });
  });

  const nodeArray = Array.from(nodes.values());

  // 1. Degree Centrality (High transaction volume)
  // Let's say high degree is > average * 3
  const avgDegree = nodeArray.reduce((acc, n) => acc + n.inDegree + n.outDegree, 0) / (nodeArray.length || 1);
  nodeArray.forEach(n => {
    if ((n.inDegree + n.outDegree) > Math.max(5, avgDegree * 3)) {
      suspiciousNodes.add(n.id);
      alerts.push(`High centrality account detected: ${n.id} with ${n.inDegree + n.outDegree} transactions.`);
    }
  });

  // 2. Cycle Detection (Simple approach for A -> B -> C -> A)
  // Build adjacency list for DFS
  const adj = new Map();
  for (const n of nodeArray) adj.set(n.id, []);
  for (const e of edges) {
    adj.get(e.source).push(e.target);
  }

  // Detect paths of length 3 that form a cycle
  const cycles = new Set();
  for (const a of nodeArray) {
    const start = a.id;
    for (const b of adj.get(start)) {
      for (const c of adj.get(b)) {
        if (c === start) continue; // length 2 cycle
        for (const d of adj.get(c)) {
          if (d === start) {
            // Found A -> B -> C -> A
            const cycleKey = [start, b, c].sort().join(",");
            if (!cycles.has(cycleKey)) {
              cycles.add(cycleKey);
              suspiciousNodes.add(start);
              suspiciousNodes.add(b);
              suspiciousNodes.add(c);
              alerts.push(`Circular transaction detected: ${start} -> ${b} -> ${c} -> ${start}`);
            }
          }
        }
      }
    }
  }

  // 3. Dense clusters (Simplistic: nodes sharing many common neighbors)
  // We'll skip complex cluster detection to keep it fast, but we have enough for a prototype

  return {
    nodes: nodeArray,
    edges: edges,
    suspiciousNodes: Array.from(suspiciousNodes),
    alerts: alerts
  };
}

module.exports = { analyzeGraph };
