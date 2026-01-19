import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Professional color scheme matching logo
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

// Convert decimal odds to American odds
const decimalToAmerican = (decimal) => {
  const dec = parseFloat(decimal);
  if (dec >= 2.0) {
    return `+${Math.round((dec - 1) * 100)}`;
  } else {
    return `${Math.round(-100 / (dec - 1))}`;
  }
};

export default function BettingDashboard() {
  const [sports, setSports] = useState([]);
  const [selectedSport, setSelectedSport] = useState('basketball_nba');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedOdds, setSelectedOdds] = useState(null);
  const [oddsFormat, setOddsFormat] = useState('decimal'); // 'decimal' or 'american'

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

  const formatOdds = (decimal) => {
    return oddsFormat === 'american' ? decimalToAmerican(decimal) : parseFloat(decimal).toFixed(2);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${colors.navy} 0%, ${colors.navyLight} 100%)`,
      color: colors.silver,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: '12px'
    }}>
      {/* Logo & Header */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto 20px',
        borderBottom: `2px solid ${colors.accent}`,
        paddingBottom: '16px',
        textAlign: 'center'
      }}>
        {/* Logo */}
        <div style={{
          fontSize: '48px',
          fontWeight: '900',
          background: `linear-gradient(135deg, ${colors.white} 0%, ${colors.accent} 100%)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '-2px',
          marginBottom: '8px',
          lineHeight: '1'
        }}>
          BETTER<br/>BETS
        </div>

        {/* Taglines */}
        <div style={{
          fontSize: '12px',
          color: colors.silverDark,
          marginTop: '8px',
          letterSpacing: '1px'
        }}>
          Where Data Drives Winning
        </div>
        <div style={{
          fontSize: '11px',
          color: colors.accent,
          marginTop: '4px',
          fontWeight: '600'
        }}>
          Smarter Bets. Stronger Bets.
        </div>
      </div>

      {/* Controls Row - Mobile Responsive */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto 16px',
        background: colors.navyLight,
        border: `1px solid ${colors.border}`,
        borderRadius: '12px',
        padding: '16px'
      }}>
        {/* Sport Selector */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '13px' }}>
            Sport
          </label>
          <select
            value={selectedSport}
            onChange={(e) => setSelectedSport(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '15px',
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

        {/* Odds Format Toggle */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '13px' }}>
            Odds Format
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setOddsFormat('decimal')}
              style={{
                flex: 1,
                padding: '10px',
                background: oddsFormat === 'decimal' ? colors.accent : colors.navy,
                color: colors.white,
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Decimal
            </button>
            <button
              onClick={() => setOddsFormat('american')}
              style={{
                flex: 1,
                padding: '10px',
                background: oddsFormat === 'american' ? colors.accent : colors.navy,
                color: colors.white,
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              American
            </button>
          </div>
        </div>
      </div>

      {/* Loading / Error States */}
      {loading && (
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          textAlign: 'center',
          padding: '40px 20px',
          color: colors.accent,
          fontSize: '14px'
        }}>
          Loading odds...
        </div>
      )}

      {error && (
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto 16px',
          background: `${colors.red}22`,
          border: `1px solid ${colors.red}`,
          borderRadius: '8px',
          padding: '12px',
          color: colors.silver,
          fontSize: '13px'
        }}>
          {error}
        </div>
      )}

      {/* Events Table - Mobile Optimized */}
      {!loading && events.length > 0 && (
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto 16px'
        }}>
          {events.map((event) => (
            <div key={event.id} style={{
              background: colors.navyLight,
              border: `1px solid ${colors.border}`,
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '12px'
            }}>
              {/* Event Info */}
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: colors.white,
                marginBottom: '4px'
              }}>
                {event.away_team} @ {event.home_team}
              </div>
              <div style={{
                fontSize: '11px',
                color: colors.silverDark,
                marginBottom: '12px'
              }}>
                {new Date(event.commence_time).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit'
                })}
              </div>

              {/* Bookmakers - Mobile Scroll */}
              <div style={{
                overflowX: 'auto',
                WebkitOverflowScrolling: 'touch',
                marginLeft: '-16px',
                marginRight: '-16px',
                paddingLeft: '16px',
                paddingRight: '16px'
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${event.bookmakers.length}, minmax(120px, 1fr))`,
                  gap: '8px',
                  paddingBottom: '4px'
                }}>
                  {event.bookmakers.map((bookmaker) => (
                    <div key={bookmaker.key} style={{
                      background: colors.navy,
                      borderRadius: '8px',
                      padding: '10px',
                      minWidth: '120px'
                    }}>
                      <div style={{
                        fontSize: '10px',
                        color: colors.silverDark,
                        marginBottom: '6px',
                        fontWeight: '600',
                        textAlign: 'center',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {bookmaker.title}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {bookmaker.outcomes.slice(0, 2).map((outcome) => (
                          <button
                            key={outcome.name}
                            onClick={() => selectOdds(event, bookmaker, outcome)}
                            style={{
                              padding: '8px',
                              background: selectedOdds?.outcome === outcome.name && selectedOdds?.bookmaker === bookmaker.title
                                ? colors.accent
                                : colors.navyLight,
                              color: colors.white,
                              border: `1px solid ${colors.border}`,
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '13px',
                              fontWeight: '700',
                              textAlign: 'center'
                            }}
                          >
                            {formatOdds(outcome.price)}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* EV Calculator Panel - Mobile Optimized */}
      {selectedOdds && (
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          background: colors.navyLight,
          border: `2px solid ${colors.accent}`,
          borderRadius: '12px',
          padding: '16px'
        }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: '700', color: colors.white }}>
            Calculate EV
          </h3>

          <div style={{ marginBottom: '12px', padding: '10px', background: colors.navy, borderRadius: '8px' }}>
            <div style={{ fontSize: '12px', color: colors.silverDark }}>Selected Bet</div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: colors.white, marginTop: '4px' }}>
              {selectedOdds.outcome} @ {formatOdds(selectedOdds.price)} ({selectedOdds.bookmaker})
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '600' }}>
                Win Probability (%)
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
                  padding: '10px',
                  fontSize: '14px',
                  background: colors.navy,
                  color: colors.white,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '600' }}>
                Stake ($)
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
                  padding: '10px',
                  fontSize: '14px',
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
              padding: '14px',
              fontSize: '15px',
              fontWeight: '700',
              background: probability && stake && !calculating ? colors.green : colors.silverDark,
              color: colors.white,
              border: 'none',
              borderRadius: '8px',
              cursor: probability && stake && !calculating ? 'pointer' : 'not-allowed'
            }}
          >
            {calculating ? 'Calculating...' : 'Calculate EV'}
          </button>

          {/* EV Result */}
          {evResult && (
            <div style={{
              marginTop: '16px',
              padding: '16px',
              background: evResult.ev_cash >= 0 ? `${colors.green}22` : `${colors.red}22`,
              border: `2px solid ${evResult.ev_cash >= 0 ? colors.green : colors.red}`,
              borderRadius: '8px'
            }}>
              <div style={{ fontSize: '12px', color: colors.silverDark, marginBottom: '6px' }}>
                Expected Value
              </div>
              <div style={{
                fontSize: '36px',
                fontWeight: '700',
                color: evResult.ev_cash >= 0 ? colors.green : colors.red
              }}>
                {evResult.ev_cash >= 0 ? '+' : ''}${parseFloat(evResult.ev_cash).toFixed(2)}
              </div>

              {evResult.odds_source_detail && (
                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: `1px solid ${colors.border}`, fontSize: '11px' }}>
                  <div style={{ color: colors.silverDark }}>
                    <strong>Event:</strong> {evResult.odds_source_detail.event}<br />
                    <strong>Betting On:</strong> {evResult.odds_source_detail.outcome}<br />
                    <strong>Sportsbook:</strong> {evResult.odds_source_detail.bookmaker}
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
        margin: '32px auto 0',
        padding: '16px 0',
        borderTop: `1px solid ${colors.border}`,
        fontSize: '10px',
        color: colors.silverDark,
        textAlign: 'center',
        lineHeight: '1.6'
      }}>
        <p style={{ margin: '4px 0' }}>Built on The Odds API. Fair odds estimated by devigging the market.</p>
        <p style={{ margin: '4px 0' }}>This is a tool, not betting advice. Gambling involves risk.</p>
      </div>
    </div>
  );
}
