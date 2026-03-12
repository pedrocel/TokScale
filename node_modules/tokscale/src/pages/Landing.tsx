import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <div className="container section">
      <div className="hero">
        <div className="hero__badge">Micro‑SaaS para anúncios em escala</div>
        <h1 className="hero__title">Publique anúncios no TikTok em múltiplas contas</h1>
        <p className="hero__subtitle">
          Conecte suas contas, padronize templates e rode publicações em lote com logs e
          governança.
        </p>

        <div className="hero__actions">
          <Link className="btn btn--primary" to="/login">
            Entrar
          </Link>
          <a className="btn btn--ghost" href="#como-funciona">
            Como funciona
          </a>
        </div>
      </div>

      <div id="como-funciona" className="grid">
        <div className="card">
          <h3>Conectar</h3>
          <p>Conecte seu TikTok Business e sincronize as contas de anúncio.</p>
        </div>
        <div className="card">
          <h3>Padronizar</h3>
          <p>Crie templates de campanha para reduzir erros e acelerar a operação.</p>
        </div>
        <div className="card">
          <h3>Publicar</h3>
          <p>Execute jobs em lote com status por conta, retries e relatório final.</p>
        </div>
      </div>
    </div>
  )
}

