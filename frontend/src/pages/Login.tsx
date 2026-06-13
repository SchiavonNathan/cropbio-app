import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { LogIn } from 'lucide-react';
import api from '../services/api';
import './Login.css';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { username, password });
      const { access_token, user } = response.data;
      
      login(access_token, user);
      navigate('/dashboard');
    } catch (error) {
      alert('Credenciais inválidas. Tente admin/admin ou user/user');
      console.error('Login error', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="glass-panel login-card animate-fade-in">
        <div className="login-header">
          <div className="logo-placeholder">
            <LogIn size={32} color="var(--primary)" />
          </div>
          <h1>Bem-vindo</h1>
          <p>Acesse o Sistema de Gestão de PDFs</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="input-group">
            <label htmlFor="username">Usuário</label>
            <input
              id="username"
              type="text"
              placeholder="Digite seu usuário (tente 'admin')"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              type="password"
              placeholder="Sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        
        <div className="login-footer">
          <small>Sistema de demonstração</small>
        </div>
      </div>
    </div>
  );
}
