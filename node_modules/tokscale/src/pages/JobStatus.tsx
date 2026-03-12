import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

export default function JobStatus() {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchJobDetails()
    const interval = setInterval(fetchJobDetails, 3000) // Polling a cada 3s
    return () => clearInterval(interval)
  }, [jobId])

  const fetchJobDetails = async () => {
    try {
      const token = localStorage.getItem('tokscale_token')
      const response = await fetch(`http://localhost:8787/api/jobs/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const result = await response.json()
        setData(result)
        
        // Se o job terminou, podemos parar o polling ou diminuir a frequência
        if (result.job.status === 'completed' || result.job.status === 'failed') {
          setIsLoading(false)
        }
      } else if (response.status === 401) {
        navigate('/login')
      }
    } catch (err) {
      console.error('Erro ao buscar detalhes do job:', err)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading && !data) return <div className="container">Carregando detalhes...</div>
  if (!data) return <div className="container">Job não encontrado.</div>

  const { job, items } = data
  const successCount = items.filter((i: any) => i.status === 'success').length
  const errorCount = items.filter((i: any) => i.status === 'error').length
  const processingCount = items.filter((i: any) => i.status === 'processing').length
  const pendingCount = items.filter((i: any) => i.status === 'pending').length

  return (
    <div className="job-status-container">
      <header className="page-header">
        <button onClick={() => navigate('/dashboard')} className="btn-back">← Voltar</button>
        <h1>Status da Publicação</h1>
        <span className={`status-badge status-${job.status}`}>{job.status.toUpperCase()}</span>
      </header>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-value">{items.length}</span>
          <span className="stat-label">Total de Contas</span>
        </div>
        <div className="stat-card success">
          <span className="stat-value">{successCount}</span>
          <span className="stat-label">Sucessos</span>
        </div>
        <div className="stat-card error">
          <span className="stat-value">{errorCount}</span>
          <span className="stat-label">Falhas</span>
        </div>
        <div className="stat-card processing">
          <span className="stat-value">{processingCount + pendingCount}</span>
          <span className="stat-label">Restantes</span>
        </div>
      </div>

      <section className="items-list" style={{ marginTop: '2rem' }}>
        <h2>Detalhes por Conta</h2>
        <div className="table-wrapper">
          <table className="status-table">
            <thead>
              <tr>
                <th>Conta de Anúncio</th>
                <th>ID Externo</th>
                <th>Status</th>
                <th>ID da Campanha</th>
                <th>Erro</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item: any) => (
                <tr key={item.id}>
                  <td>{item.account_name}</td>
                  <td><code>{item.external_account_id}</code></td>
                  <td>
                    <span className={`item-status status-${item.status}`}>
                      {item.status}
                    </span>
                  </td>
                  <td>{item.external_campaign_id ? <code>{item.external_campaign_id}</code> : '-'}</td>
                  <td className="error-cell">{item.error_message || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <style>{`
        .job-status-container {
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }
        .page-header {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 700;
        }
        .status-pending { background: #eee; }
        .status-processing { background: #dbeafe; color: #1e40af; }
        .status-completed { background: #d1fae5; color: #065f46; }
        .status-failed { background: #fee2e2; color: #991b1b; }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }
        .stat-card {
          background: white;
          padding: 1.5rem;
          border-radius: 12px;
          border: 1px solid #eee;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .stat-value { font-size: 2rem; font-weight: 700; }
        .stat-label { color: #666; font-size: 0.875rem; }
        .stat-card.success .stat-value { color: #10b981; }
        .stat-card.error .stat-value { color: #ef4444; }
        .stat-card.processing .stat-value { color: #3b82f6; }

        .table-wrapper {
          background: white;
          border-radius: 12px;
          border: 1px solid #eee;
          overflow: hidden;
          margin-top: 1rem;
        }
        .status-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        .status-table th, .status-table td {
          padding: 1rem;
          border-bottom: 1px solid #eee;
        }
        .status-table th { background: #fafafa; font-weight: 600; font-size: 0.875rem; }
        .item-status {
          font-size: 0.75rem;
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
          text-transform: uppercase;
          font-weight: 600;
        }
        .item-status.status-success { background: #d1fae5; color: #065f46; }
        .item-status.status-error { background: #fee2e2; color: #991b1b; }
        .item-status.status-processing { background: #dbeafe; color: #1e40af; }
        .error-cell { color: #ef4444; font-size: 0.875rem; }
      `}</style>
    </div>
  )
}
