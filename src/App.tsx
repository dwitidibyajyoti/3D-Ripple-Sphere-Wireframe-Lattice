import { useState, Suspense } from 'react'
import { BallSphere } from './components/BallSphere'
import './App.css'

function App() {
  const [ballCount, setBallCount] = useState(120)
  const [sphereRadius, setSphereRadius] = useState(2.8)
  const [gapPercentage, setGapPercentage] = useState(35)
  const [speed, setSpeed] = useState(1.0)
  const [expansion, setExpansion] = useState(1.0)
  const [autoRotate, setAutoRotate] = useState(true)
  const [showSparkles, setShowSparkles] = useState(true)

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="badge">Fibonacci Sphere + WebGL Shockwave</div>
        <h1>3D Ripple Sphere &amp; Wireframe Lattice</h1>
        <p className="subtitle">
          The nodes are rendered as dark green/teal wireframe outlines against a dark, minimal background.
          The outer rim, horizon silhouette, and perimeter end-nodes of the hollow sphere continuously emit a soft, rhythmic blinking/pulsing glow to accentuate depth and spherical curvature.
        </p>
      </header>

      <main className="viewer-section">
        <div className="canvas-wrapper">
          <Suspense
            fallback={
              <div className="loading-container">
                <div className="spinner"></div>
                <p>Generating Fibonacci Lattice...</p>
              </div>
            }
          >
            <BallSphere
              ballCount={ballCount}
              sphereRadius={sphereRadius}
              gapPercentage={gapPercentage}
              speed={speed}
              expansion={expansion}
              autoRotate={autoRotate}
              showSparkles={showSparkles}
            />
          </Suspense>
        </div>

        {/* Interactive Controls */}
        <aside className="controls-panel">
          <h3>Lattice &amp; Wave Controls</h3>

          <div className="control-group">
            <div className="control-label">
              <span>Node Count</span>
              <span className="value-badge">{ballCount}</span>
            </div>
            <input
              type="range"
              min="30"
              max="240"
              step="10"
              value={ballCount}
              onChange={(e) => setBallCount(Number(e.target.value))}
            />
          </div>

          <div className="control-group">
            <div className="control-label">
              <span>Node Gap Spacing</span>
              <span className="value-badge">{gapPercentage}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="70"
              step="5"
              value={gapPercentage}
              onChange={(e) => setGapPercentage(Number(e.target.value))}
            />
          </div>

          <div className="control-group">
            <div className="control-label">
              <span>Sphere Radius</span>
              <span className="value-badge">{sphereRadius.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="1.5"
              max="4.5"
              step="0.1"
              value={sphereRadius}
              onChange={(e) => setSphereRadius(Number(e.target.value))}
            />
          </div>

          <div className="control-group">
            <div className="control-label">
              <span>Expansion Factor</span>
              <span className="value-badge">{expansion.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.6"
              max="1.8"
              step="0.05"
              value={expansion}
              onChange={(e) => setExpansion(Number(e.target.value))}
            />
          </div>

          <div className="control-group">
            <div className="control-label">
              <span>Rotation Speed</span>
              <span className="value-badge">{speed.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="3.0"
              step="0.1"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
            />
          </div>

          <div className="control-toggle-row">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={autoRotate}
                onChange={(e) => setAutoRotate(e.target.checked)}
              />
              Auto Rotate
            </label>

            <label className="toggle-label">
              <input
                type="checkbox"
                checked={showSparkles}
                onChange={(e) => setShowSparkles(e.target.checked)}
              />
              Ambient Sparkles
            </label>
          </div>

          <div className="interaction-tips">
            <strong>Interactions:</strong>
            <ul>
              <li><strong>Move Cursor / Hover</strong> across the sphere to trigger shockwaves</li>
              <li><strong>Click</strong> to trigger high-energy wave bursts</li>
              <li><strong>Click &amp; drag</strong> to rotate the view</li>
            </ul>
          </div>
        </aside>
      </main>
    </div>
  )
}

export default App
