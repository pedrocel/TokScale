import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface AdAccount {
  id: string
  external_account_id: string
  name: string
  status: string
}

export default function MassPublish() {
  const navigate = useNavigate()
  const [accounts, setAccounts] = useState<AdAccount[]>([])
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form states
  const [campaignName, setCampaignName] = useState('')
  const [objective, setObjective] = useState('TRAFFIC')
  const [budget, setBudget] = useState('50.00')

  useState(() => {
    const token = localStorage.getItem('tokscale_token')
    fetch('http://localhost:8787/api/accounts', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => {
        if (res.status === 401) navigate('/login')
        return res.json()
      })
      .then(data => {
        setAccounts(data)
        setIsLoading(false)
      })
      .catch(() => setIsLoading(false))
  })

  const handleToggleAccount = (id: string) => {
    setSelectedAccounts(prev => 
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedAccounts.length === 0) return alert('Selecione ao menos uma conta')

    setIsSubmitting(true)
    try {
      const token = localStorage.getItem('tokscale_token')
      const response = await fetch('http://localhost:8787/api/jobs/publish', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          accounts: selectedAccounts,
          campaign: {
            name: campaignName,
            objective,
            budget: parseFloat(budget)
          }
        })
      })

      if (response.ok) {
        const data = await response.json()
        navigate(`/jobs/${data.job_id}`)
      }
    } catch (err) {
      alert('Erro ao criar job')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) return <div className="container">Carregando...</div>

  return (
    <div className="mass-publish-container">
      <header className="page-header">
        <button onClick={() => navigate('/dashboard')} className="btn-back">← Voltar</button>
        <h1>Nova Publicação em Massa</h1>
      </header>

      <form onSubmit={handleSubmit} className="publish-form">
        <div className="form-grid">
          <section className="form-section">
            <h2>1. Configuração da Campanha</h2>
            <div className="form-group">
              <label>Nome da Campanha</label>
              <input 
                type="text" 
                value={campaignName} 
                onChange={e => setCampaignName(e.target.value)} 
                placeholder="Ex: Promoção de Verão 2024"
                required
              />
            </div>
            <div className="form-group">
              <label>Objetivo</label>
              <select value={objective} onChange={e => setObjective(e.target.value)}>
                <option value="TRAFFIC">Tráfego</option>
                <option value="CONVERSIONS">Conversões</option>
                <option value="VIDEO_VIEWS">Visualizações de Vídeo</option>
              </select>
            </div>
            <div className="form-group">
              <label>Orçamento Diário (por conta)</label>
              <input 
                type="number" 
                value={budget} 
                onChange={e => setBudget(e.target.value)} 
                step="0.01"
                min="50"
                required
              />
            </div>
          </section>

          <section className="form-section">
            <h2>2. Selecionar Contas ({selectedAccounts.length})</h2>
            <div className="accounts-selector">
              {accounts.map(acc => (
                <label key={acc.id} className={`account-item ${selectedAccounts.includes(acc.id) ? 'selected' : ''}`}>
                  <input 
                    type="checkbox" 
                    checked={selectedAccounts.includes(acc.id)}
                    onChange={() => handleToggleAccount(acc.id)}
                  />
                  <div className="account-info">
                    <span className="account-name">{acc.name}</span>
                    <span className="account-id">{acc.external_account_id}</span>
                  </div>
                </label>
              ))}
            </div>
          </section>
        </div>

        <footer className="form-footer">
          <button 
            type="submit" 
            className="btn btn-submit" 
            disabled={isSubmitting || selectedAccounts.length === 0}
          >
            {isSubmitting ? 'Processando...' : `Publicar em ${selectedAccounts.length} Contas`}
          </button>
        </footer>
      </form>

      <style>{`
        .mass-publish-container {
          padding: 2rem;
          max-width: 1000px;
          margin: 0 auto;
        }
        .page-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 2rem;
        }
        .btn-back {
          background: none;
          border: none;
          color: #666;
          cursor: pointer;
          font-size: 1rem;
        }
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }
        .form-section {
          background: white;
          padding: 1.5rem;
          border-radius: 12px;
          border: 1px solid #eee;
        }
        .form-group {
          margin-bottom: 1.25rem;
        }
        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          font-size: 0.875rem;
        }
        .form-group input, .form-group select {
          width: 100%;
          padding: 0.625rem;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 1rem;
        }
        .accounts-selector {
          max-height: 400px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .account-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem;
          border: 1px solid #eee;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .account-item:hover {
          border-color: #ff0050;
        }
        .account-item.selected {
          background-color: #fff0f5;
          border-color: #ff0050;
        }
        .account-info {
          display: flex;
          flex-direction: column;
        }
        .account-name {
          font-weight: 500;
        }
        .account-id {
          font-size: 0.75rem;
          color: #888;
        }
        .form-footer {
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 1px solid #eee;
          text-align: right;
        }
        .btn-submit {
          background-color: #ff0050;
          color: white;
          padding: 1rem 2rem;
          border-radius: 8px;
          border: none;
          font-weight: 600;
          font-size: 1.125rem;
          cursor: pointer;
          width: 100%;
        }
        .btn-submit:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  )
}
