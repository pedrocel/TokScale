import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

type LoginStatus = 'idle' | 'submitting' | 'success'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<LoginStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  const canSubmit = useMemo(() => {
    if (status === 'submitting') return false
    if (!email.trim()) return false
    if (password.length < 6) return false
    return true
  }, [email, password, status])

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (!email.trim()) {
      setError('Informe seu email.')
      return
    }
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }

    setStatus('submitting')
    try {
      const response = await fetch('http://localhost:8787/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        throw new Error('Falha no login')
      }

      const data = await response.json()
      localStorage.setItem('tokscale_token', data.token)
      localStorage.setItem('tokscale_user', JSON.stringify(data.user))

      setStatus('success')
      navigate('/')
    } catch (err) {
      setError('Credenciais inválidas ou erro no servidor.')
      setStatus('idle')
    }
  }

  return (
    <div className="container section">
      <div className="auth">
        <div className="auth__card">
          <h1 className="auth__title">Entrar</h1>
          <p className="auth__subtitle">Acesse seu workspace do TokScale.</p>

          <form className="form" onSubmit={onSubmit}>
            <label className="field">
              <span className="field__label">Email</span>
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@empresa.com"
                autoComplete="email"
              />
            </label>

            <label className="field">
              <span className="field__label">Senha</span>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </label>

            {error ? <div className="alert alert--error">{error}</div> : null}
            {status === 'success' ? (
              <div className="alert alert--success">Login simulado. Próximo: backend/auth.</div>
            ) : null}

            <button className="btn btn--primary btn--full" type="submit" disabled={!canSubmit}>
              {status === 'submitting' ? 'Entrando…' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

