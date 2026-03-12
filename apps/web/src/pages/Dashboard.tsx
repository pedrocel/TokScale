import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(null)
  const [accounts, setAccounts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const savedUser = localStorage.getItem('tokscale_user')
    if (!savedUser) {
      navigate('/login')
    } else {
      setUser(JSON.parse(savedUser))
      fetchAccounts()
    }
  }, [navigate])

  const fetchAccounts = async () => {
    try {
      const token = localStorage.getItem('tokscale_token')
      const response = await fetch('http://localhost:8787/api/accounts', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setAccounts(data)
      } else if (response.status === 401) {
        navigate('/login')
      }
    } catch (err) {
      console.error('Erro ao buscar contas:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleConnectTikTok = () => {
    window.location.href = 'http://localhost:8787/api/oauth/tiktok/start'
  }

  if (!user) return null

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Dashboard TokScale</h1>
        <p>Bem-vindo, {user.email}</p>
      </header>

      <main className="dashboard-content">
        <section className="card">
          <h2>Conexões TikTok Business</h2>
          <p>Conecte sua conta para começar a publicar anúncios em massa.</p>
          
          <div className="connection-status">
            {accounts.length > 0 ? (
              <span className="badge badge-success">Conectado ({accounts.length} contas sincronizadas)</span>
            ) : (
              <span className="badge badge-warning">Nenhuma conta conectada</span>
            )}
          </div>

          <button 
            className="btn btn-primary" 
            onClick={handleConnectTikTok}
            style={{ marginTop: '1rem' }}
          >
            {accounts.length > 0 ? 'Reconectar / Adicionar Conta' : 'Conectar TikTok Business'}
          </button>
        </section>

        <section style={{ marginTop: '2rem' }}>
          <h2>Suas Contas de Anúncio</h2>
          {isLoading ? (
            <p>Carregando contas...</p>
          ) : accounts.length > 0 ? (
            <div className="grid">
              {accounts.map((acc) => (
                <div key={acc.id} className="card ad-account-card">
                  <div className="ad-account-info">
                    <strong>{acc.name}</strong>
                    <code>ID: {acc.external_account_id}</code>
                  </div>
                  <div className="ad-account-status">
                    <span className={`status-dot status-${acc.status?.toLowerCase()}`}></span>
                    {acc.status}
                  </div>
                  <div className="ad-account-footer">
                    <span className="pixel-count">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                      {acc.pixel_count || 0} Pixels
                    </span>
                    <button className="btn-text">Ver Pixels</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card empty-state">
              <p>Nenhuma conta de anúncio encontrada. Conecte sua conta do TikTok Business acima.</p>
            </div>
          )}
        </section>

        <section className="mass-publish-section" style={{ marginTop: '3rem' }}>
          <div className="card highlight-card">
            <h2>Publicação em Massa</h2>
            <p>Selecione suas contas e publique campanhas em escala com um clique.</p>
            <button 
              className="btn btn-secondary" 
              disabled={accounts.length === 0}
              onClick={() => navigate('/mass-publish')}
            >
              Iniciar Nova Publicação
            </button>
          </div>
        </section>
      </main>

      <style>{`
        .dashboard-container {
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }
        .dashboard-header {
          margin-bottom: 2rem;
          border-bottom: 1px solid #eee;
          padding-bottom: 1rem;
        }
        .connection-status {
          margin: 1rem 0;
        }
        .badge {
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.875rem;
          font-weight: 500;
        }
        .badge-warning {
          background-color: #fef3c7;
          color: #92400e;
        }
        .badge-success {
          background-color: #d1fae5;
          color: #065f46;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.5rem;
          margin-top: 1rem;
        }
        .ad-account-card {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          border: 1px solid #e5e7eb;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .ad-account-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .ad-account-info {
          display: flex;
          flex-direction: column;
        }
        .ad-account-info code {
          font-size: 0.75rem;
          color: #6b7280;
          margin-top: 0.25rem;
        }
        .ad-account-status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: #4b5563;
          margin-top: auto;
        }
        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        .status-active { background-color: #10b981; }
        .status-disabled { background-color: #ef4444; }
        
        .ad-account-footer {
          margin-top: 1rem;
          padding-top: 0.75rem;
          border-top: 1px solid #f3f4f6;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .pixel-count {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.75rem;
          color: #6b7280;
        }
        .btn-text {
          background: none;
          border: none;
          color: #ff0050;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          padding: 0;
        }
        .btn-text:hover {
          text-decoration: underline;
        }
        
        .btn {
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }
        .btn-primary {
          background-color: #ff0050;
          color: white;
        }
        .btn-secondary {
          background-color: #000;
          color: white;
        }
        .btn:disabled {
          background-color: #e5e7eb;
          color: #9ca3af;
          cursor: not-allowed;
        }
        .highlight-card {
          background-color: #f9fafb;
          border: 2px dashed #e5e7eb;
          text-align: center;
          padding: 3rem;
        }
        .empty-state {
          padding: 3rem;
          text-align: center;
          color: #6b7280;
          background-color: #f9fafb;
        }
      `}</style>
    </div>
  )
}
