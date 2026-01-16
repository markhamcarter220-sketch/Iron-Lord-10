import React from 'react';
import BettingDashboard from './BettingDashboard';

/**
 * Better Bets - Professional Edition v2.0.0
 *
 * Mathematically correct EV calculator with multiple sportsbooks and sports.
 *
 * Features:
 * - 12+ major sportsbooks (DraftKings, FanDuel, BetMGM, Caesars, etc.)
 * - 15+ sports (NFL, NBA, NHL, MLB, Soccer, UFC, etc.)
 * - Professional navy/silver UI
 * - Real-time odds comparison
 * - Full transparency and provenance
 *
 * Framework compliant:
 * - User provides probability (no guessing)
 * - Timestamps validated (< 60s)
 * - Full provenance displayed
 * - Mathematically correct EV formula
 */
export default function App() {
  return <BettingDashboard />;
}
