'use client'
import { useState, useEffect } from 'react'

const AGENTS = [
  { name: 'Merlin', role: 'Orchestrateur', status: 'actif' },
  { name: 'Perplexity', role: 'Recherche', status: 'actif' },
  { name: 'ChatGPT', role: 'Analyse', status: 'actif' },
  { name: 'Gemini', role: 'Validation', status: 'actif' },
  { name: 'Claude', role: 'Securite', status: 'actif' },
  { name: 'MEXC', role: 'Exchange', status: 'connecte' },
]

const TICKERS = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'XRP/USDT', 'DOGE/USDT']

export default function Dashboard() {
  const [prices, setPrices] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPrices() {
      try {
        const res = await fetch('/api/market')
        const data = await res.json()
        setPrices(data)
      } catch (e) {
        console.error('Erreur fetch prix:', e)
        // Donnees de demo en cas d erreur
        const demo = {}
        TICKERS.forEach(t => {
          demo[t] = {
            last: (Math.random() * 100000).toFixed(2),
            change: (Math.random() * 10 - 5).toFixed(2)
          }
        })
        setPrices(demo)
      }
      setLoading(false)
    }
    fetchPrices()
    const interval = setInterval(fetchPrices, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <main>
      {/* Ticker Bar */}
      <div className="ticker-bar">
        {TICKERS.map(symbol => (
          <div key={symbol} className="ticker-item">
            <span className="ticker-symbol">{symbol}</span>
            <span className="ticker-price">
              {loading ? '...' : `$${Number(prices[symbol]?.last || 0).toLocaleString()}`}
            </span>
            <span className={`ticker-change ${Number(prices[symbol]?.change) >= 0 ? 'green' : 'red'}`}>
              {loading ? '' : `${Number(prices[symbol]?.change) >= 0 ? '+' : ''}${prices[symbol]?.change || 0}%`}
            </span>
          </div>
        ))}
      </div>

      <div className="dashboard">
        {/* Stats */}
        <div className="card">
          <h2>Statistiques Portefeuille</h2>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-value green">$12,450</div>
              <div className="stat-label">Valeur totale</div>
            </div>
            <div className="stat-item">
              <div className="stat-value green">+8.2%</div>
              <div className="stat-label">P&L 24h</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">47</div>
              <div className="stat-label">Trades aujourd hui</div>
            </div>
            <div className="stat-item">
              <div className="stat-value green">68%</div>
              <div className="stat-label">Win Rate</div>
            </div>
          </div>
        </div>

        {/* Chart placeholder */}
        <div className="card">
          <h2>Graphique BTC/USDT</h2>
          <div className="chart-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8888a0' }}>
            Chargement du graphique TradingView...
          </div>
        </div>

        {/* Agents */}
        <div className="card">
          <h2>Agents IA Multi-Agent</h2>
          <div className="agents-grid">
            {AGENTS.map(agent => (
              <div key={agent.name} className="agent-card">
                <div className="agent-name">
                  <span className="status-dot"></span>
                  {agent.name}
                </div>
                <div className="agent-status" style={{ color: '#8888a0' }}>{agent.role}</div>
                <div className="agent-status green">{agent.status}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
