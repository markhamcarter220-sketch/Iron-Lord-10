import React from 'react';
import EVCalculator from './EVCalculator';

/**
 * Better Bets - MVP v0.1.0
 *
 * Mathematically correct EV calculator.
 * Only supports: Straight cash bets, DraftKings, H2H markets
 *
 * Framework compliant:
 * - User provides probability (no guessing)
 * - Timestamps validated (< 60s)
 * - Full provenance displayed
 * - Unsafe features removed
 */
export default function App() {
  return <EVCalculator />;
}
