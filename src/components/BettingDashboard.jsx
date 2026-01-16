import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Professional color scheme
const colors = {
  navy: '#0A1929',
  navyLight: '#132F4C',
  silver: '#C7D2DB',
  silverDark: '#8B99A8',
  accent: '#3399FF',
  accentDark: '#0066CC',
  green: '#00C853',
  greenDark: '#00A844',
  red: '#FF1744',
  gold: '#FFD700',
  white: '#FFFFFF',
  border: '#1E3A5F'
};

export default function BettingDashboard() {
  const [sports, setSports] = useState([]);
  const [selectedSport, setSelectedSport] = useState('basketball_nba');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedOdds, setSelectedOdds] = useState(null);

  // EV Calculation state
  const [probability, setProbability] = useState('');
  const [stake, setStake] = useState('');
  const [evResult, setEvResult] = useState(null);
  const [calculating, setCalculating] = useState(false);

  // Fetch available sports on mount
  useEffect(() => {
    fetchSports();
  }, []);

  // Fetch odds when sport changes
  useEffect(() => {
    if (selectedSport) {
      fetchOdds();
    }
  }, [selectedSport]);

  const fetchSports = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/odds/sports/available`);
      setSports(response.data.by_category || {});
    } catch (err) {
      console.error('Failed to fetch sports:', err);
    }
  };

  const fetchOdds = async () => {
    setLoading(true);
    setError(null);
    setEvents([]);
    setSelectedEvent(null);
    setSelectedOdds(null);
    setEvResult(null);

    try {
      const response = await axios.get(`${API_URL}/api/odds/${selectedSport}`);
      setEvents(response.data.events || []);

      if (response.data.events.length === 0) {
        setError('No games currently available for this sport');
      }
    } catch (err) {
      setError(err.response?.data?.detail?.message || 'Failed to fetch odds');
    } finally {
      setLoading(false);
    }
  };

  const calculateEV = async () => {
    if (!selectedOdds || !probability || !stake) return;

    setCalculating(true);
    try {
      const response = await axios.post(`${API_URL}/api/ev/calculate`, {
        odds: selectedOdds.price,
        true_probability: parseFloat(probability) / 100,
        cash_stake: parseFloat(stake),
        odds_timestamp: selectedOdds.timestamp,
        odds_source: 'the-odds-api-v4',
        event_description: `${selectedEvent.away_team} @ ${selectedEvent.home_team}`,
        outcome_name: selectedOdds.outcome,
        bookmaker_name: selectedOdds.bookmaker
      });
      setEvResult(response.data);
    } catch (err) {
      console.error('EV calculation failed:', err);
    } finally {
      setCalculating(false);
    }
  };

  const selectOdds = (event, bookmaker, outcome) => {
    setSelectedEvent(event);
    setSelectedOdds({
      price: outcome.price,
      outcome: outcome.name,
      bookmaker: bookmaker.title,
      timestamp: bookmaker.last_update
    });
    setEvResult(null);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${colors.navy} 0%, ${colors.navyLight} 100%)`,
      color: colors.silver,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: '20px'
    }}>
      {/* Header */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto 30px',
        borderBottom: `2px solid ${colors.accent}`,
        paddingBottom: '20px'
      }}>
        <h1 style={{
          margin: 0,
          fontSize: '36px',
          fontWeight: '700',
          background: `linear-gradient(to right, ${colors.white}, ${colors.accent})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '-1px'
        }}>
          Better Bets
        </h1>
        <p style={{ margin: '8px 0 0', color: colors.silverDark, fontSize: '14px' }}>
          Professional EV Calculator • Multiple Sportsbooks • Real-Time Odds
        </p>
      </div>

      {/* Sport Selector */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto 20px',
        background: colors.navyLight,
        border: `1px solid ${colors.border}`,
        borderRadius: '12px',
        padding: '20px'
      }}>
        <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600', fontSize: '14px' }}>
          Select Sport
        </label>
        <select
          value={selectedSport}
          onChange={(e) => setSelectedSport(e.target.value)}
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '16px',
            background: colors.navy,
            color: colors.silver,
            border: `1px solid ${colors.border}`,
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          {Object.entries(sports).map(([category, sportsList]) => (
            <optgroup key={category} label={category}>
              {sportsList.map((sport) => (
                <option key={sport.key} value={sport.key}>
                  {sport.icon} {sport.title}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {/* Loading / Error States */}
      {loading && (
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          textAlign: 'center',
          padding: '40px',
          color: colors.accent
        }}>
          Loading odds...
        </div>
      )}

      {error && (
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          background: `${colors.red}22`,
          border: `1px solid ${colors.red}`,
          borderRadius: '8px',
          padding: '16px',
          color: colors.silver
        }}>
          {error}
        </div>
      )}

      {/* Events Table */}
      {!loading && events.length > 0 && (
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          background: colors.navyLight,
          border: `1px solid ${colors.border}`,
          borderRadius: '12px',
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: colors.navy, borderBottom: `1px solid ${colors.border}` }}>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: colors.silverDark }}>
                  EVENT
                </th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: colors.silverDark }}>
                  TIME
                </th>
                {events[0]?.bookmakers.map((book) => (
                  <th key={book.key} style={{ padding: '16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: colors.silverDark }}>
                    {book.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: colors.silver }}>
                      {event.away_team} @ {event.home_team}
                    </div>
                  </td>
                  <td style={{ padding: '16px', fontSize: '12px', color: colors.silverDark }}>
                    {new Date(event.commence_time).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </td>
                  {event.bookmakers.map((bookmaker) => (
                    <td key={bookmaker.key} style={{ padding: '8px' }}>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                        {bookmaker.outcomes.slice(0, 2).map((outcome) => (
                          <button
                            key={outcome.name}
                            onClick={() => selectOdds(event, bookmaker, outcome)}
                            style={{
                              padding: '8px 12px',
                              background: selectedOdds?.outcome === outcome.name && selectedOdds?.bookmaker === bookmaker.title
                                ? colors.accent
                                : colors.navy,
                              color: colors.white,
                              border: `1px solid ${colors.border}`,
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '13px',
                              fontWeight: '600',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              if (!(selectedOdds?.outcome === outcome.name && selectedOdds?.bookmaker === bookmaker.title)) {
                                e.target.style.background = colors.accentDark;
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!(selectedOdds?.outcome === outcome.name && selectedOdds?.bookmaker === bookmaker.title)) {
                                e.target.style.background = colors.navy;
                              }
                            }}
                          >
                            {parseFloat(outcome.price).toFixed(2)}
                          </button>
                        ))}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* EV Calculator Panel */}
      {selectedOdds && (
        <div style={{
          maxWidth: '1400px',
          margin: '20px auto 0',
          background: colors.navyLight,
          border: `2px solid ${colors.accent}`,
          borderRadius: '12px',
          padding: '24px'
        }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: '700', color: colors.white }}>
            Calculate Expected Value
          </h3>

          <div style={{ marginBottom: '16px', padding: '12px', background: colors.navy, borderRadius: '8px' }}>
            <div style={{ fontSize: '14px', color: colors.silverDark }}>Selected Bet</div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: colors.white, marginTop: '4px' }}>
              {selectedOdds.outcome} @ {selectedOdds.price} ({selectedOdds.bookmaker})
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
                Your Win Probability (%)
              </label>
              <input
                type="number"
                value={probability}
                onChange={(e) => setProbability(e.target.value)}
                placeholder="e.g., 55"
                min="0"
                max="100"
                step="0.1"
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '16px',
                  background: colors.navy,
                  color: colors.white,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
                Stake Amount ($)
              </label>
              <input
                type="number"
                value={stake}
                onChange={(e) => setStake(e.target.value)}
                placeholder="e.g., 100"
                min="0"
                step="1"
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '16px',
                  background: colors.navy,
                  color: colors.white,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <button
            onClick={calculateEV}
            disabled={!probability || !stake || calculating}
            style={{
              width: '100%',
              padding: '16px',
              fontSize: '16px',
              fontWeight: '700',
              background: probability && stake && !calculating ? colors.green : colors.silverDark,
              color: colors.white,
              border: 'none',
              borderRadius: '8px',
              cursor: probability && stake && !calculating ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s'
            }}
          >
            {calculating ? 'Calculating...' : 'Calculate EV'}
          </button>

          {/* EV Result */}
          {evResult && (
            <div style={{
              marginTop: '20px',
              padding: '20px',
              background: evResult.ev_cash >= 0 ? `${colors.green}22` : `${colors.red}22`,
              border: `2px solid ${evResult.ev_cash >= 0 ? colors.green : colors.red}`,
              borderRadius: '8px'
            }}>
              <div style={{ fontSize: '14px', color: colors.silverDark, marginBottom: '8px' }}>
                Expected Value
              </div>
              <div style={{
                fontSize: '48px',
                fontWeight: '700',
                color: evResult.ev_cash >= 0 ? colors.green : colors.red
              }}>
                {evResult.ev_cash >= 0 ? '+' : ''}${parseFloat(evResult.ev_cash).toFixed(2)}
              </div>

              {evResult.odds_source_detail && (
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: `1px solid ${colors.border}` }}>
                  <div style={{ fontSize: '12px', color: colors.silverDark }}>
                    <strong>Event:</strong> {evResult.odds_source_detail.event}<br />
                    <strong>Betting On:</strong> {evResult.odds_source_detail.outcome}<br />
                    <strong>Sportsbook:</strong> {evResult.odds_source_detail.bookmaker}<br />
                    <strong>Formula:</strong> {evResult.formula_used}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div style={{
        maxWidth: '1400px',
        margin: '40px auto 0',
        padding: '20px 0',
        borderTop: `1px solid ${colors.border}`,
        fontSize: '12px',
        color: colors.silverDark,
        textAlign: 'center'
      }}>
        <p>This tool calculates Expected Value based on YOUR probability estimate. Not betting advice.</p>
        <p>Gambling involves risk. Only bet what you can afford to lose.</p>
      </div>
    </div>
  );
}
