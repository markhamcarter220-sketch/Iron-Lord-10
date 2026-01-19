import React from 'react';
import ProfessionalDashboard from './ProfessionalDashboard';

/**
 * Better Bets - Professional Edition v3.0.0
 *
 * Complete sports betting EV platform with multiple calculators.
 *
 * Features:
 * - EV Calculator: Calculate expected value with YOUR probability
 * - Arbitrage Finder: Find guaranteed profit opportunities
 * - Bonus Bets Calculator: Evaluate bonus terms and rollover requirements
 * - 12+ major sportsbooks (DraftKings, FanDuel, BetMGM, etc.)
 * - 15+ sports (NFL, NBA, NHL, MLB, Soccer, UFC, etc.)
 * - Professional navy/silver UI with mobile support
 * - American/Decimal odds toggle
 * - Auto-refresh option
 * - Minimum edge filter for arbitrage
 * - Real-time odds comparison
 * - Full transparency and provenance
 *
 * Framework compliant:
 * - User provides probability (no guessing)
 * - Timestamps validated (< 60s)
 * - Full provenance displayed
 * - Mathematically correct formulas
 * - Explicit failures over silent errors
 */
export default function App() {
  return <ProfessionalDashboard />;
}
