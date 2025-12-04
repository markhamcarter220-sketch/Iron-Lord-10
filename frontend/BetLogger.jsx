
import React, { useState } from 'react';

export default function BetLogger() {
  const [form, setForm] = useState({
    user: '',
    matchup: '',
    sportsbook: '',
    sport: '',
    odds: '',
    stake: '',
    closing_odds: ''
  });

  const [status, setStatus] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      odds: parseFloat(form.odds),
      stake: parseFloat(form.stake),
      closing_odds: form.closing_odds ? parseFloat(form.closing_odds) : null
    };

    const res = await fetch('/api/bets/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      setStatus('✅ Bet logged!');
      setForm({ user: '', matchup: '', sportsbook: '', sport: '', odds: '', stake: '', closing_odds: '' });
    } else {
      setStatus('❌ Error logging bet.');
    }
  };

  return (
    <div style={{ marginBottom: '2rem' }}>
      <h2>Log a Bet</h2>
      <form onSubmit={handleSubmit}>
        {['user', 'matchup', 'sport', 'sportsbook', 'odds', 'stake', 'closing_odds'].map((field) => (
          <div key={field}>
            <input
              name={field}
              placeholder={field.replace('_', ' ')}
              value={form[field]}
              onChange={handleChange}
              required={field !== 'closing_odds'}
              style={{ margin: '4px', padding: '6px', width: '300px' }}
            />
          </div>
        ))}
        <button type="submit" style={{ marginTop: '10px' }}>Submit</button>
      </form>
      {status && <p>{status}</p>}
    </div>
  );
}
