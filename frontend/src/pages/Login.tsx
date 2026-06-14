import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { LogIn } from 'lucide-react';
import api from '../services/api';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import './Login.css';

const loginSchema = z.object({
  username: z.string().min(3, 'O usuário deve ter no mínimo 3 caracteres'),
  password: z.string().min(1, 'A senha é obrigatória'),
});

type LoginFormInputs = z.infer<typeof loginSchema>;

export default function Login() {
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormInputs) => {
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { 
        username: data.username, 
        password: data.password 
      });
      const { access_token, user } = response.data;
      
      login(access_token, user);
      toast.success('Login realizado com sucesso!');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Credenciais inválidas. Verifique seu usuário e senha.');
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

        <form onSubmit={handleSubmit(onSubmit)} className="login-form">
          <div className="input-group">
            <label htmlFor="username">Usuário</label>
            <input
              id="username"
              type="text"
              placeholder="Digite seu usuário (ex: admin)"
              {...register('username')}
            />
            {errors.username && <span className="error-text" style={{ color: 'red', fontSize: '0.8rem', marginTop: '4px' }}>{errors.username.message}</span>}
          </div>

          <div className="input-group">
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              type="password"
              placeholder="Sua senha"
              {...register('password')}
            />
            {errors.password && <span className="error-text" style={{ color: 'red', fontSize: '0.8rem', marginTop: '4px' }}>{errors.password.message}</span>}
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
