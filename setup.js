#!/usr/bin/env node
// GOUV4 Trading System - Setup Script
// Run: node setup.js
// Creates complete Next.js 14 project structure

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const D = 'gouv4';
const m = (...a) => fs.mkdirSync(path.join(D, ...a), { recursive: true });
const w = (f, c) => fs.writeFileSync(path.join(D, f.replace(/\//g, path.sep)), c);

console.log('=== GOUV4 Trading System Setup ===');

// Create directories
['app/api/market', 'app/api/exchanges/balance', 'app/api/exchanges/ticker', 'app/api/exchanges/orders',
 'app/dashboard', 'app/market', 'app/portfolio', 'app/agents', 'app/playbooks', 'app/settings',
 'components/layout', 'components/market', 'components/dashboard', 'components/agents',
 'lib/exchanges', 'stores', 'prisma', 'public'].forEach(d => m(d));

console.log('Directories created.');

// === package.json ===
w('package.json', JSON.stringify({
  name: 'gouv4-trading',
  version: '1.0.0',
  private: true,
  scripts: {
    dev: 'next dev -p 3000',
    build: 'next build',
    start: 'next start -p 3000',
    lint: 'next lint'
  },
  dependencies: {
    next: '14.2.5',
    react: '18.2.0',
    'react-dom': '18.2.0',
    ccxt: '^4.2.0',
    'lightweight-charts': '^4.1.0',
    zustand: '^4.5.0',
    zod: '^3.22.0',
    'lucide-react': '^0.300.0',
    'next-auth': '^4.24.0',
    '@prisma/client': '^5.20.0'
  },
  devDependencies: {
    typescript: '^5.3.3',
    '@types/react': '^18.2.45',
    '@types/node': '^20.11.0',
    tailwindcss: '^3.4.0',
    postcss: '^8.4.0',
    autoprefixer: '^10.4.0',
    prisma: '^5.20.0',
    '@types/react-dom': '^18.2.0'
  }
}, null, 2));

// === next.config.js ===
w('next.config.js', `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: { serverActions: true }
};
module.exports = nextConfig;
`);

// === tsconfig.json ===
w('tsconfig.json', JSON.stringify({
  compilerOptions: {
    target: 'es5', lib: ['dom','dom.iterable','esnext'],
    allowJs: true, skipLibCheck: true, strict: true,
    noEmit: true, esModuleInterop: true, module: 'esnext',
    moduleResolution: 'bundler', resolveJsonModule: true,
    isolatedModules: true, jsx: 'preserve', incremental: true,
    plugins: [{ name: 'next' }],
    paths: { '@/*': ['./*'] }
  },
  include: ['next-env.d.ts','**/*.ts','**/*.tsx','.next/types/**/*.ts'],
  exclude: ['node_modules']
}, null, 2));

// === tailwind.config.ts ===
w('tailwind.config.ts', `import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./app/**/*.{ts,tsx}','./components/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        terminal: { bg: '#0a0a0f', text: '#f8f8f2', accent: '#00f6ff', green: '#50fa7b', red: '#ff5555', gray: '#6272a4' }
      },
      fontFamily: { mono: ['JetBrains Mono', 'monospace'] }
    }
  },
  plugins: []
};
export default config;
`);

// === postcss.config.js ===
w('postcss.config.js', `module.exports = { plugins: { tailwindcss: {}, autoprefixer: {} } };
`);

// === app/globals.css ===
w('app/globals.css', `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --terminal-bg: #0a0a0f;
  --terminal-text: #f8f8f2;
  --terminal-accent: #00f6ff;
  --terminal-green: #50fa7b;
  --terminal-red: #ff5555;
  --terminal-gray: #6272a4;
}

body { background-color: var(--terminal-bg); color: var(--terminal-text); }

.terminal-border { border: 1px solid rgba(98, 114, 164, 0.3); }
.terminal-card { background: rgba(10, 10, 15, 0.9); border: 1px solid rgba(98,114,164,0.2); }
`);

// === app/layout.tsx ===
w('app/layout.tsx', `import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GOUV4 Trading - MERLIN AI Hub',
  description: 'Multi-Agent Crypto Trading Dashboard'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="dark bg-[#0a0a0f] text-[#f8f8f2] font-mono min-h-screen">
        {children}
      </body>
    </html>
  );
}
`);

// === app/page.tsx (Main Dashboard) ===
w('app/page.tsx', `'use client';
import { useState, useEffect } from 'react';

const NAV = ['Dashboard','Market','Portfolio','Execution','Playbooks','Agents','Settings'];
const AGENTS = ['MERLIN','ChatGPT','Gemini','Perplexity','Claude','Kimi'];
const EXCHANGES = [{name:'MEXC',ok:true},{name:'Binance',ok:true},{name:'Crypto.com',ok:false}];

export default function Home() {
  const [time, setTime] = useState('');
  const [page, setPage] = useState('Dashboard');
  const [mode, setMode] = useState('NORMAL');
  const [sidebar, setSidebar] = useState(true);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date().toLocaleTimeString('en-US',{hour12:false})), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      {sidebar && (
        <aside className="w-56 border-r border-[#6272a4]/20 flex flex-col p-4 bg-[#0d0d14]">
          <h2 className="text-xl font-bold text-[#00f6ff] mb-6">MERLIN</h2>
          <nav className="flex-1 space-y-1">
            {NAV.map(n => (
              <button key={n} onClick={() => setPage(n)}
                className={\`w-full text-left px-3 py-2 rounded text-sm \${
                  page===n ? 'bg-[#00f6ff]/10 text-[#00f6ff]' : 'text-[#6272a4] hover:text-[#f8f8f2]'
                }\`}>{n}</button>
            ))}
          </nav>
          <div className="mt-4 p-2 rounded bg-[#6272a4]/10 text-xs">
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#50fa7b]"></span>Exchange</div>
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#50fa7b]"></span>Agents</div>
          </div>
        </aside>
      )}

      {/* Main */}
      <main className="flex-1 flex flex-col">
        {/* Status Strip */}
        <div className="h-10 px-4 border-b border-[#6272a4]/20 flex items-center gap-4 text-xs bg-[#0d0d14]">
          <button onClick={() => setSidebar(!sidebar)} className="text-[#6272a4] hover:text-[#f8f8f2]">☰</button>
          {EXCHANGES.map(e => (
            <span key={e.name} className="flex items-center gap-1">
              <span className={\`w-2 h-2 rounded-full \${e.ok ? 'bg-[#50fa7b]' : 'bg-[#ff5555]'}\`}></span>
              {e.name}
            </span>
          ))}
          <span className="ml-auto text-[#6272a4]">{time}</span>
          <button onClick={() => setMode(mode==='NORMAL'?'ALERTE ROUGE':'NORMAL')}
            className={\`px-2 py-0.5 rounded \${mode==='NORMAL' ? 'bg-[#50fa7b]/20 text-[#50fa7b]' : 'bg-[#ff5555]/20 text-[#ff5555]'}\`}>
            {mode}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {page === 'Dashboard' && <DashboardView />}
          {page === 'Market' && <MarketView />}
          {page === 'Agents' && <AgentsView />}
          {page === 'Portfolio' && <PortfolioView />}
          {page === 'Playbooks' && <PlaybooksView />}
          {!['Dashboard','Market','Agents','Portfolio','Playbooks'].includes(page) && (
            <div className="text-center text-[#6272a4] mt-20">
              <h2 className="text-2xl mb-2">{page}</h2>
              <p>Module en cours de developpement</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function DashboardView() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard <span className="text-[#00f6ff]">GOUV4</span></h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[{l:'BTC/USDT',v:'$65,884',c:'-2.3%',neg:true},
          {l:'ETH/USDT',v:'$2,080',c:'+0.5%',neg:false},
          {l:'AKT/USDT',v:'$0.33',c:'+5.2%',neg:false},
          {l:'Portfolio',v:'$15.73',c:'MEXC',neg:false}
        ].map((c,i) => (
          <div key={i} className="terminal-card rounded-lg p-4">
            <div className="text-xs text-[#6272a4]">{c.l}</div>
            <div className="text-xl font-bold mt-1">{c.v}</div>
            <div className={\`text-sm \${c.neg ? 'text-[#ff5555]' : 'text-[#50fa7b]'}\`}>{c.c}</div>
          </div>
        ))}
      </div>
      <div className="terminal-card rounded-lg p-4">
        <h3 className="text-sm text-[#6272a4] mb-2">Infrastructure Akash</h3>
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div><span className="text-[#6272a4]">DSEQ:</span> 25533451</div>
          <div><span className="text-[#6272a4]">GPU:</span> RTX 3090</div>
          <div><span className="text-[#6272a4]">Balance:</span> $7.09</div>
          <div><span className="text-[#6272a4]">Temps:</span> ~2 jours</div>
        </div>
      </div>
      <div className="terminal-card rounded-lg p-4">
        <h3 className="text-sm text-[#6272a4] mb-2">Agents Status</h3>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {['MERLIN','ChatGPT','Gemini','Perplexity','Claude','Kimi'].map(a => (
            <div key={a} className="text-center p-2 rounded bg-[#6272a4]/10">
              <div className="w-2 h-2 rounded-full bg-[#50fa7b] mx-auto mb-1"></div>
              <div className="text-xs">{a}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MarketView() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Market <span className="text-[#00f6ff]">Center</span></h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[{s:'BTC/USDT',p:'65,884.20',c:'-2.3%',neg:true},
          {s:'ETH/USDT',p:'2,080.50',c:'+0.5%',neg:false},
          {s:'AKT/USDT',p:'0.3320',c:'+5.2%',neg:false}
        ].map((t,i) => (
          <div key={i} className="terminal-card rounded-lg p-4">
            <div className="text-sm font-bold">{t.s}</div>
            <div className="text-2xl font-bold mt-1">${t.p}</div>
            <div className={\`text-sm \${t.neg ? 'text-[#ff5555]' : 'text-[#50fa7b]'}\`}>{t.c}</div>
          </div>
        ))}
      </div>
      <div className="terminal-card rounded-lg p-6">
        <h3 className="text-sm text-[#6272a4] mb-4">Chart BTC/USDT</h3>
        <div className="h-64 flex items-center justify-center text-[#6272a4] border border-[#6272a4]/20 rounded">
          TradingView Lightweight Charts - Module en cours
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="terminal-card rounded-lg p-4">
          <h3 className="text-sm text-[#6272a4] mb-2">Order Book</h3>
          <div className="space-y-1 text-xs">
            {[66000,65950,65900,65850,65800].map(p => (
              <div key={p} className="flex justify-between">
                <span className="text-[#ff5555]">{p.toFixed(2)}</span>
                <span className="text-[#6272a4]">{(Math.random()*2).toFixed(4)}</span>
              </div>
            ))}
            <div className="text-center py-1 text-[#00f6ff] font-bold">65,884.20</div>
            {[65880,65870,65860,65850,65840].map(p => (
              <div key={p} className="flex justify-between">
                <span className="text-[#50fa7b]">{p.toFixed(2)}</span>
                <span className="text-[#6272a4]">{(Math.random()*2).toFixed(4)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="terminal-card rounded-lg p-4">
          <h3 className="text-sm text-[#6272a4] mb-2">Recent Trades</h3>
          <div className="space-y-1 text-xs">
            {Array(10).fill(0).map((_,i) => (
              <div key={i} className="flex justify-between">
                <span className={i%2===0 ? 'text-[#50fa7b]' : 'text-[#ff5555]'}>
                  {(65880 + Math.random()*20).toFixed(2)}
                </span>
                <span className="text-[#6272a4]">{(Math.random()*0.5).toFixed(4)}</span>
                <span className="text-[#6272a4]">{new Date().toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AgentsView() {
  const agents = [
    {name:'MERLIN',status:'RUNNING',model:'qwen3:32b',role:'Orchestrateur'},
    {name:'ChatGPT',status:'RUNNING',model:'GPT-5.2',role:'Architecte'},
    {name:'Gemini',status:'NOMINAL',model:'2.5-Flash',role:'Analyste'},
    {name:'Perplexity',status:'RUNNING',model:'Comet',role:'Capitaine'},
    {name:'Claude',status:'RUNNING',model:'Sonnet 4.6',role:'Securite'},
    {name:'Kimi',status:'DONE',model:'Kimi K2',role:'Developpeur'}
  ];
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Multi-Agent <span className="text-[#00f6ff]">Console</span></h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {agents.map(a => (
          <div key={a.name} className="terminal-card rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold">{a.name}</span>
              <span className={\`text-xs px-2 py-0.5 rounded \${
                a.status==='RUNNING' ? 'bg-[#50fa7b]/20 text-[#50fa7b]' :
                a.status==='NOMINAL' ? 'bg-[#00f6ff]/20 text-[#00f6ff]' :
                'bg-[#6272a4]/20 text-[#6272a4]'
              }\`}>{a.status}</span>
            </div>
            <div className="text-xs text-[#6272a4]">Model: {a.model}</div>
            <div className="text-xs text-[#6272a4]">Role: {a.role}</div>
            <textarea className="w-full mt-2 bg-[#0a0a0f] border border-[#6272a4]/20 rounded p-2 text-xs text-[#f8f8f2] h-16"
              placeholder={\`Envoyer un prompt a \${a.name}...\`} />
          </div>
        ))}
      </div>
    </div>
  );
}

function PortfolioView() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Portfolio <span className="text-[#00f6ff]">Consolide</span></h1>
      <div className="terminal-card rounded-lg p-4">
        <table className="w-full text-sm">
          <thead><tr className="text-[#6272a4] text-xs">
            <th className="text-left py-2">Exchange</th>
            <th className="text-right">USDT</th>
            <th className="text-right">BTC</th>
            <th className="text-right">ETH</th>
            <th className="text-right">Total USD</th>
          </tr></thead>
          <tbody>
            {[{ex:'MEXC',usdt:15.73,btc:0,eth:0},{ex:'Binance',usdt:0,btc:0,eth:0},{ex:'Crypto.com',usdt:0,btc:0,eth:0}].map(r => (
              <tr key={r.ex} className="border-t border-[#6272a4]/10">
                <td className="py-2">{r.ex}</td>
                <td className="text-right">{r.usdt.toFixed(2)}</td>
                <td className="text-right">{r.btc.toFixed(6)}</td>
                <td className="text-right">{r.eth.toFixed(4)}</td>
                <td className="text-right font-bold">${r.usdt.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PlaybooksView() {
  const playbooks = [
    {name:'Recharge Escrow Akash',desc:'USDT > ATOM > AKT > Akash Escrow',status:'READY'},
    {name:'Crash Mode',desc:'Resume mouvement + risques + decisions',status:'READY'},
    {name:'Morning Scan',desc:'Briefing marche + status agents + infra',status:'READY'}
  ];
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Playbooks <span className="text-[#00f6ff]">GOUV4</span></h1>
      {playbooks.map(p => (
        <div key={p.name} className="terminal-card rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold">{p.name}</div>
              <div className="text-xs text-[#6272a4]">{p.desc}</div>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1 text-xs rounded bg-[#00f6ff]/20 text-[#00f6ff] hover:bg-[#00f6ff]/30">PREVIEW</button>
              <button className="px-3 py-1 text-xs rounded bg-[#50fa7b]/20 text-[#50fa7b] hover:bg-[#50fa7b]/30">EXECUTE</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
`);

console.log('app/page.tsx created.');

// === API Route: Market Data ===
w('app/api/market/route.ts', `import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,akash-network&vs_currencies=usd&include_24hr_change=true');
    const data = await res.json();
    return NextResponse.json({
      btc: { price: data.bitcoin?.usd || 0, change: data.bitcoin?.usd_24h_change || 0 },
      eth: { price: data.ethereum?.usd || 0, change: data.ethereum?.usd_24h_change || 0 },
      akt: { price: data['akash-network']?.usd || 0, change: data['akash-network']?.usd_24h_change || 0 }
    });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch market data' }, { status: 500 });
  }
}
`);

// === API Route: Exchanges Balance ===
w('app/api/exchanges/balance/route.ts', `import { NextResponse } from 'next/server';

export async function GET() {
  // CCXT integration placeholder - keys from env
  return NextResponse.json({
    mexc: { USDT: 15.73, BTC: 0, ETH: 0 },
    binance: { USDT: 0, BTC: 0, ETH: 0 },
    crypto_com: { USDT: 0, BTC: 0, ETH: 0 }
  });
}
`);

// === API Route: Ticker ===
w('app/api/exchanges/ticker/route.ts', `import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const symbol = url.searchParams.get('symbol') || 'BTC/USDT';
  const exchange = url.searchParams.get('exchange') || 'mexc';
  
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true');
    const data = await res.json();
    return NextResponse.json({
      symbol, exchange,
      price: data.bitcoin?.usd || 0,
      change24h: data.bitcoin?.usd_24h_change || 0,
      volume24h: data.bitcoin?.usd_24h_vol || 0
    });
  } catch (e) {
    return NextResponse.json({ error: 'Ticker fetch failed' }, { status: 500 });
  }
}
`);

// === API Route: Orders ===
w('app/api/exchanges/orders/route.ts', `import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ mexc: [], binance: [], crypto_com: [] });
}

export async function POST(request: Request) {
  const body = await request.json();
  // GOUV4 Validation: PREVIEW mode only for now
  return NextResponse.json({
    status: 'PREVIEW',
    message: 'GOUV4_VALIDATION_REQUISE - Ordre en preview',
    order: body
  });
}
`);

// === .env.example ===
w('.env.example', `# GOUV4 Trading System - Environment Variables
# IMPORTANT: Changer les cles avant production!

# Next.js
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# MEXC Exchange (CHANGER AVANT PRODUCTION)
MEXC_API_KEY=your_mexc_api_key
MEXC_SECRET=your_mexc_secret

# Binance
BINANCE_API_KEY=your_binance_api_key
BINANCE_SECRET=your_binance_secret

# Crypto.com
CRYPTO_COM_API_KEY=your_crypto_com_api_key
CRYPTO_COM_SECRET=your_crypto_com_secret

# Database
DATABASE_URL=postgresql://gouv4:gouv4@localhost:5432/gouv4

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Auth
NEXTAUTH_SECRET=change-this-secret-in-production
JWT_SECRET=change-this-jwt-secret

# AI Agents
OPENAI_API_KEY=your_openai_key
GEMINI_API_KEY=your_gemini_key
PERPLEXITY_API_KEY=your_perplexity_key
CLAUDE_API_KEY=your_claude_key
KIMI_API_KEY=your_kimi_key

# Akash
AKASH_DSEQ=25533451
`);

// === .gitignore additions ===
w('.gitignore', `node_modules/
.next/
.env
.env.local
*.log
dist/
.turbo/
`);

// === next-env.d.ts ===
w('next-env.d.ts', `/// <reference types="next" />
/// <reference types="next/image-types/global" />
`);

console.log('\n=== All files created in gouv4/ directory ===');
console.log('Next steps:');
console.log('  cd gouv4');
console.log('  npm install');
console.log('  npm run build');
console.log('  npm run start');
console.log('\nSite will be available on port 3000');
