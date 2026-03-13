import { NavLink } from "react-router-dom";
import { Activity, UploadCloud, ShieldAlert } from "lucide-react";

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <ShieldAlert size={28} color="var(--accent-primary)" />
        TraceLattice
      </div>
      
      <nav className="nav-links">
        <NavLink 
          to="/" 
          end
          className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
        >
          <Activity size={20} />
          Dashboard
        </NavLink>
        
        <NavLink 
          to="/upload" 
          className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
        >
          <UploadCloud size={20} />
          Upload Data
        </NavLink>
      </nav>

      <div style={{ marginTop: 'auto', padding: '1rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        <p style={{ marginBottom: '0.5rem', color: 'var(--text-primary)', fontWeight: '600' }}>AI Investigation System</p>
        <p>Active and monitoring network paths.</p>
      </div>
    </aside>
  );
}
