import React, { useState, useEffect, useCallback } from 'react';
import CalculationBreakdown from './CalculationBreakdown';

export default function BetHistory() {
  const [bets, setBets] = useState([]);
  const [username, setUsername] = useState('testuser');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBets = useCallback(async () => {
    if (!username) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/bets/history/${username}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setBets(data.bets || []);
    } catch (error) {
      console.error('Error fetching bets:', error);
      setError(error.message || 'Failed to fetch bets');
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    fetchBets();
  }, [fetchBets]);

  const containerStyle = {
    margin: '16px 0',
    padding: 16,
    background: '#1c2541',
    borderRadius: 8
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  };

  const inputStyle = {
    padding: 8,
    borderRadius: 4,
    border: '1px solid #4cc9f0',
    background: '#0d1b2a',
    color: 'white',
    marginRight: 8
  };

  const buttonStyle = {
    padding: '8px 16px',
    background: '#4cc9f0',
    color: '#0A1128',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
    fontWeight: 'bold'
  };

  const betCardStyle = {
    background: '#0d1b2a',
    border: '1px solid #1b263b',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12
  };

  const betHeaderStyle = {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4cc9f0',
    marginBottom: 8
  };

  const betDetailStyle = {
    fontSize: 14,
    color: '#b5b5b5',
    marginBottom: 4
  };

  const statsRowStyle = {
    display: 'flex',
    gap: 16,
    marginTop: 12,
    paddingTop: 12,
    borderTop: '1px solid #1b263b'
  };

  const statStyle = {
    flex: 1
  };

  const statLabelStyle = {
    fontSize: 12,
    color: '#888',
    marginBottom: 2
  };

  const statValueStyle = {
    fontSize: 16,
    fontWeight: 'bold'
  };

  const getStatColor = (value, type) => {
    if (type === 'clv' || type === 'ev') {
      return value > 0 ? '#06ffa5' : value < 0 ? '#ff006e' : '#adb5bd';
    }
    return '#4cc9f0';
  };

  const errorStyle = {
    background: '#2d0a0f',
    border: '1px solid #ff006e',
    borderRadius: 4,
    padding: 12,
    color: '#ff006e',
    marginBottom: 16
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h2 style={{ margin: 0, color: '#C0C0C0' }}>Bet History</h2>
        <div>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={inputStyle}
          />
          <button onClick={fetchBets} style={buttonStyle} disabled={loading}>
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div style={errorStyle}>
          Error: {error}
        </div>
      )}

      {bets.length === 0 && !error ? (
        <div style={{ color: '#888', fontStyle: 'italic', textAlign: 'center', padding: 20 }}>
          {loading ? 'Loading bets...' : 'No bets found. Start logging your picks!'}
        </div>
      ) : !error ? (
        <div>
          {bets.map((bet, idx) => (
            <div key={bet.id || idx} style={betCardStyle}>
              <div style={betHeaderStyle}>{bet.matchup}</div>
              <div style={betDetailStyle}>
                <strong>Sport:</strong> {bet.sport} | <strong>Book:</strong> {bet.sportsbook}
              </div>
              <div style={betDetailStyle}>
                <strong>Odds:</strong> {bet.odds} | <strong>Stake:</strong> ${bet.stake}
                {bet.closing_odds && <span> | <strong>Closing Odds:</strong> {bet.closing_odds}</span>}
              </div>
              {bet.result && (
                <div style={betDetailStyle}>
                  <strong>Result:</strong> <span style={{ color: bet.result === 'win' ? '#06ffa5' : bet.result === 'lose' ? '#ff006e' : '#adb5bd', textTransform: 'uppercase' }}>{bet.result}</span>
                </div>
              )}

              <div style={statsRowStyle}>
                {bet.clv !== null && bet.clv !== undefined && (
                  <div style={statStyle}>
                    <div style={statLabelStyle}>CLV</div>
                    <div style={{ ...statValueStyle, color: getStatColor(bet.clv, 'clv') }}>
                      {(bet.clv * 100).toFixed(2)}%
                    </div>
                  </div>
                )}
                {bet.expectedValue !== null && bet.expectedValue !== undefined && (
                  <div style={statStyle}>
                    <div style={statLabelStyle}>Expected Value</div>
                    <div style={{ ...statValueStyle, color: getStatColor(bet.expectedValue, 'ev') }}>
                      {bet.expectedValue}%
                    </div>
                  </div>
                )}
                {bet.kellySize !== null && bet.kellySize !== undefined && (
                  <div style={statStyle}>
                    <div style={statLabelStyle}>Kelly Size</div>
                    <div style={{ ...statValueStyle, color: '#4cc9f0' }}>
                      ${bet.kellySize}
                    </div>
                  </div>
                )}
              </div>

              {bet.calculation_breakdown && (
                <CalculationBreakdown breakdown={bet.calculation_breakdown} />
              )}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
