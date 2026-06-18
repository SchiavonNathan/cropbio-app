import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Leaf, User, Lock, ArrowRight, Eye, EyeOff, Shield } from 'lucide-react';
import api from '../services/api';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import './Login.css';

const loginSchema = z.object({
  username: z
    .string()
    .min(3, 'Usuário deve ter no mínimo 3 caracteres')
    .max(64, 'Usuário muito longo')
    .regex(/^[a-zA-Z0-9_.@-]+$/, 'Usuário contém caracteres inválidos'),
  password: z
    .string()
    .min(1, 'A senha é obrigatória')
    .max(128, 'Senha muito longa'),
});

type LoginFormInputs = z.infer<typeof loginSchema>;

const REMEMBER_KEY = '@app-cavazin:remember-username';
const MAX_ATTEMPTS = 10;
const LOCKOUT_MS = 60_000; // 1 minute

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(0);

  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
  });

  // Load saved username on mount
  useEffect(() => {
    const savedUsername = localStorage.getItem(REMEMBER_KEY);
    if (savedUsername) {
      setValue('username', savedUsername);
      setRemember(true);
    }
  }, [setValue]);

  // Countdown timer when locked
  useEffect(() => {
    if (!lockedUntil) return;
    const interval = setInterval(() => {
      const remaining = Math.ceil((lockedUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        setLockedUntil(null);
        setAttempts(0);
        setCountdown(0);
        clearInterval(interval);
      } else {
        setCountdown(remaining);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [lockedUntil]);

  const isLocked = lockedUntil !== null && Date.now() < lockedUntil;

  const onSubmit = async (data: LoginFormInputs) => {
    if (isLocked) return;
    setLoading(true);
    try {
      const response = await api.post('/auth/login', {
        username: data.username.trim(),
        password: data.password,
      });
      const { access_token, user } = response.data;
      login(access_token, user, remember);

      // Save or clear remembered username
      if (remember) {
        localStorage.setItem(REMEMBER_KEY, data.username.trim());
      } else {
        localStorage.removeItem(REMEMBER_KEY);
      }

      setAttempts(0);
      toast.success(`Bem-vindo, ${user.fullName || user.username}!`);
      navigate('/dashboard');
    } catch {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      if (newAttempts >= MAX_ATTEMPTS) {
        const until = Date.now() + LOCKOUT_MS;
        setLockedUntil(until);
        toast.error(`Muitas tentativas. Aguarde ${LOCKOUT_MS / 1000}s para tentar novamente.`);
      } else {
        const remaining = MAX_ATTEMPTS - newAttempts;
        toast.error(`Credenciais inválidas. ${remaining} tentativa${remaining !== 1 ? 's' : ''} restante${remaining !== 1 ? 's' : ''}.`);
      }
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

        <form
          className="login-form"
          onSubmit={(e) => { e.preventDefault(); handleSubmit(onSubmit)(e); }}
          noValidate
        >
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
                autoComplete="username"
                spellCheck={false}
                {...register('username')}
              />
            </div>
            {errors.username && (
              <span className="error-msg">{errors.username.message}</span>
            )}
          </div>

          <div className="input-group">
            <label htmlFor="password">Senha</label>
            <div className="input-with-icon input-with-icon-right">
              <span className="input-icon">
                <Lock size={16} />
              </span>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Sua senha"
                className={errors.password ? 'error' : ''}
                autoComplete="current-password"
                {...register('password')}
              />
              <button
                type="button"
                className="input-eye-btn"
                onClick={() => setShowPassword(v => !v)}
                tabIndex={-1}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <span className="error-msg">{errors.password.message}</span>
            )}
          </div>

          {/* Remember me */}
          <label className="login-remember">
            <input
              type="checkbox"
              checked={remember}
              onChange={e => setRemember(e.target.checked)}
            />
            <span>Lembrar meu usuário neste dispositivo</span>
          </label>

          {/* Lockout warning */}
          {isLocked && (
            <div className="login-lockout">
              <Shield size={16} />
              <span>Acesso bloqueado. Tente novamente em <strong>{countdown}s</strong>.</span>
            </div>
          )}

          {/* Attempt indicator */}
          {attempts > 0 && !isLocked && (
            <div className="login-attempts">
              {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
                <span
                  key={i}
                  className={`login-attempt-dot ${i < attempts ? 'used' : ''}`}
                />
              ))}
              <span className="login-attempts-label">
                {MAX_ATTEMPTS - attempts} tentativa{MAX_ATTEMPTS - attempts !== 1 ? 's' : ''} restante{MAX_ATTEMPTS - attempts !== 1 ? 's' : ''}
              </span>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary login-submit-btn"
            disabled={loading || isLocked}
          >
            {loading ? (
              <>
                <span className="spinner" />
                Entrando...
              </>
            ) : isLocked ? (
              <>
                <Shield size={18} />
                Bloqueado ({countdown}s)
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
