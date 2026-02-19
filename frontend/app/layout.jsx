import './globals.css'

export const metadata = {
  title: 'GOUV4 Trading Dashboard',
  description: 'Dashboard multi-agent trading MEXC - GOUV4 System',
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        <header className="header">
          <h1>GOUV4 Trading</h1>
          <div>
            <span className="status-dot"></span>
            <span style={{ fontSize: '12px', color: '#8888a0' }}>Systeme actif</span>
          </div>
        </header>
        {children}
      </body>
    </html>
  )
}
