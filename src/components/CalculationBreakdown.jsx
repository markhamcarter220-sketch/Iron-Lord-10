import React, { useState } from 'react';

export default function CalculationBreakdown({ breakdown }) {
  const [expanded, setExpanded] = useState(false);

  if (!breakdown) {
    return <div style={{ color: '#888', fontSize: 14, fontStyle: 'italic' }}>No calculation details available</div>;
  }

  const cardStyle = {
    background: '#0d1b2a',
    border: '1px solid #1b263b',
    borderRadius: 8,
    padding: 12,
    marginTop: 8
  };

  const sectionStyle = {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottom: '1px solid #1b263b'
  };

  const titleStyle = {
    color: '#4cc9f0',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8
  };

  const formulaStyle = {
    background: '#1b263b',
    padding: 8,
    borderRadius: 4,
    fontFamily: 'monospace',
    fontSize: 13,
    color: '#f72585',
    marginBottom: 8
  };

  const stepStyle = {
    fontSize: 13,
    color: '#b5b5b5',
    marginLeft: 12,
    marginBottom: 4
  };

  const resultStyle = {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#7209b7',
    marginTop: 8
  };

  const interpretationStyle = {
    fontSize: 13,
    color: '#adb5bd',
    fontStyle: 'italic',
    marginTop: 4
  };

  const toggleButtonStyle = {
    background: '#1b263b',
    color: '#4cc9f0',
    border: '1px solid #4cc9f0',
    borderRadius: 4,
    padding: '8px 16px',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 'bold',
    width: '100%',
    marginBottom: 8
  };

  return (
    <div style={cardStyle}>
      <button
        style={toggleButtonStyle}
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? '▼' : '▶'} Show Calculation Details
      </button>

      {expanded && (
        <div>
          {/* CLV Breakdown */}
          {breakdown.clv && (
            <div style={sectionStyle}>
              <div style={titleStyle}>Closing Line Value (CLV)</div>
              <div style={formulaStyle}>{breakdown.clv.formula}</div>
              <div style={{ ...formulaStyle, color: '#90e0ef' }}>{breakdown.clv.calculation}</div>
              {breakdown.clv.steps && breakdown.clv.steps.length > 0 && (
                <div>
                  {breakdown.clv.steps.map((step, idx) => (
                    step && <div key={idx} style={stepStyle}>• {step}</div>
                  ))}
                </div>
              )}
              <div style={resultStyle}>
                Result: {breakdown.clv.result !== null ? breakdown.clv.result : 'N/A'}
              </div>
              <div style={interpretationStyle}>{breakdown.clv.interpretation}</div>
            </div>
          )}

          {/* Expected Value Breakdown */}
          {breakdown.expected_value && (
            <div style={sectionStyle}>
              <div style={titleStyle}>Expected Value (EV)</div>
              <div style={formulaStyle}>{breakdown.expected_value.formula}</div>
              <div style={{ ...formulaStyle, color: '#90e0ef' }}>{breakdown.expected_value.calculation}</div>
              {breakdown.expected_value.steps && (
                <div>
                  {breakdown.expected_value.steps.map((step, idx) => (
                    <div key={idx} style={stepStyle}>• {step}</div>
                  ))}
                </div>
              )}
              <div style={resultStyle}>
                Result: {breakdown.expected_value.result}%
              </div>
              <div style={interpretationStyle}>{breakdown.expected_value.interpretation}</div>
            </div>
          )}

          {/* Kelly Criterion Breakdown */}
          {breakdown.kelly && (
            <div style={{ marginBottom: 0 }}>
              <div style={titleStyle}>Kelly Criterion</div>
              <div style={formulaStyle}>{breakdown.kelly.formula}</div>
              <div style={{ ...formulaStyle, color: '#90e0ef' }}>{breakdown.kelly.calculation}</div>
              {breakdown.kelly.steps && (
                <div>
                  {breakdown.kelly.steps.map((step, idx) => (
                    <div key={idx} style={stepStyle}>• {step}</div>
                  ))}
                </div>
              )}
              <div style={resultStyle}>
                Result: Fraction = {breakdown.kelly.result.fraction}, Size = ${breakdown.kelly.result.size}
              </div>
              <div style={interpretationStyle}>{breakdown.kelly.interpretation}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
