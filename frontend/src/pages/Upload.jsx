import { useState } from "react";
import axios from "axios";
import { Upload as UploadIcon, FileSpreadsheet, CheckCircle2, Trash2, AlertCircle } from "lucide-react";

export default function Upload() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setMessage("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post("http://localhost:5000/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setMessage(`Success: ${res.data.count} transactions processed.`);
      setSuccess(true);
      
      // Trigger an analysis after upload
      await axios.get("http://localhost:5000/api/analyze");
      
    } catch (err) {
      console.error(err);
      setMessage("Error uploading file. Please ensure it's a valid CSV.");
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (confirm("Are you sure you want to delete all database records?")) {
      try {
        await axios.post("http://localhost:5000/api/reset");
        setMessage("Database reset successfully.");
        setSuccess(true);
        setFile(null);
      } catch (err) {
        console.error(err);
        setMessage("Error resetting database.");
        setSuccess(false);
      }
    }
  };

  return (
    <div>
      <header className="page-header">
        <h1 className="page-title">Dataset Management</h1>
        <p className="page-subtitle">Upload transaction records in CSV format to analyze for suspicious graph patterns.</p>
      </header>

      <div className="card upload-container">
        {!file ? (
          <div 
            className="upload-area"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <UploadIcon className="upload-icon" />
            <h3 className="upload-text">Drag and drop your CSV file here</h3>
            <p className="upload-subtext">Columns required: sender, receiver, amount, timestamp</p>
            
            <label className="btn" style={{ display: 'inline-block', cursor: 'pointer' }}>
              Browse Files
              <input 
                type="file" 
                className="file-input" 
                accept=".csv"
                onChange={handleFileChange} 
              />
            </label>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <FileSpreadsheet size={64} color="var(--accent-primary)" style={{ marginBottom: '1rem' }} />
            <h3 style={{ marginBottom: '0.5rem' }}>{file.name}</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
              {(file.size / 1024).toFixed(2)} KB
            </p>
            
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button 
                className="btn" 
                style={{ backgroundColor: 'var(--bg-tertiary)' }}
                onClick={() => setFile(null)}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                className="btn" 
                onClick={handleUpload}
                disabled={loading}
              >
                {loading ? "Processing..." : "Run AI Analysis"}
              </button>
            </div>
          </div>
        )}

        {message && (
          <div style={{ 
            marginTop: '2rem', 
            padding: '1rem', 
            borderRadius: '8px',
            backgroundColor: success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            color: success ? 'var(--success-color)' : 'var(--danger-color)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {success ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            {message}
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop: '2rem', maxWidth: '600px', margin: '2rem auto', textAlign: 'center' }}>
        <h3 style={{ color: 'var(--danger-color)', marginBottom: '1rem' }}>Danger Zone</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Clear all transactions and fraud alerts from the database.
        </p>
        <button 
          className="btn" 
          style={{ backgroundColor: 'transparent', border: '1px solid var(--danger-color)', color: 'var(--danger-color)', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          onClick={handleReset}
        >
          <Trash2 size={16} />
          Reset Database
        </button>
      </div>
    </div>
  );
}
