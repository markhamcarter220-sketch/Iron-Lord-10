import React, { useState } from 'react';

export default function BetLogger() {
  const [formData, setFormData] = useState({
    user: 'testuser',
    matchup: '',
    sportsbook: '',
    sport: '',
    odds: '',
    stake: '',
    closing_odds: '',
    result: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Prepare payload (convert numbers, handle optional fields)
      const payload = {
        user: formData.user,
        matchup: formData.matchup,
        sportsbook: formData.sportsbook,
        sport: formData.sport,
        odds: parseFloat(formData.odds),
        stake: parseFloat(formData.stake),
        ...(formData.closing_odds && { closing_odds: parseFloat(formData.closing_odds) }),
        ...(formData.result && { result: formData.result })
      };

      const response = await fetch('/api/bets/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Bet logged:', data);
      setSuccess(true);

      // Reset form except user
      setFormData({
        user: formData.user,
        matchup: '',
        sportsbook: '',
        sport: '',
        odds: '',
        stake: '',
        closing_odds: '',
        result: ''
      });

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error logging bet:', err);
      setError(err.message || 'Failed to log bet');
    } finally {
      setLoading(false);
    }
  };

  const containerStyle = {
    margin: '16px 0',
    padding: 16,
    background: '#1c2541',
    borderRadius: 8
  };

  const formStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
    marginTop: 12
  };

  const fullWidthStyle = {
    gridColumn: '1 / -1'
  };

  const labelStyle = {
    display: 'block',
    fontSize: 13,
    color: '#adb5bd',
    marginBottom: 4,
    fontWeight: 'bold'
  };

  const inputStyle = {
    width: '100%',
    padding: 8,
    borderRadius: 4,
    border: '1px solid #4cc9f0',
    background: '#0d1b2a',
    color: 'white',
    fontSize: 14,
    boxSizing: 'border-box'
  };

  const selectStyle = {
    ...inputStyle,
    cursor: 'pointer'
  };

  const buttonStyle = {
    padding: '10px 16px',
    background: '#4cc9f0',
    color: '#0A1128',
    border: 'none',
    borderRadius: 4,
    cursor: loading ? 'not-allowed' : 'pointer',
    fontWeight: 'bold',
    fontSize: 14,
    opacity: loading ? 0.6 : 1
  };

  const messageStyle = (isError) => ({
    padding: 12,
    borderRadius: 4,
    marginTop: 12,
    background: isError ? '#2d0a0f' : '#0a2d1f',
    border: `1px solid ${isError ? '#ff006e' : '#06ffa5'}`,
    color: isError ? '#ff006e' : '#06ffa5'
  });

  return (
    <div style={containerStyle}>
      <h2 style={{ margin: 0, color: '#C0C0C0', marginBottom: 4 }}>Log a Bet</h2>
      <p style={{ margin: 0, fontSize: 13, color: '#888' }}>Track your picks and analyze your betting performance</p>

      <form onSubmit={handleSubmit} style={formStyle}>
        <div>
          <label style={labelStyle}>Username *</label>
          <input
            type="text"
            name="user"
            value={formData.user}
            onChange={handleChange}
            required
            style={inputStyle}
            placeholder="Enter username"
          />
        </div>

        <div>
          <label style={labelStyle}>Sport *</label>
          <select
            name="sport"
            value={formData.sport}
            onChange={handleChange}
            required
            style={selectStyle}
          >
            <option value="">Select sport</option>
            <option value="basketball">Basketball</option>
            <option value="football">Football</option>
            <option value="baseball">Baseball</option>
            <option value="hockey">Hockey</option>
            <option value="soccer">Soccer</option>
            <option value="mma">MMA</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div style={fullWidthStyle}>
          <label style={labelStyle}>Matchup *</label>
          <input
            type="text"
            name="matchup"
            value={formData.matchup}
            onChange={handleChange}
            required
            style={inputStyle}
            placeholder="e.g., Lakers vs Celtics"
          />
        </div>

        <div>
          <label style={labelStyle}>Sportsbook *</label>
          <input
            type="text"
            name="sportsbook"
            value={formData.sportsbook}
            onChange={handleChange}
            required
            style={inputStyle}
            placeholder="e.g., FanDuel"
          />
        </div>

        <div>
          <label style={labelStyle}>Odds (Decimal) *</label>
          <input
            type="number"
            step="0.01"
            name="odds"
            value={formData.odds}
            onChange={handleChange}
            required
            style={inputStyle}
            placeholder="e.g., 2.10"
            min="1.01"
          />
        </div>

        <div>
          <label style={labelStyle}>Stake ($) *</label>
          <input
            type="number"
            step="0.01"
            name="stake"
            value={formData.stake}
            onChange={handleChange}
            required
            style={inputStyle}
            placeholder="e.g., 100"
            min="0.01"
          />
        </div>

        <div>
          <label style={labelStyle}>Closing Odds (Optional)</label>
          <input
            type="number"
            step="0.01"
            name="closing_odds"
            value={formData.closing_odds}
            onChange={handleChange}
            style={inputStyle}
            placeholder="e.g., 2.00"
            min="1.01"
          />
        </div>

        <div style={fullWidthStyle}>
          <label style={labelStyle}>Result (Optional)</label>
          <select
            name="result"
            value={formData.result}
            onChange={handleChange}
            style={selectStyle}
          >
            <option value="">Not settled yet</option>
            <option value="win">Win</option>
            <option value="lose">Lose</option>
            <option value="push">Push</option>
          </select>
        </div>

        <div style={fullWidthStyle}>
          <button type="submit" style={buttonStyle} disabled={loading}>
            {loading ? 'Logging Bet...' : 'Log Bet'}
          </button>
        </div>
      </form>

      {success && (
        <div style={messageStyle(false)}>
          ✓ Bet logged successfully! Check Bet History below.
        </div>
      )}

      {error && (
        <div style={messageStyle(true)}>
          ✗ Error: {error}
        </div>
      )}
    </div>
  );
}
