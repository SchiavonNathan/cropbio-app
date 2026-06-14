import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Layout from '../components/Layout';
import {
  UserPlus, Pencil, Trash2, Check, X,
  ShieldCheck, User, Mail, Phone, BadgeCheck
} from 'lucide-react';
import api from '../services/api';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import './UsersPage.css';

interface UserData {
  id: string;
  username: string;
  role: string;
  fullName?: string;
  email?: string;
  phone?: string;
}

const userSchema = z.object({
  id: z.string().optional(),
  fullName: z.string().optional(),
  username: z.string().min(3, 'O login deve ter no mínimo 3 caracteres'),
  email: z.union([z.literal(''), z.string().email('E-mail inválido')]).optional(),
  phone: z.string().optional(),
  password: z.string().optional(),
  role: z.enum(['admin', 'user']),
}).refine(data => data.id ? true : !!data.password && data.password.length >= 4, {
  message: 'A senha é obrigatória (mín. 4 caracteres) para novos usuários',
  path: ['password'],
});

type UserFormInputs = z.infer<typeof userSchema> & { id?: string };

export default function UsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<UserFormInputs>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      role: 'user',
    }
  });

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) {
      toast.error('Erro ao buscar usuários');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingUserId(null);
    reset({ username: '', password: '', role: 'user', fullName: '', email: '', phone: '' });
    setShowForm(true);
  };

  const openEdit = (user: UserData) => {
    setEditingUserId(user.id);
    reset({
      username: user.username,
      password: '', // Empty password field so it doesn't get updated unless changed
      role: user.role as 'admin' | 'user',
      fullName: user.fullName || '',
      email: user.email || '',
      phone: user.phone || '',
    });
    // Manually inject ID for refine validation
    setValue('id', user.id);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingUserId(null);
    reset();
  };

  const onSubmit = async (data: UserFormInputs) => {
    setSaving(true);
    try {
      const payload: any = {
        username: data.username,
        role: data.role,
        fullName: data.fullName || null,
        email: data.email || null,
        phone: data.phone || null,
      };
      
      if (data.password) {
        payload.password = data.password;
      }

      if (editingUserId) {
        const res = await api.patch(`/users/${editingUserId}`, payload);
        setUsers((prev) => prev.map((u) => (u.id === editingUserId ? res.data : u)));
        toast.success('Usuário atualizado com sucesso!');
      } else {
        const res = await api.post('/users', payload);
        setUsers((prev) => [...prev, res.data]);
        toast.success('Usuário criado com sucesso!');
      }
      closeForm();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao salvar usuário.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/users/${id}`);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      toast.success('Usuário deletado com sucesso!');
    } catch {
      toast.error('Erro ao deletar usuário.');
    } finally {
      setDeleteConfirm(null);
    }
  };

  return (
    <Layout>
      <div className="page-header animate-fade-in">
        <div className="page-header-row">
          <div>
            <h1>Usuários</h1>
            <p>Gerencie os usuários do sistema.</p>
          </div>
          <button className="btn btn-primary" onClick={openCreate}>
            <UserPlus size={18} />
            Novo Usuário
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner" />
          Carregando usuários...
        </div>
      ) : (
        <div className="users-table-wrapper glass-panel animate-fade-in">
          <table className="users-table">
            <thead>
              <tr>
                <th>Usuário / Nome</th>
                <th>Contato</th>
                <th>Perfil</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan={4} className="table-empty">Nenhum usuário cadastrado.</td></tr>
              ) : users.map((user) => (
                <tr key={user.id} className="user-row">
                  <td>
                    <div className="user-cell">
                      <div className="user-avatar-sm">
                        {(user.fullName || user.username).charAt(0).toUpperCase()}
                      </div>
                      <div className="user-cell-info">
                        <span className="user-cell-name">{user.fullName || user.username}</span>
                        <span className="user-cell-username">@{user.username}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="contact-cell">
                      {user.email && (
                        <span className="contact-item">
                          <Mail size={13} />
                          {user.email}
                        </span>
                      )}
                      {user.phone && (
                        <span className="contact-item">
                          <Phone size={13} />
                          {user.phone}
                        </span>
                      )}
                      {!user.email && !user.phone && <span className="text-muted">—</span>}
                    </div>
                  </td>
                  <td>
                    <span className={`role-badge ${user.role}`}>
                      {user.role === 'admin'
                        ? <><ShieldCheck size={13} /> Administrador</>
                        : <><User size={13} /> Usuário</>}
                    </span>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button className="btn btn-ghost icon-btn" title="Editar" onClick={() => openEdit(user)}>
                        <Pencil size={16} />
                      </button>
                      {deleteConfirm === user.id ? (
                        <div className="delete-confirm">
                          <span>Confirmar?</span>
                          <button className="btn btn-danger icon-btn" onClick={() => handleDelete(user.id)}><Check size={16} /></button>
                          <button className="btn btn-ghost icon-btn" onClick={() => setDeleteConfirm(null)}><X size={16} /></button>
                        </div>
                      ) : (
                        <button className="btn btn-ghost icon-btn danger" title="Deletar" onClick={() => setDeleteConfirm(user.id)}>
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && createPortal(
        <div className="modal-overlay animate-fade-in" onClick={closeForm}>
          <div className="modal-box modal-wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingUserId ? 'Editar Usuário' : 'Novo Usuário'}</h2>
              <button className="btn btn-ghost icon-btn" onClick={closeForm}><X size={20} /></button>
            </div>

            <form className="modal-form-container" onSubmit={handleSubmit(onSubmit)}>
              <div className="modal-body">
                {/* Seção: Dados Pessoais */}
                <div className="form-section-title">
                  <BadgeCheck size={15} />
                  Dados Pessoais
                </div>
                <div className="form-grid-2">
                  <div className="input-group">
                    <label htmlFor="u-fullname">Nome Completo</label>
                    <input
                      id="u-fullname"
                      type="text"
                      placeholder="João da Silva"
                      {...register('fullName')}
                    />
                    {errors.fullName && <span className="error-text" style={{ color: 'red', fontSize: '0.8rem', marginTop: '4px' }}>{errors.fullName.message}</span>}
                  </div>
                  <div className="input-group">
                    <label htmlFor="u-username">Usuário (login)</label>
                    <input
                      id="u-username"
                      type="text"
                      placeholder="joao.silva"
                      {...register('username')}
                    />
                    {errors.username && <span className="error-text" style={{ color: 'red', fontSize: '0.8rem', marginTop: '4px' }}>{errors.username.message}</span>}
                  </div>
                </div>

                {/* Seção: Contato */}
                <div className="form-section-title">
                  <Mail size={15} />
                  Contato
                </div>
                <div className="form-grid-2">
                  <div className="input-group">
                    <label htmlFor="u-email">E-mail</label>
                    <input
                      id="u-email"
                      type="email"
                      placeholder="joao@empresa.com"
                      {...register('email')}
                    />
                    {errors.email && <span className="error-text" style={{ color: 'red', fontSize: '0.8rem', marginTop: '4px' }}>{errors.email.message}</span>}
                  </div>
                  <div className="input-group">
                    <label htmlFor="u-phone">Telefone</label>
                    <input
                      id="u-phone"
                      type="tel"
                      placeholder="(11) 9 9999-0000"
                      {...register('phone')}
                    />
                    {errors.phone && <span className="error-text" style={{ color: 'red', fontSize: '0.8rem', marginTop: '4px' }}>{errors.phone.message}</span>}
                  </div>
                </div>

                {/* Seção: Acesso */}
                <div className="form-section-title">
                  <ShieldCheck size={15} />
                  Acesso
                </div>
                <div className="form-grid-2">
                  <div className="input-group">
                    <label htmlFor="u-password">
                      Senha{' '}
                      {editingUserId && <span className="label-hint">(vazio = manter atual)</span>}
                    </label>
                    <input
                      id="u-password"
                      type="password"
                      placeholder={editingUserId ? '••••••••' : 'Senha inicial'}
                      {...register('password')}
                    />
                    {errors.password && <span className="error-text" style={{ color: 'red', fontSize: '0.8rem', marginTop: '4px' }}>{errors.password.message}</span>}
                  </div>
                  <div className="input-group">
                    <label htmlFor="u-role">Perfil</label>
                    <select id="u-role" {...register('role')}>
                      <option value="user">Usuário</option>
                      <option value="admin">Administrador</option>
                    </select>
                    {errors.role && <span className="error-text" style={{ color: 'red', fontSize: '0.8rem', marginTop: '4px' }}>{errors.role.message}</span>}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={closeForm}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Salvando...' : editingUserId ? 'Salvar Alterações' : 'Criar Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </Layout>
  );
}
