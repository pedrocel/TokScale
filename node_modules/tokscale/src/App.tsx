import { Routes, Route, Link } from 'react-router-dom'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import MassPublish from './pages/MassPublish'
import JobStatus from './pages/JobStatus'

function App() {
  const handleLogout = () => {
    localStorage.removeItem('tokscale_token');
    localStorage.removeItem('tokscale_user');
    window.location.href = '/login';
  };

  return (
    <div className="app">
      <header className="header">
        <div className="container">
          <Link to="/" className="logo">TokScale</Link>
          <nav className="nav">
            <Link to="/">Home</Link>
            <Link to="/login">Login</Link>
            <Link to="/dashboard">Dashboard</Link>
            <button onClick={handleLogout} className="btn-logout">Sair</button>
          </nav>
        </div>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/mass-publish" element={<MassPublish />} />
          <Route path="/jobs/:jobId" element={<JobStatus />} />
          <Route path="*" element={<Landing />} />
        </Routes>
      </main>

      <footer className="footer">
        <div className="container">
          <p>&copy; 2024 TokScale. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  )
}

export default App
