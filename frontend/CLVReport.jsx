import React, { useState } from 'react';
import { API_BASE } from './apiBase';

export default function CLVReport() {
  const [user, setUser] = useState("");
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  const fetchCLV = async () => {
    setError(null);
    setReport(null);
    try {
      const res = await fetch(`${API_BASE}/api/clv/report?user=${encodeURIComponent(user)}`);
      if (!res.ok) throw new Error("Failed to fetch CLV");
      const json = await res.json();
      setReport(json);
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div style={{ marginBottom: '2rem' }}>
      <h2 style={{ color: '#4DA8DA' }}>📈 CLV Report</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input
          placeholder="Enter Username"
          value={user}
          onChange={e => setUser(e.target.value)}
          style={{ padding: 8, borderRadius: 8, border: '1px solid #ccc' }}
        />
        <button onClick={fetchCLV} style={{ padding: '8px 16px', borderRadius: 8, background: '#4DA8DA', color: '#fff', border: 'none' }}>
          Load CLV
        </button>
      </div>
      {error && <div style={{ color: 'salmon' }}>Error: {error}</div>}
      {report && (
        <div style={{ background: '#13294B', padding: '1rem', borderRadius: 8 }}>
          <pre>{JSON.stringify(report, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
