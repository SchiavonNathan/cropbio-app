import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Layout from '../components/Layout';
import {
  Users, UserPlus, Pencil, Trash2, Check, X,
  ShieldCheck, User, Mail, Phone, BadgeCheck
} from 'lucide-react';
import api from '../services/api';
import './UsersPage.css';

interface UserData {
  id: string;
  username: string;
  role: string;
  fullName?: string;
  email?: string;
  phone?: string;
}

const EMPTY_FORM = {
  username: '',
  password: '',
  role: 'user',
  fullName: '',
  email: '',
  phone: '',
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) {
      console.error('Erro ao buscar usuários', err);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingUser(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (user: UserData) => {
    setEditingUser(user);
    setForm({
      username: user.username,
      password: '',
      role: user.role,
      fullName: user.fullName || '',
      email: user.email || '',
      phone: user.phone || '',
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingUser(null);
    setForm(EMPTY_FORM);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingUser) {
        const payload: any = {
          username: form.username,
          role: form.role,
          fullName: form.fullName || null,
          email: form.email || null,
          phone: form.phone || null,
        };
        if (form.password) payload.password = form.password;
        const res = await api.patch(`/users/${editingUser.id}`, payload);
        setUsers((prev) => prev.map((u) => (u.id === editingUser.id ? res.data : u)));
      } else {
        const res = await api.post('/users', {
          ...form,
          fullName: form.fullName || null,
          email: form.email || null,
          phone: form.phone || null,
        });
        setUsers((prev) => [...prev, res.data]);
      }
      closeForm();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Erro ao salvar usuário.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/users/${id}`);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch {
      alert('Erro ao deletar usuário.');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const f = (v: typeof form) => setForm(v);

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
              <h2>{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</h2>
              <button className="btn btn-ghost icon-btn" onClick={closeForm}><X size={20} /></button>
            </div>

            <form className="modal-form-container" onSubmit={handleSave}>
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
                      value={form.fullName}
                      onChange={(e) => f({ ...form, fullName: e.target.value })}
                      placeholder="João da Silva"
                    />
                  </div>
                  <div className="input-group">
                    <label htmlFor="u-username">Usuário (login)</label>
                    <input
                      id="u-username"
                      type="text"
                      required
                      value={form.username}
                      onChange={(e) => f({ ...form, username: e.target.value })}
                      placeholder="joao.silva"
                    />
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
                      value={form.email}
                      onChange={(e) => f({ ...form, email: e.target.value })}
                      placeholder="joao@empresa.com"
                    />
                  </div>
                  <div className="input-group">
                    <label htmlFor="u-phone">Telefone</label>
                    <input
                      id="u-phone"
                      type="tel"
                      value={form.phone}
                      onChange={(e) => f({ ...form, phone: e.target.value })}
                      placeholder="(11) 9 9999-0000"
                    />
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
                      {editingUser && <span className="label-hint">(vazio = manter atual)</span>}
                    </label>
                    <input
                      id="u-password"
                      type="password"
                      required={!editingUser}
                      value={form.password}
                      onChange={(e) => f({ ...form, password: e.target.value })}
                      placeholder={editingUser ? '••••••••' : 'Senha inicial'}
                    />
                  </div>
                  <div className="input-group">
                    <label htmlFor="u-role">Perfil</label>
                    <select id="u-role" value={form.role} onChange={(e) => f({ ...form, role: e.target.value })}>
                      <option value="user">Usuário</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={closeForm}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Salvando...' : editingUser ? 'Salvar Alterações' : 'Criar Usuário'}
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
