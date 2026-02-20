// GOUV4 MEXC Connector - CCXT Integration
// Akash Network - Decentralized Trading
// Focus: MEXC Exchange Only

const ccxt = require('ccxt');
const WebSocket = require('ws');

class MEXCConnector {
  constructor(config) {
    this.exchange = new ccxt.mexc({
      apiKey: config.apiKey,
      secret: config.secretKey,
      enableRateLimit: true,
      options: {
        defaultType: 'spot',
        adjustForTimeDifference: true,
      },
    });

    this.wsConnections = {};
    this.orderbook = { asks: [], bids: [] };
    this.recentTrades = [];
    this.rateLimiter = {
      requests: 0,
      maxRequests: 20,
      window: 1000,
      lastReset: Date.now(),
    };
  }

  // Rate Limiting
  async checkRateLimit() {
    const now = Date.now();
    if (now - this.rateLimiter.lastReset > this.rateLimiter.window) {
      this.rateLimiter.requests = 0;
      this.rateLimiter.lastReset = now;
    }
    if (this.rateLimiter.requests >= this.rateLimiter.maxRequests) {
      const waitTime = this.rateLimiter.window - (now - this.rateLimiter.lastReset);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      this.rateLimiter.requests = 0;
      this.rateLimiter.lastReset = Date.now();
    }
    this.rateLimiter.requests++;
  }

  // Get Balance
  async getBalance() {
    await this.checkRateLimit();
    try {
      const balance = await this.exchange.fetchBalance();
      return {
        total: balance.total,
        free: balance.free,
        used: balance.used,
        USDT: {
          total: balance.total.USDT || 0,
          free: balance.free.USDT || 0,
          used: balance.used.USDT || 0,
        },
        BTC: {
          total: balance.total.BTC || 0,
          free: balance.free.BTC || 0,
          used: balance.used.BTC || 0,
        },
        ETH: {
          total: balance.total.ETH || 0,
          free: balance.free.ETH || 0,
          used: balance.used.ETH || 0,
        },
      };
    } catch (err) {
      console.error('MEXC Balance Error:', err.message);
      throw err;
    }
  }

  // Get Orderbook
  async getOrderbook(pair = 'BTC/USDT', limit = 20) {
    await this.checkRateLimit();
    try {
      const ob = await this.exchange.fetchOrderBook(pair, limit);
      return {
        asks: ob.asks.slice(0, limit),
        bids: ob.bids.slice(0, limit),
        timestamp: ob.timestamp,
        pair,
      };
    } catch (err) {
      console.error('MEXC Orderbook Error:', err.message);
      throw err;
    }
  }

  // Get Recent Trades
  async getRecentTrades(pair = 'BTC/USDT', limit = 50) {
    await this.checkRateLimit();
    try {
      const trades = await this.exchange.fetchTrades(pair, undefined, limit);
      return trades.map(t => ({
        id: t.id,
        price: t.price,
        amount: t.amount,
        side: t.side,
        timestamp: t.timestamp,
        datetime: t.datetime,
      }));
    } catch (err) {
      console.error('MEXC Trades Error:', err.message);
      throw err;
    }
  }

  // Get Ticker
  async getTicker(pair = 'BTC/USDT') {
    await this.checkRateLimit();
    try {
      const ticker = await this.exchange.fetchTicker(pair);
      return {
        symbol: ticker.symbol,
        last: ticker.last,
        bid: ticker.bid,
        ask: ticker.ask,
        high: ticker.high,
        low: ticker.low,
        volume: ticker.baseVolume,
        change: ticker.percentage,
        timestamp: ticker.timestamp,
      };
    } catch (err) {
      console.error('MEXC Ticker Error:', err.message);
      throw err;
    }
  }

  // Get OHLCV (Candlesticks)
  async getOHLCV(pair = 'BTC/USDT', timeframe = '5m', limit = 100) {
    await this.checkRateLimit();
    try {
      const candles = await this.exchange.fetchOHLCV(pair, timeframe, undefined, limit);
      return candles.map(c => ({
        time: c[0],
        open: c[1],
        high: c[2],
        low: c[3],
        close: c[4],
        volume: c[5],
      }));
    } catch (err) {
      console.error('MEXC OHLCV Error:', err.message);
      throw err;
    }
  }

  // Place Order
  async placeOrder(pair, side, type = 'limit', price, amount) {
    await this.checkRateLimit();
    try {
      let order;
      if (type === 'market') {
        order = await this.exchange.createOrder(pair, 'market', side, amount);
      } else {
        order = await this.exchange.createOrder(pair, 'limit', side, amount, price);
      }
      return {
        id: order.id,
        symbol: order.symbol,
        side: order.side,
        type: order.type,
        price: order.price,
        amount: order.amount,
        status: order.status,
        timestamp: order.timestamp,
      };
    } catch (err) {
      console.error('MEXC Order Error:', err.message);
      throw err;
    }
  }

  // Place Buy Order
  async placeBuyOrder(pair, type, price, amount) {
    return this.placeOrder(pair, 'buy', type, price, amount);
  }

  // Place Sell Order
  async placeSellOrder(pair, type, price, amount) {
    return this.placeOrder(pair, 'sell', type, price, amount);
  }

  // Cancel Order
  async cancelOrder(orderId, pair = 'BTC/USDT') {
    await this.checkRateLimit();
    try {
      return await this.exchange.cancelOrder(orderId, pair);
    } catch (err) {
      console.error('MEXC Cancel Error:', err.message);
      throw err;
    }
  }

  // Get Open Orders
  async getOpenOrders(pair = undefined) {
    await this.checkRateLimit();
    try {
      const orders = await this.exchange.fetchOpenOrders(pair);
      return orders.map(o => ({
        id: o.id,
        symbol: o.symbol,
        side: o.side,
        type: o.type,
        price: o.price,
        amount: o.amount,
        filled: o.filled,
        status: o.status,
        timestamp: o.timestamp,
      }));
    } catch (err) {
      console.error('MEXC Open Orders Error:', err.message);
      throw err;
    }
  }

  // WebSocket Stream - BTC/USDT, ETH/USDT, SOL/USDT
  startWebSocket(pairs = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'], onMessage) {
    const ws = new WebSocket('wss://wbs-api.mexc.com/ws');

    ws.on('open', () => {
      console.log('MEXC WebSocket connected');
      // Subscribe to deals
      pairs.forEach(pair => {
        ws.send(JSON.stringify({
          method: 'SUBSCRIPTION',
          params: [`spot@public.deals.v3.api@${pair}`]
        }));
        ws.send(JSON.stringify({
          method: 'SUBSCRIPTION',
          params: [`spot@public.limit.depth.v3.api@${pair}@20`]
        }));
      });
    });

    ws.on('message', (data) => {
      try {
        const parsed = JSON.parse(data);
        if (onMessage) onMessage(parsed);
      } catch (err) {
        console.error('WS Parse Error:', err.message);
      }
    });

    ws.on('error', (err) => {
      console.error('MEXC WS Error:', err.message);
    });

    ws.on('close', () => {
      console.log('MEXC WS disconnected, reconnecting in 3s...');
      setTimeout(() => this.startWebSocket(pairs, onMessage), 3000);
    });

    this.wsConnections.main = ws;
    return ws;
  }

  // Close all connections
  close() {
    Object.values(this.wsConnections).forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) ws.close();
    });
  }
}

module.exports = MEXCConnector;
