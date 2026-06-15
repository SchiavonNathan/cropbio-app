import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Leaf, User, Lock, ArrowRight } from 'lucide-react';
import api from '../services/api';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import './Login.css';

const loginSchema = z.object({
  username: z.string().min(3, 'Usuário deve ter no mínimo 3 caracteres'),
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
        password: data.password,
      });
      const { access_token, user } = response.data;
      login(access_token, user);
      toast.success('Bem-vindo de volta!');
      navigate('/dashboard');
    } catch {
      toast.error('Credenciais inválidas. Verifique seu usuário e senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root">
      <div className="card login-card animate-fade-in">
        <div className="login-logo-wrapper">
          <div className="login-logo">
            <Leaf size={26} color="white" />
          </div>
        </div>

        <div className="login-header">
          <h1>Vitalforce</h1>
          <p>Acesse o Sistema de Gestão de PDFs</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="input-group">
            <label htmlFor="username">Usuário</label>
            <div className="input-with-icon">
              <span className="input-icon">
                <User size={16} />
              </span>
              <input
                id="username"
                type="text"
                placeholder="Seu nome de usuário"
                className={errors.username ? 'error' : ''}
                {...register('username')}
              />
            </div>
            {errors.username && (
              <span className="error-msg">{errors.username.message}</span>
            )}
          </div>

          <div className="input-group">
            <label htmlFor="password">Senha</label>
            <div className="input-with-icon">
              <span className="input-icon">
                <Lock size={16} />
              </span>
              <input
                id="password"
                type="password"
                placeholder="Sua senha"
                className={errors.password ? 'error' : ''}
                {...register('password')}
              />
            </div>
            {errors.password && (
              <span className="error-msg">{errors.password.message}</span>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary login-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner" />
                Entrando...
              </>
            ) : (
              <>
                Entrar
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="login-footer">
          Sistema Vitalforce · Acesso Restrito
        </div>
      </div>
    </div>
  );
}
