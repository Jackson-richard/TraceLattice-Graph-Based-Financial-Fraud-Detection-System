import sys
import json
import networkx as nx
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import MinMaxScaler

def compute_metrics(transactions):
    if not transactions:
        return {"nodes": [], "edges": [], "suspicious_nodes": [], "alerts": []}
        
    df = pd.DataFrame(transactions)
    
    G = nx.DiGraph()
    for _, row in df.iterrows():
        sender = row['sender']
        receiver = row['receiver']
        amount = row['amount']
        if G.has_edge(sender, receiver):
            G[sender][receiver]['weight'] += amount
            G[sender][receiver]['count'] += 1
        else:
            G.add_edge(sender, receiver, weight=amount, count=1)
            
    degree_centrality = nx.degree_centrality(G)
    betweenness_centrality = nx.betweenness_centrality(G)
    clustering = nx.clustering(G.to_undirected())
    
    # Compute basic transaction stats per node
    # Transaction frequency = out-degree + in-degree in MultiGraph? 
    # Or sum of 'count' of edges
    node_stats = {}
    for node in G.nodes():
        tx_count = sum(d['count'] for _, _, d in G.in_edges(node, data=True)) + \
                   sum(d['count'] for _, _, d in G.out_edges(node, data=True))
        
        total_amount = sum(d['weight'] for _, _, d in G.in_edges(node, data=True)) + \
                       sum(d['weight'] for _, _, d in G.out_edges(node, data=True))
        
        avg_amount = total_amount / tx_count if tx_count > 0 else 0
        node_stats[node] = {
            'transaction_count': tx_count,
            'average_transaction_amount': avg_amount
        }
        
    # Prepare DataFrame for ML and Scoring
    features = []
    nodes = list(G.nodes())
    for node in nodes:
        features.append({
            'node': node,
            'transaction_count': node_stats[node]['transaction_count'],
            'average_transaction_amount': node_stats[node]['average_transaction_amount'],
            'degree_centrality': degree_centrality.get(node, 0),
            'betweenness_centrality': betweenness_centrality.get(node, 0),
            'cluster_density': clustering.get(node, 0)
        })
        
    feature_df = pd.DataFrame(features).set_index('node')
    
    if len(feature_df) > 1:
        # Normalize for Risk Scoring
        scaler = MinMaxScaler()
        normalized_df = pd.DataFrame(
            scaler.fit_transform(feature_df[['degree_centrality', 'betweenness_centrality', 'transaction_count']]),
            columns=['degree_centrality_norm', 'betweenness_centrality_norm', 'transaction_frequency_norm'],
            index=feature_df.index
        )
        
        # Risk Score Calculation
        feature_df['risk_score'] = (
            0.4 * normalized_df['degree_centrality_norm'] +
            0.3 * normalized_df['betweenness_centrality_norm'] +
            0.3 * normalized_df['transaction_frequency_norm']
        )
        
        # Anomaly Detection (Isolation Forest)
        ml_features = ['transaction_count', 'average_transaction_amount', 'degree_centrality', 'betweenness_centrality', 'cluster_density']
        X = feature_df[ml_features]
        clf = IsolationForest(contamination=0.1, random_state=42)
        # Note: fit_predict returns -1 for outliers and 1 for inliers.
        preds = clf.fit_predict(X)
        anomaly_scores = clf.decision_function(X) # lower is more anomalous
        feature_df['is_anomaly'] = preds == -1
        feature_df['anomaly_score'] = anomaly_scores
    else:
        feature_df['risk_score'] = 0.0
        feature_df['is_anomaly'] = False
        feature_df['anomaly_score'] = 0.0

    # Setup flags for new logic
    smurfing_nodes = set()
    layering_nodes = set()
    layering_edges = set()
    round_trip_edges = set()
    suspicious_nodes = set()
    alerts = []
    
    # 1. Smurfing Detection
    # Calculate out-degree threshold
    out_degrees = [G.out_degree(n) for n in G.nodes()]
    avg_out_degree = sum(out_degrees) / len(out_degrees) if out_degrees else 0
    threshold = max(3, avg_out_degree * 2)
    
    for node in G.nodes():
        if G.out_degree(node) > threshold:
            smurfing_nodes.add(node)
            suspicious_nodes.add(node)
            alerts.append(f"Account {node} flagged as a smurfing hub (> {int(threshold)} outgoing transactions).")
            
    # 2. Layering & Round-tripping Detection
    try:
        cycles = list(nx.simple_cycles(G))
        for cycle in cycles:
            if len(cycle) >= 3:
                alerts.append(f"Layering/Round-tripping loop detected involving: {' -> '.join([str(c) for c in cycle])}")
                for i in range(len(cycle)):
                    u = cycle[i]
                    v = cycle[(i + 1) % len(cycle)]
                    
                    layering_nodes.add(u)
                    suspicious_nodes.add(u)
                    
                    if i == len(cycle) - 1:
                        # The edge returning to the start of the detected cycle
                        round_trip_edges.add((u, v))
                    else:
                        layering_edges.add((u, v))
    except:
        pass
        
    # 3. Dense transaction clusters
    # High cluster density and high transaction count
    dense_nodes = feature_df[(feature_df['cluster_density'] > 0.8) & (feature_df['transaction_count'] > 5)]
    for node in dense_nodes.index:
        suspicious_nodes.add(node)
        alerts.append(f"Account {node} is part of a dense transaction cluster.")
        
    # 3. Anomaly from ML
    anomalous_nodes = feature_df[feature_df['is_anomaly']]
    for node in anomalous_nodes.index:
        suspicious_nodes.add(node)
        alerts.append(f"Account {node} flagged as an anomaly by ML model (Score: {feature_df.loc[node, 'anomaly_score']:.2f}).")
        
    # 4. High Risk Score
    high_risk_nodes = feature_df[feature_df['risk_score'] > 0.7]
    for node in high_risk_nodes.index:
        suspicious_nodes.add(node)
        alerts.append(f"Account {node} has a high fraud risk score ({feature_df.loc[node, 'risk_score']:.2f}).")
        
    # Prepare output format
    out_nodes = []
    for node in nodes:
        node_role = "normal"
        if node in smurfing_nodes:
            node_role = "smurfing"
        elif node in layering_nodes:
            node_role = "layering"
            
        out_nodes.append({
            "id": node,
            "risk_score": float(feature_df.loc[node, 'risk_score']),
            "anomaly_score": float(feature_df.loc[node, 'anomaly_score']),
            "degree_centrality": float(feature_df.loc[node, 'degree_centrality']),
            "betweenness_centrality": float(feature_df.loc[node, 'betweenness_centrality']),
            "cluster_density": float(feature_df.loc[node, 'cluster_density']),
            "is_suspicious": node in suspicious_nodes,
            "role": node_role
        })
        
    out_edges = []
    for u, v, data in G.edges(data=True):
        edge_role = "normal"
        if (u, v) in round_trip_edges:
            edge_role = "round_trip"
        elif (u, v) in layering_edges:
            edge_role = "layering"
        elif u in smurfing_nodes:
            edge_role = "fan_out"
            
        out_edges.append({
            "source": u,
            "target": v,
            "amount": float(data['weight']),
            "count": int(data['count']),
            "role": edge_role
        })
        
    result = {
        "nodes": out_nodes,
        "edges": out_edges,
        "suspicious_nodes": list(suspicious_nodes),
        "alerts": list(set(alerts)) # unique alerts
    }
    
    return result

if __name__ == "__main__":
    try:
        input_data = sys.stdin.read()
        transactions = json.loads(input_data)
        result = compute_metrics(transactions)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)
