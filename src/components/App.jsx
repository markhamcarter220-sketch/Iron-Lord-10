import React from 'react';
import LiveOdds from './LiveOdds';
import BetLogger from './BetLogger';
import BetHistory from './BetHistory';
import KellyCalculator from './KellyCalculator';
import BookBreakdown from './BookBreakdown';
import CLVReport from './CLVReport';

export default function App() {
  return (
    <div style={{ maxWidth: 960, margin: 'auto', padding: 16, backgroundColor: '#0A1128', color: 'white' }}>
      <h1 style={{ color: '#C0C0C0', marginBottom: 16 }}>IronLord10 – Betting Engine</h1>
      <LiveOdds />
      <BetLogger />
      <BetHistory />
      <KellyCalculator />
      <CLVReport />
      <BookBreakdown books={[
        { name: 'FanDuel', odds: '-105' },
        { name: 'DraftKings', odds: '-120' },
        { name: 'Caesars', odds: '-104' }
      ]} />
    </div>
  );
}
