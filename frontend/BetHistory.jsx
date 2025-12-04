
import React, { useState, useEffect } from 'react';

export default function BetHistory() {
  const [user, setUser] = useState('');
  const [bets, setBets] = useState([]);

  const fetchHistory = async () => {
    if (!user) return;
    const res = await fetch(`/api/bets/history/${user}`);
    const data = await res.json();
    setBets(data.bets || []);
  };

  return (
    <div>
      <h2>Bet History</h2>
      <input
        placeholder="Enter user"
        value={user}
        onChange={(e) => setUser(e.target.value)}
        style={{ marginBottom: '8px', padding: '6px', width: '200px' }}
      />
      <button onClick={fetchHistory} style={{ marginLeft: '8px' }}>Load Bets</button>

      {bets.map((bet) => (
        <div key={bet.id} style={{
          marginTop: '12px',
          padding: '10px',
          border: '1px solid #333',
          borderRadius: '6px',
          backgroundColor: '#1A1A1A'
        }}>
          <div><strong>Matchup:</strong> {bet.matchup} ({bet.sport})</div>
          <div><strong>Odds:</strong> {bet.odds} @ {bet.sportsbook}</div>
          <div><strong>Stake:</strong> ${bet.stake}</div>
          <div><strong>EV:</strong> <span style={{ color: bet.expectedValue > 0 ? 'lime' : 'red' }}>{bet.expectedValue}%</span></div>
          {bet.clv !== null && (
            <div><strong>CLV:</strong> <span style={{ color: bet.clv > 0 ? 'lime' : 'red' }}>{(bet.clv * 100).toFixed(1)}%</span></div>
          )}
          <div><strong>Kelly Stake:</strong> ${bet.kellySize}</div>
          <div><strong>Logged:</strong> {new Date(bet.loggedAt).toLocaleString()}</div>
        </div>
      ))}
    </div>
  );
}
