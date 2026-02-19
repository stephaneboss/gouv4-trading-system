import { NextResponse } from 'next/server'

// Route API pour recuperer les prix MEXC via CCXT
// NOTE: La cle MEXC sera changee avant la production
const SYMBOLS = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'XRP/USDT', 'DOGE/USDT']

export async function GET() {
  try {
    // Essayer CCXT en premier
    let ccxt
    try {
      ccxt = require('ccxt')
    } catch (e) {
      // Fallback vers API publique MEXC si ccxt pas dispo
      return await fetchFromMexcPublic()
    }

    const exchange = new ccxt.mexc({ enableRateLimit: true })
    const tickers = await exchange.fetchTickers(SYMBOLS)

    const result = {}
    for (const symbol of SYMBOLS) {
      if (tickers[symbol]) {
        result[symbol] = {
          last: tickers[symbol].last,
          change: tickers[symbol].percentage?.toFixed(2) || '0.00',
          high: tickers[symbol].high,
          low: tickers[symbol].low,
          volume: tickers[symbol].quoteVolume,
        }
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Erreur API market:', error.message)
    return await fetchFromMexcPublic()
  }
}

async function fetchFromMexcPublic() {
  try {
    const res = await fetch('https://api.mexc.com/api/v3/ticker/24hr')
    const data = await res.json()
    const result = {}

    for (const symbol of SYMBOLS) {
      const mexcSymbol = symbol.replace('/', '')
      const ticker = data.find(t => t.symbol === mexcSymbol)
      if (ticker) {
        result[symbol] = {
          last: parseFloat(ticker.lastPrice),
          change: parseFloat(ticker.priceChangePercent).toFixed(2),
          high: parseFloat(ticker.highPrice),
          low: parseFloat(ticker.lowPrice),
          volume: parseFloat(ticker.quoteVolume),
        }
      }
    }

    return NextResponse.json(result)
  } catch (e) {
    // Donnees de fallback
    const fallback = {}
    SYMBOLS.forEach(s => {
      fallback[s] = { last: 0, change: '0.00', high: 0, low: 0, volume: 0 }
    })
    return NextResponse.json(fallback)
  }
}
