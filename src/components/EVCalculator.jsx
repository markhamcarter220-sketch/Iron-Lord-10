import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function EVCalculator() {
  // Odds state
  const [odds, setOdds] = useState(null);
  const [oddsTimestamp, setOddsTimestamp] = useState(null);
  const [oddsAge, setOddsAge] = useState(null);
  const [loading, setLoading] = useState(false);
  const [oddsError, setOddsError] = useState(null);

  // Input state
  const [probability, setProbability] = useState('');
  const [stake, setStake] = useState('');

  // Result state
  const [evResult, setEvResult] = useState(null);
  const [evError, setEvError] = useState(null);
  const [calculating, setCalculating] = useState(false);

  // Disclaimer acknowledgment
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);

  // Update odds age every second
  useEffect(() => {
    if (!oddsTimestamp) return;

    const interval = setInterval(() => {
      const age = Math.floor((Date.now() - new Date(oddsTimestamp).getTime()) / 1000);
      setOddsAge(age);
    }, 1000);

    return () => clearInterval(interval);
  }, [oddsTimestamp]);

  // Fetch odds
  const fetchOdds = async () => {
    setLoading(true);
    setOddsError(null);
    setEvResult(null); // Clear previous result when refreshing

    try {
      // For MVP: Fetch NFL odds
      const response = await axios.get(`${API_URL}/api/odds/americanfootball_nfl`);

      if (response.data.events.length === 0) {
        setOddsError('No games available. Try another sport.');
        setLoading(false);
        return;
      }

      // Get first event with odds
      const event = response.data.events[0];
      if (!event.bookmakers || event.bookmakers.length === 0) {
        setOddsError('No bookmakers available for this event.');
        setLoading(false);
        return;
      }

      const bookmaker = event.bookmakers[0];
      const outcome = bookmaker.outcomes[0];

      setOdds({
        event: `${event.home_team} vs ${event.away_team}`,
        outcome: outcome.name,
        price: parseFloat(outcome.price),
        bookmaker: bookmaker.title,
        last_update: bookmaker.last_update
      });
      setOddsTimestamp(bookmaker.last_update);
      setOddsAge(0);
      setLoading(false);
    } catch (error) {
      setOddsError(error.response?.data?.detail?.message || error.message || 'Failed to fetch odds');
      setLoading(false);
    }
  };

  // Calculate EV
  const calculateEV = async () => {
    setCalculating(true);
    setEvError(null);

    try {
      const response = await axios.post(`${API_URL}/api/ev/calculate`, {
        odds: odds.price,
        true_probability: parseFloat(probability) / 100, // Convert percentage to decimal
        cash_stake: parseFloat(stake),
        odds_timestamp: oddsTimestamp,
        odds_source: 'the-odds-api-v4',
        // Transparency fields
        event_description: odds.event,
        outcome_name: odds.outcome,
        bookmaker_name: odds.bookmaker
      });

      setEvResult(response.data);
      setCalculating(false);
    } catch (error) {
      const detail = error.response?.data?.detail;
      if (typeof detail === 'object') {
        setEvError(detail.message || detail.error || 'Calculation failed');
      } else {
        setEvError(detail || error.message || 'Calculation failed');
      }
      setCalculating(false);
    }
  };

  // Validation
  const isStale = oddsAge !== null && oddsAge > 60;
  const canCalculate =
    odds &&
    probability &&
    stake &&
    parseFloat(probability) > 0 &&
    parseFloat(probability) < 100 &&
    parseFloat(stake) > 0 &&
    !isStale &&
    disclaimerAccepted;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 20, fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 700 }}>Better Bets</h1>
        <p style={{ margin: '8px 0 0', color: '#666', fontSize: 14 }}>
          Mathematically correct EV calculator • MVP v0.1.0
        </p>
      </div>

      {/* Warning Banner */}
      <div style={{
        background: '#FFF3CD',
        border: '1px solid #FFE69C',
        borderRadius: 8,
        padding: 16,
        marginBottom: 24,
        fontSize: 14
      }}>
        <strong>⚠️ MVP Limitations:</strong>
        <ul style={{ margin: '8px 0 0', paddingLeft: 20 }}>
          <li>Only supports straight cash bets (no bonuses/insurance/parlays)</li>
          <li>Only DraftKings sportsbook</li>
          <li>Only head-to-head (moneyline) markets</li>
          <li>EV requires YOUR probability estimate (not advice)</li>
        </ul>
      </div>

      {/* Odds Section */}
      <div style={{
        background: '#F8F9FA',
        borderRadius: 8,
        padding: 20,
        marginBottom: 24
      }}>
        <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 600 }}>1. Get Current Odds</h2>

        <button
          onClick={fetchOdds}
          disabled={loading}
          style={{
            background: loading ? '#ccc' : '#007BFF',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            padding: '12px 24px',
            fontSize: 16,
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            marginBottom: 16
          }}
        >
          {loading ? 'Loading...' : odds ? 'Refresh Odds' : 'Fetch Odds'}
        </button>

        {oddsError && (
          <div style={{ background: '#F8D7DA', color: '#721C24', padding: 12, borderRadius: 6, fontSize: 14 }}>
            {oddsError}
          </div>
        )}

        {odds && (
          <div style={{ background: 'white', borderRadius: 6, padding: 16 }}>
            <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
              {odds.event}
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>
              {odds.outcome}: <span style={{ color: '#007BFF' }}>{odds.price.toFixed(2)}</span>
            </div>
            <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
              {odds.bookmaker} • Decimal Odds
            </div>
            <div style={{
              fontSize: 13,
              fontWeight: 600,
              color: isStale ? '#DC3545' : oddsAge > 30 ? '#FFC107' : '#28A745'
            }}>
              {isStale && '🔴 '}
              {!isStale && oddsAge > 30 && '⚠️ '}
              {!isStale && oddsAge <= 30 && '✅ '}
              Updated {oddsAge}s ago
              {isStale && ' (TOO OLD - REFRESH REQUIRED)'}
            </div>
          </div>
        )}
      </div>

      {/* Input Section */}
      {odds && (
        <div style={{
          background: '#F8F9FA',
          borderRadius: 8,
          padding: 20,
          marginBottom: 24
        }}>
          <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 600 }}>2. Enter Your Estimate</h2>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 600 }}>
              Your Probability Estimate (%)
            </label>
            <input
              type="number"
              value={probability}
              onChange={(e) => setProbability(e.target.value)}
              placeholder="e.g., 52 for 52%"
              min="0.01"
              max="99.99"
              step="0.01"
              style={{
                width: '100%',
                padding: 12,
                fontSize: 16,
                border: '2px solid #DDD',
                borderRadius: 6,
                boxSizing: 'border-box'
              }}
            />
            <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
              Your estimated chance that <strong>{odds.outcome}</strong> wins. Must be between 0 and 100.
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 600 }}>
              Cash Stake ($)
            </label>
            <input
              type="number"
              value={stake}
              onChange={(e) => setStake(e.target.value)}
              placeholder="e.g., 100"
              min="0.01"
              step="0.01"
              style={{
                width: '100%',
                padding: 12,
                fontSize: 16,
                border: '2px solid #DDD',
                borderRadius: 6,
                boxSizing: 'border-box'
              }}
            />
            <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
              Amount you plan to wager (cash only, no bonus funds).
            </div>
          </div>

          {/* Disclaimer */}
          <div style={{
            background: '#E7F3FF',
            border: '1px solid #B3D9FF',
            borderRadius: 6,
            padding: 16,
            marginTop: 20
          }}>
            <label style={{ display: 'flex', alignItems: 'start', cursor: 'pointer', fontSize: 14 }}>
              <input
                type="checkbox"
                checked={disclaimerAccepted}
                onChange={(e) => setDisclaimerAccepted(e.target.checked)}
                style={{ marginTop: 2, marginRight: 12, width: 18, height: 18, cursor: 'pointer' }}
              />
              <span>
                <strong>I understand:</strong>
                <ul style={{ margin: '4px 0 0', paddingLeft: 20 }}>
                  <li>This EV is based on MY probability estimate</li>
                  <li>Odds may have changed since displayed</li>
                  <li>This is NOT betting advice</li>
                  <li>Only cash bets are supported (no bonuses)</li>
                </ul>
              </span>
            </label>
          </div>

          <button
            onClick={calculateEV}
            disabled={!canCalculate || calculating}
            style={{
              width: '100%',
              marginTop: 20,
              background: canCalculate && !calculating ? '#28A745' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              padding: 16,
              fontSize: 18,
              fontWeight: 700,
              cursor: canCalculate && !calculating ? 'pointer' : 'not-allowed'
            }}
          >
            {calculating ? 'Calculating...' : 'Calculate Expected Value'}
          </button>

          {!canCalculate && odds && (
            <div style={{ marginTop: 12, fontSize: 13, color: '#856404' }}>
              {isStale && '⚠️ Refresh odds before calculating'}
              {!isStale && !probability && '⚠️ Enter your probability estimate'}
              {!isStale && probability && (parseFloat(probability) <= 0 || parseFloat(probability) >= 100) && '⚠️ Probability must be between 0 and 100'}
              {!isStale && probability && parseFloat(probability) > 0 && parseFloat(probability) < 100 && !stake && '⚠️ Enter your stake'}
              {!isStale && probability && stake && parseFloat(stake) <= 0 && '⚠️ Stake must be greater than 0'}
              {!isStale && probability && stake && parseFloat(probability) > 0 && parseFloat(probability) < 100 && parseFloat(stake) > 0 && !disclaimerAccepted && '⚠️ Accept the disclaimer to continue'}
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {evError && (
        <div style={{
          background: '#F8D7DA',
          border: '1px solid #F5C6CB',
          color: '#721C24',
          padding: 16,
          borderRadius: 8,
          marginBottom: 24,
          fontSize: 14
        }}>
          <strong>❌ Calculation Error:</strong> {evError}
        </div>
      )}

      {/* Result Display */}
      {evResult && (
        <div style={{
          background: evResult.ev_cash >= 0 ? '#D4EDDA' : '#F8D7DA',
          border: `2px solid ${evResult.ev_cash >= 0 ? '#28A745' : '#DC3545'}`,
          borderRadius: 8,
          padding: 24,
          marginBottom: 24
        }}>
          <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 600 }}>Expected Value</h2>

          <div style={{
            fontSize: 48,
            fontWeight: 700,
            color: evResult.ev_cash >= 0 ? '#155724' : '#721C24',
            marginBottom: 16
          }}>
            {evResult.ev_cash >= 0 ? '+' : ''}${evResult.ev_cash.toFixed(2)}
          </div>

          <div style={{ fontSize: 14, marginBottom: 16 }}>
            <strong>Formula:</strong> {evResult.formula_used}
          </div>

          {/* Sportsbook Transparency */}
          {evResult.odds_source_detail && (
            <details open style={{ fontSize: 13, marginBottom: 16, background: 'white', padding: 12, borderRadius: 6 }}>
              <summary style={{ cursor: 'pointer', fontWeight: 600, marginBottom: 8 }}>
                🔍 Sportsbook Transparency
              </summary>
              <div style={{ marginTop: 12, paddingLeft: 16, lineHeight: '1.8' }}>
                <div><strong>Event:</strong> {evResult.odds_source_detail.event}</div>
                <div><strong>Betting On:</strong> {evResult.odds_source_detail.outcome}</div>
                <div><strong>Sportsbook Used:</strong> {evResult.odds_source_detail.bookmaker}</div>
                <div><strong>Odds Price:</strong> {evResult.inputs.odds} (decimal)</div>
                <div style={{ marginTop: 8, fontSize: 12, color: '#666', fontStyle: 'italic' }}>
                  ℹ️ MVP Limitation: Only {evResult.odds_source_detail.bookmaker} is checked. Future versions will compare multiple sportsbooks.
                </div>
              </div>
            </details>
          )}

          <details style={{ fontSize: 13, marginBottom: 16 }}>
            <summary style={{ cursor: 'pointer', fontWeight: 600 }}>
              📊 Calculation Details
            </summary>
            <div style={{ marginTop: 12, paddingLeft: 16 }}>
              <div><strong>Odds:</strong> {evResult.inputs.odds}</div>
              <div><strong>Your Probability:</strong> {(evResult.inputs.true_probability * 100).toFixed(2)}%</div>
              <div><strong>Your Stake:</strong> ${evResult.inputs.cash_stake.toFixed(2)}</div>
              <div><strong>Odds From:</strong> {new Date(evResult.odds_timestamp).toLocaleString()} ({evResult.odds_age_seconds}s ago)</div>
              <div><strong>Calculated:</strong> {new Date(evResult.calculation_timestamp).toLocaleString()}</div>
              <div><strong>API Source:</strong> {evResult.odds_source}</div>
            </div>
          </details>

          {evResult.warnings && evResult.warnings.length > 0 && (
            <div style={{ background: '#FFF3CD', padding: 12, borderRadius: 6, fontSize: 13 }}>
              <strong>⚠️ Warnings:</strong>
              <ul style={{ margin: '4px 0 0', paddingLeft: 20 }}>
                {evResult.warnings.map((warning, i) => (
                  <li key={i}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div style={{
        fontSize: 12,
        color: '#666',
        borderTop: '1px solid #DDD',
        paddingTop: 20,
        marginTop: 32
      }}>
        <p>
          <strong>Not Supported:</strong> {evResult?.excluded_features.join(', ') || 'bonus_bets, matched_betting, insurance, hedging, parlays'}
        </p>
        <p>
          <strong>Data Source:</strong> The Odds API • <strong>Supported Sportsbooks:</strong> DraftKings only
        </p>
        <p style={{ marginTop: 16, fontStyle: 'italic' }}>
          This tool calculates Expected Value based on YOUR probability estimate.
          It is not betting advice. Gambling involves risk. Only bet what you can afford to lose.
        </p>
      </div>
    </div>
  );
}
