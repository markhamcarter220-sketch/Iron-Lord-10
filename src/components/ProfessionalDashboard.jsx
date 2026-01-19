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

// Convert decimal to American odds
const decimalToAmerican = (decimal) => {
  const dec = parseFloat(decimal);
  if (dec >= 2.0) {
    return `+${Math.round((dec - 1) * 100)}`;
  } else {
    return `${Math.round(-100 / (dec - 1))}`;
  }
};

// Calculate arbitrage opportunity
const calculateArbitrage = (odds1, odds2) => {
  const impliedProb1 = 1 / parseFloat(odds1);
  const impliedProb2 = 1 / parseFloat(odds2);
  const totalProb = impliedProb1 + impliedProb2;

  if (totalProb < 1) {
    const profit = ((1 / totalProb) - 1) * 100;
    const stake1 = (impliedProb1 / totalProb) * 100;
    const stake2 = (impliedProb2 / totalProb) * 100;
    return { hasArb: true, profit, stake1, stake2 };
  }
  return { hasArb: false };
};

export default function ProfessionalDashboard() {
  // Tab state
  const [activeTab, setActiveTab] = useState('ev'); // 'ev', 'arbitrage', 'bonus'

  // Data state
  const [sports, setSports] = useState([]);
  const [selectedSport, setSelectedSport] = useState('basketball_nba');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [oddsFormat, setOddsFormat] = useState('decimal');
  const [minEdge, setMinEdge] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // EV Calculator state
  const [selectedOdds, setSelectedOdds] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [probability, setProbability] = useState('');
  const [stake, setStake] = useState('');
  const [evResult, setEvResult] = useState(null);
  const [calculating, setCalculating] = useState(false);

  // Arbitrage state
  const [arbOpportunities, setArbOpportunities] = useState([]);

  // Bonus Bets state
  const [bonusAmount, setBonusAmount] = useState('');
  const [rolloverRequirement, setRolloverRequirement] = useState('1');
  const [maxWin, setMaxWin] = useState('');
  const [bonusOdds, setBonusOdds] = useState(null);
  const [bonusResult, setBonusResult] = useState(null);

  useEffect(() => {
    fetchSports();
  }, []);

  useEffect(() => {
    if (selectedSport) {
      fetchOdds();
    }
  }, [selectedSport]);

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh && selectedSport) {
      const interval = setInterval(() => {
        fetchOdds();
      }, 30000); // 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh, selectedSport]);

  // Calculate arbitrage opportunities when odds change
  useEffect(() => {
    if (activeTab === 'arbitrage' && events.length > 0) {
      findArbitrageOpportunities();
    }
  }, [events, activeTab]);

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

  const findArbitrageOpportunities = () => {
    const opportunities = [];

    events.forEach(event => {
      if (event.bookmakers.length < 2) return;

      // Find best odds for each outcome across all bookmakers
      const outcome1Best = { price: 0, bookmaker: null };
      const outcome2Best = { price: 0, bookmaker: null };

      event.bookmakers.forEach(bookmaker => {
        if (bookmaker.outcomes.length >= 2) {
          const out1 = bookmaker.outcomes[0];
          const out2 = bookmaker.outcomes[1];

          if (parseFloat(out1.price) > outcome1Best.price) {
            outcome1Best.price = parseFloat(out1.price);
            outcome1Best.bookmaker = bookmaker.title;
            outcome1Best.name = out1.name;
          }

          if (parseFloat(out2.price) > outcome2Best.price) {
            outcome2Best.price = parseFloat(out2.price);
            outcome2Best.bookmaker = bookmaker.title;
            outcome2Best.name = out2.name;
          }
        }
      });

      if (outcome1Best.price > 0 && outcome2Best.price > 0) {
        const arb = calculateArbitrage(outcome1Best.price, outcome2Best.price);

        if (arb.hasArb && arb.profit >= minEdge) {
          opportunities.push({
            event: `${event.away_team} @ ${event.home_team}`,
            outcome1: outcome1Best,
            outcome2: outcome2Best,
            profit: arb.profit,
            stake1: arb.stake1,
            stake2: arb.stake2
          });
        }
      }
    });

    setArbOpportunities(opportunities.sort((a, b) => b.profit - a.profit));
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

  const calculateBonusBet = () => {
    if (!bonusOdds || !bonusAmount) return;

    const bonus = parseFloat(bonusAmount);
    const odds = parseFloat(bonusOdds.price);
    const rollover = parseFloat(rolloverRequirement);
    const maxWinLimit = maxWin ? parseFloat(maxWin) : null;

    // Calculate potential profit
    let potentialWin = bonus * (odds - 1);

    // Apply max win limit if exists
    if (maxWinLimit && potentialWin > maxWinLimit) {
      potentialWin = maxWinLimit;
    }

    // Calculate EV considering rollover
    // Simple model: assume 50% chance of completing rollover
    const rolloverAmount = bonus * rollover;
    const evWithRollover = (potentialWin * 0.5) - (bonus * 0.5);

    setBonusResult({
      potentialWin,
      rolloverAmount,
      ev: evWithRollover,
      effectiveOdds: (potentialWin + bonus) / bonus
    });
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

  const selectBonusOdds = (event, bookmaker, outcome) => {
    setSelectedEvent(event);
    setBonusOdds({
      price: outcome.price,
      outcome: outcome.name,
      bookmaker: bookmaker.title,
      event: `${event.away_team} @ ${event.home_team}`
    });
    setBonusResult(null);
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
        margin: '0 auto 16px',
        borderBottom: `2px solid ${colors.accent}`,
        paddingBottom: '12px',
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: '36px',
          fontWeight: '900',
          background: `linear-gradient(135deg, ${colors.white} 0%, ${colors.accent} 100%)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '-2px',
          lineHeight: '1'
        }}>
          BETTER<br/>BETS
        </div>
        <div style={{ fontSize: '11px', color: colors.silverDark, marginTop: '6px', letterSpacing: '1px' }}>
          Where Data Drives Winning
        </div>
        <div style={{ fontSize: '10px', color: colors.accent, marginTop: '3px', fontWeight: '600' }}>
          Smarter Bets. Stronger Bets.
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto 16px',
        display: 'flex',
        gap: '8px',
        background: colors.navyLight,
        padding: '8px',
        borderRadius: '12px',
        border: `1px solid ${colors.border}`
      }}>
        <button
          onClick={() => setActiveTab('ev')}
          style={{
            flex: 1,
            padding: '12px',
            background: activeTab === 'ev' ? colors.accent : colors.navy,
            color: colors.white,
            border: 'none',
            borderRadius: '8px',
            fontWeight: '700',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          EV
        </button>
        <button
          onClick={() => setActiveTab('arbitrage')}
          style={{
            flex: 1,
            padding: '12px',
            background: activeTab === 'arbitrage' ? colors.accent : colors.navy,
            color: colors.white,
            border: 'none',
            borderRadius: '8px',
            fontWeight: '700',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          ARBITRAGE
        </button>
        <button
          onClick={() => setActiveTab('bonus')}
          style={{
            flex: 1,
            padding: '12px',
            background: activeTab === 'bonus' ? colors.accent : colors.navy,
            color: colors.white,
            border: 'none',
            borderRadius: '8px',
            fontWeight: '700',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          🎁 BONUS BETS
        </button>
      </div>

      {/* Filters & Controls */}
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
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '12px' }}>
            SPORT
          </label>
          <select
            value={selectedSport}
            onChange={(e) => setSelectedSport(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '14px',
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

        {/* Odds Format & Auto-Refresh */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '12px' }}>
              ODDS FORMAT
            </label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => setOddsFormat('decimal')}
                style={{
                  flex: 1,
                  padding: '8px',
                  background: oddsFormat === 'decimal' ? colors.accent : colors.navy,
                  color: colors.white,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '6px',
                  fontWeight: '600',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Decimal
              </button>
              <button
                onClick={() => setOddsFormat('american')}
                style={{
                  flex: 1,
                  padding: '8px',
                  background: oddsFormat === 'american' ? colors.accent : colors.navy,
                  color: colors.white,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '6px',
                  fontWeight: '600',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                American
              </button>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '12px' }}>
              AUTO-REFRESH
            </label>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              style={{
                width: '100%',
                padding: '8px',
                background: autoRefresh ? colors.green : colors.navy,
                color: colors.white,
                border: `1px solid ${colors.border}`,
                borderRadius: '6px',
                fontWeight: '600',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              {autoRefresh ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* Minimum Edge Filter (for arbitrage) */}
        {activeTab === 'arbitrage' && (
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '12px' }}>
              MINIMUM EDGE ({minEdge}%)
            </label>
            <input
              type="range"
              min="0"
              max="10"
              step="0.1"
              value={minEdge}
              onChange={(e) => setMinEdge(parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
        )}
      </div>

      {/* Loading / Error */}
      {loading && (
        <div style={{ maxWidth: '1400px', margin: '0 auto', textAlign: 'center', padding: '30px', color: colors.accent, fontSize: '13px' }}>
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
          fontSize: '12px'
        }}>
          {error}
        </div>
      )}

      {/* Tab Content */}
      {!loading && events.length > 0 && (
        <>
          {/* EV TAB */}
          {activeTab === 'ev' && (
            <>
              {/* Events */}
              <div style={{ maxWidth: '1400px', margin: '0 auto 16px' }}>
                {events.map((event) => (
                  <div key={event.id} style={{
                    background: colors.navyLight,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '10px',
                    padding: '12px',
                    marginBottom: '10px'
                  }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: colors.white, marginBottom: '3px' }}>
                      {event.away_team} @ {event.home_team}
                    </div>
                    <div style={{ fontSize: '10px', color: colors.silverDark, marginBottom: '10px' }}>
                      {new Date(event.commence_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </div>

                    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', marginLeft: '-12px', marginRight: '-12px', paddingLeft: '12px', paddingRight: '12px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${event.bookmakers.length}, minmax(110px, 1fr))`, gap: '6px', paddingBottom: '4px' }}>
                        {event.bookmakers.map((bookmaker) => (
                          <div key={bookmaker.key} style={{ background: colors.navy, borderRadius: '6px', padding: '8px', minWidth: '110px' }}>
                            <div style={{ fontSize: '9px', color: colors.silverDark, marginBottom: '5px', fontWeight: '600', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {bookmaker.title}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                              {bookmaker.outcomes.slice(0, 2).map((outcome) => (
                                <button
                                  key={outcome.name}
                                  onClick={() => selectOdds(event, bookmaker, outcome)}
                                  style={{
                                    padding: '6px',
                                    background: selectedOdds?.outcome === outcome.name && selectedOdds?.bookmaker === bookmaker.title
                                      ? colors.accent : colors.navyLight,
                                    color: colors.white,
                                    border: `1px solid ${colors.border}`,
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                    fontSize: '12px',
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

              {/* EV Calculator */}
              {selectedOdds && (
                <div style={{ maxWidth: '1400px', margin: '0 auto', background: colors.navyLight, border: `2px solid ${colors.accent}`, borderRadius: '10px', padding: '14px' }}>
                  <h3 style={{ margin: '0 0 10px', fontSize: '15px', fontWeight: '700', color: colors.white }}>Calculate EV</h3>

                  <div style={{ marginBottom: '10px', padding: '8px', background: colors.navy, borderRadius: '6px' }}>
                    <div style={{ fontSize: '11px', color: colors.silverDark }}>Selected Bet</div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: colors.white, marginTop: '3px' }}>
                      {selectedOdds.outcome} @ {formatOdds(selectedOdds.price)} ({selectedOdds.bookmaker})
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontSize: '11px', fontWeight: '600' }}>Win Prob (%)</label>
                      <input
                        type="number"
                        value={probability}
                        onChange={(e) => setProbability(e.target.value)}
                        placeholder="55"
                        style={{
                          width: '100%',
                          padding: '8px',
                          fontSize: '13px',
                          background: colors.navy,
                          color: colors.white,
                          border: `1px solid ${colors.border}`,
                          borderRadius: '6px',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontSize: '11px', fontWeight: '600' }}>Stake ($)</label>
                      <input
                        type="number"
                        value={stake}
                        onChange={(e) => setStake(e.target.value)}
                        placeholder="100"
                        style={{
                          width: '100%',
                          padding: '8px',
                          fontSize: '13px',
                          background: colors.navy,
                          color: colors.white,
                          border: `1px solid ${colors.border}`,
                          borderRadius: '6px',
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
                      padding: '12px',
                      fontSize: '14px',
                      fontWeight: '700',
                      background: probability && stake && !calculating ? colors.green : colors.silverDark,
                      color: colors.white,
                      border: 'none',
                      borderRadius: '6px',
                      cursor: probability && stake && !calculating ? 'pointer' : 'not-allowed'
                    }}
                  >
                    {calculating ? 'Calculating...' : 'Calculate EV'}
                  </button>

                  {evResult && (
                    <div style={{
                      marginTop: '12px',
                      padding: '12px',
                      background: evResult.ev_cash >= 0 ? `${colors.green}22` : `${colors.red}22`,
                      border: `2px solid ${evResult.ev_cash >= 0 ? colors.green : colors.red}`,
                      borderRadius: '6px'
                    }}>
                      <div style={{ fontSize: '11px', color: colors.silverDark, marginBottom: '5px' }}>Expected Value</div>
                      <div style={{ fontSize: '28px', fontWeight: '700', color: evResult.ev_cash >= 0 ? colors.green : colors.red }}>
                        {evResult.ev_cash >= 0 ? '+' : ''}${parseFloat(evResult.ev_cash).toFixed(2)}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* ARBITRAGE TAB */}
          {activeTab === 'arbitrage' && (
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
              <div style={{ marginBottom: '12px', fontSize: '12px', color: colors.silver }}>
                Found <strong>{arbOpportunities.length}</strong> arbitrage opportunities
              </div>

              {arbOpportunities.length === 0 ? (
                <div style={{ background: colors.navyLight, borderRadius: '10px', padding: '30px', textAlign: 'center', color: colors.silverDark }}>
                  No arbitrage opportunities found with min edge of {minEdge}%
                </div>
              ) : (
                arbOpportunities.map((arb, idx) => (
                  <div key={idx} style={{
                    background: colors.navyLight,
                    border: `2px solid ${colors.green}`,
                    borderRadius: '10px',
                    padding: '14px',
                    marginBottom: '12px'
                  }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: colors.white, marginBottom: '10px' }}>
                      {arb.event}
                    </div>

                    <div style={{ background: colors.navy, borderRadius: '6px', padding: '10px', marginBottom: '8px' }}>
                      <div style={{ fontSize: '20px', fontWeight: '700', color: colors.green }}>
                        {arb.profit.toFixed(2)}% Profit
                      </div>
                      <div style={{ fontSize: '10px', color: colors.silverDark, marginTop: '3px' }}>
                        Guaranteed profit on $100 total stake
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div style={{ background: colors.navy, borderRadius: '6px', padding: '10px' }}>
                        <div style={{ fontSize: '10px', color: colors.accent, fontWeight: '600' }}>BET 1</div>
                        <div style={{ fontSize: '12px', color: colors.white, marginTop: '4px' }}>{arb.outcome1.name}</div>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: colors.white }}>{formatOdds(arb.outcome1.price)}</div>
                        <div style={{ fontSize: '10px', color: colors.silverDark }}>{arb.outcome1.bookmaker}</div>
                        <div style={{ fontSize: '11px', color: colors.accent, marginTop: '4px', fontWeight: '600' }}>
                          Stake: ${arb.stake1.toFixed(2)}
                        </div>
                      </div>

                      <div style={{ background: colors.navy, borderRadius: '6px', padding: '10px' }}>
                        <div style={{ fontSize: '10px', color: colors.accent, fontWeight: '600' }}>BET 2</div>
                        <div style={{ fontSize: '12px', color: colors.white, marginTop: '4px' }}>{arb.outcome2.name}</div>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: colors.white }}>{formatOdds(arb.outcome2.price)}</div>
                        <div style={{ fontSize: '10px', color: colors.silverDark }}>{arb.outcome2.bookmaker}</div>
                        <div style={{ fontSize: '11px', color: colors.accent, marginTop: '4px', fontWeight: '600' }}>
                          Stake: ${arb.stake2.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    <div style={{ fontSize: '10px', color: colors.silverDark, marginTop: '8px', fontStyle: 'italic' }}>
                      ⚠️ Place both bets quickly - odds can change
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* BONUS BETS TAB */}
          {activeTab === 'bonus' && (
            <>
              {/* Bonus Bet Calculator */}
              <div style={{ maxWidth: '1400px', margin: '0 auto 16px', background: colors.navyLight, border: `2px solid ${colors.gold}`, borderRadius: '10px', padding: '14px' }}>
                <h3 style={{ margin: '0 0 10px', fontSize: '15px', fontWeight: '700', color: colors.gold }}>🎁 Bonus Bet Calculator</h3>

                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '11px', fontWeight: '600' }}>Bonus Amount ($)</label>
                  <input
                    type="number"
                    value={bonusAmount}
                    onChange={(e) => setBonusAmount(e.target.value)}
                    placeholder="e.g., 100"
                    style={{
                      width: '100%',
                      padding: '8px',
                      fontSize: '13px',
                      background: colors.navy,
                      color: colors.white,
                      border: `1px solid ${colors.border}`,
                      borderRadius: '6px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '11px', fontWeight: '600' }}>Rollover (x)</label>
                    <input
                      type="number"
                      value={rolloverRequirement}
                      onChange={(e) => setRolloverRequirement(e.target.value)}
                      placeholder="1"
                      style={{
                        width: '100%',
                        padding: '8px',
                        fontSize: '13px',
                        background: colors.navy,
                        color: colors.white,
                        border: `1px solid ${colors.border}`,
                        borderRadius: '6px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '11px', fontWeight: '600' }}>Max Win ($)</label>
                    <input
                      type="number"
                      value={maxWin}
                      onChange={(e) => setMaxWin(e.target.value)}
                      placeholder="Optional"
                      style={{
                        width: '100%',
                        padding: '8px',
                        fontSize: '13px',
                        background: colors.navy,
                        color: colors.white,
                        border: `1px solid ${colors.border}`,
                        borderRadius: '6px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                {bonusOdds && (
                  <div style={{ marginBottom: '10px', padding: '8px', background: colors.navy, borderRadius: '6px' }}>
                    <div style={{ fontSize: '11px', color: colors.gold }}>Selected Odds</div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: colors.white, marginTop: '3px' }}>
                      {bonusOdds.outcome} @ {formatOdds(bonusOdds.price)} ({bonusOdds.bookmaker})
                    </div>
                  </div>
                )}

                <button
                  onClick={calculateBonusBet}
                  disabled={!bonusOdds || !bonusAmount}
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '14px',
                    fontWeight: '700',
                    background: bonusOdds && bonusAmount ? colors.gold : colors.silverDark,
                    color: colors.navy,
                    border: 'none',
                    borderRadius: '6px',
                    cursor: bonusOdds && bonusAmount ? 'pointer' : 'not-allowed'
                  }}
                >
                  Calculate Bonus Value
                </button>

                {bonusResult && (
                  <div style={{ marginTop: '12px', padding: '12px', background: `${colors.gold}22`, border: `2px solid ${colors.gold}`, borderRadius: '6px' }}>
                    <div style={{ fontSize: '11px', color: colors.silverDark, marginBottom: '8px' }}>Bonus Bet Analysis</div>
                    <div style={{ fontSize: '13px', color: colors.silver, marginBottom: '4px' }}>
                      <strong>Potential Win:</strong> ${bonusResult.potentialWin.toFixed(2)}
                    </div>
                    <div style={{ fontSize: '13px', color: colors.silver, marginBottom: '4px' }}>
                      <strong>Rollover Req:</strong> ${bonusResult.rolloverAmount.toFixed(2)}
                    </div>
                    <div style={{ fontSize: '13px', color: colors.silver, marginBottom: '4px' }}>
                      <strong>Expected Value:</strong> ${bonusResult.ev.toFixed(2)}
                    </div>
                    <div style={{ fontSize: '10px', color: colors.silverDark, marginTop: '8px', fontStyle: 'italic' }}>
                      ⚠️ Simplified model assuming 50% rollover completion
                    </div>
                  </div>
                )}
              </div>

              {/* Events for bonus bet selection */}
              <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                <div style={{ fontSize: '11px', color: colors.silverDark, marginBottom: '8px' }}>
                  Select odds to use with bonus bet
                </div>
                {events.map((event) => (
                  <div key={event.id} style={{
                    background: colors.navyLight,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '10px',
                    padding: '12px',
                    marginBottom: '10px'
                  }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: colors.white, marginBottom: '8px' }}>
                      {event.away_team} @ {event.home_team}
                    </div>

                    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${event.bookmakers.length}, minmax(110px, 1fr))`, gap: '6px' }}>
                        {event.bookmakers.map((bookmaker) => (
                          <div key={bookmaker.key} style={{ background: colors.navy, borderRadius: '6px', padding: '8px', minWidth: '110px' }}>
                            <div style={{ fontSize: '9px', color: colors.silverDark, marginBottom: '5px', fontWeight: '600', textAlign: 'center' }}>
                              {bookmaker.title}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                              {bookmaker.outcomes.slice(0, 2).map((outcome) => (
                                <button
                                  key={outcome.name}
                                  onClick={() => selectBonusOdds(event, bookmaker, outcome)}
                                  style={{
                                    padding: '6px',
                                    background: bonusOdds?.outcome === outcome.name && bonusOdds?.bookmaker === bookmaker.title
                                      ? colors.gold : colors.navyLight,
                                    color: bonusOdds?.outcome === outcome.name && bonusOdds?.bookmaker === bookmaker.title
                                      ? colors.navy : colors.white,
                                    border: `1px solid ${colors.border}`,
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                    fontSize: '12px',
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
            </>
          )}
        </>
      )}

      {/* Footer */}
      <div style={{
        maxWidth: '1400px',
        margin: '24px auto 0',
        padding: '12px 0',
        borderTop: `1px solid ${colors.border}`,
        fontSize: '9px',
        color: colors.silverDark,
        textAlign: 'center',
        lineHeight: '1.5'
      }}>
        <p style={{ margin: '3px 0' }}>Built on The Odds API. This is a tool, not betting advice.</p>
        <p style={{ margin: '3px 0' }}>Gambling involves risk. Only bet what you can afford to lose.</p>
      </div>
    </div>
  );
}
