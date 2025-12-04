import React from 'react';
import LiveOdds from './LiveOdds';
import BetLogger from './BetLogger';
import BetHistory from './BetHistory';
import KellyCalculator from './KellyCalculator';
import BookBreakdown from './BookBreakdown';
import CLVReport from './CLVReport';

export default function App() {
  return (
    <div style={{
      maxWidth: 960,
      margin: '0 auto',
      padding: '1rem',
      backgroundColor: '#0A1128',
      color: 'white',
      fontFamily: 'sans-serif'
    }}>
      <h1 style={{ color: '#4DA8DA', marginBottom: 16 }}>IronMan – Betting Engine</h1>
      <LiveOdds />
      <BetLogger />
      <BetHistory />
      <KellyCalculator />
      <CLVReport />
      <BookBreakdown books={[
        { name: 'FanDuel', odds: '+950' },
        { name: 'DraftKings', odds: '+920' },
        { name: 'Caesars', odds: '+940' }
      ]} />
    </div>
  );
}
