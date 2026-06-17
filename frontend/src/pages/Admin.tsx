import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { UploadCloud, FileText, X, Info, FolderPlus, Pencil, Check, XCircle, Trash2, AlertTriangle } from 'lucide-react';
import api from '../services/api';
import { toast } from 'sonner';
import './Admin.css';

const CATEGORIES = [
  'Produtos e tabelas',
  'Culturas',
  'Resultados',
  'Palestras',
];

interface Subcategory {
  id: string;
  name: string;
  category: string;
  _count: { pdfs: number };
}

export default function Admin() {
  // ---- Upload state ----
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [subcategoryId, setSubcategoryId] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // ---- Subcategory management state ----
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(true);
  const [newSubName, setNewSubName] = useState('');
  const [newSubCategory, setNewSubCategory] = useState(CATEGORIES[0]);
  const [creatingNew, setCreatingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteSub, setConfirmDeleteSub] = useState<Subcategory | null>(null);

  // ---- Load subcategories ----
  const fetchSubcategories = async () => {
    try {
      const res = await api.get<Subcategory[]>('/subcategories');
      setSubcategories(res.data);
    } catch {
      toast.error('Erro ao carregar subcategorias.');
    } finally {
      setLoadingSubs(false);
    }
  };

  useEffect(() => { fetchSubcategories(); }, []);

  // When category changes in upload form, reset subcategoryId
  useEffect(() => { setSubcategoryId(''); }, [category]);

  const subsForUploadCategory = subcategories.filter(s => s.category === category);

  // ---- Upload ----
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type === 'application/pdf') setSelectedFile(file);
    else toast.error('Apenas arquivos PDF são permitidos.');
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    if (!subcategoryId) { toast.error('Selecione uma subcategoria.'); return; }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('category', category);
    formData.append('subcategoryId', subcategoryId);

    try {
      await api.post('/pdfs', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('PDF enviado com sucesso!');
      setSelectedFile(null);
      setSubcategoryId('');
    } catch {
      toast.error('Falha no upload. Verifique suas permissões de Admin.');
    } finally {
      setUploading(false);
    }
  };

  // ---- Create subcategory ----
  const handleCreateSub = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newSubName.trim();
    if (!name) return;
    setCreatingNew(true);
    try {
      const res = await api.post<Subcategory>('/subcategories', { name, category: newSubCategory });
      setSubcategories(prev => [...prev, { ...res.data, _count: { pdfs: 0 } }]);
      setNewSubName('');
      toast.success('Subcategoria criada!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao criar subcategoria.');
    } finally {
      setCreatingNew(false);
    }
  };

  // ---- Rename subcategory ----
  const startEdit = (sub: Subcategory) => {
    setEditingId(sub.id);
    setEditName(sub.name);
  };

  const confirmRename = async (id: string) => {
    const name = editName.trim();
    if (!name) { setEditingId(null); return; }
    try {
      const res = await api.patch<Subcategory>(`/subcategories/${id}`, { name });
      setSubcategories(prev => prev.map(s => s.id === id ? { ...s, name: res.data.name } : s));
      toast.success('Subcategoria renomeada!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao renomear.');
    } finally {
      setEditingId(null);
    }
  };

  // ---- Delete subcategory ----
  const handleDeleteSub = async () => {
    if (!confirmDeleteSub) return;
    setDeletingId(confirmDeleteSub.id);
    try {
      await api.delete(`/subcategories/${confirmDeleteSub.id}`);
      setSubcategories(prev => prev.filter(s => s.id !== confirmDeleteSub.id));
      toast.success('Subcategoria excluída!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao excluir.');
    } finally {
      setDeletingId(null);
      setConfirmDeleteSub(null);
    }
  };

  const groupedSubs = CATEGORIES.map(cat => ({
    category: cat,
    items: subcategories.filter(s => s.category === cat),
  }));

  return (
    <Layout>
      <div className="page-header animate-fade-in">
        <h1>Administração</h1>
        <p>Gerencie o repositório de PDFs disponíveis para os usuários.</p>
      </div>

      <div className="admin-layout animate-fade-in">
        {/* Upload Card */}
        <div className="card upload-card">
          <div className="upload-card-header">
            <h2>Enviar Novo Documento</h2>
            <p>Faça upload de PDFs para disponibilizá-los no aplicativo.</p>
          </div>

          <form onSubmit={handleUpload}>
            {/* Category Select */}
            <div className="input-group">
              <label htmlFor="category">Categoria</label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Subcategory Select */}
            <div className="input-group">
              <label htmlFor="subcategory">Subcategoria <span className="label-required">*</span></label>
              {subsForUploadCategory.length === 0 ? (
                <div className="no-subs-hint">
                  Nenhuma subcategoria em "{category}". Crie uma abaixo antes de fazer upload.
                </div>
              ) : (
                <select
                  id="subcategory"
                  value={subcategoryId}
                  onChange={(e) => setSubcategoryId(e.target.value)}
                  required
                >
                  <option value="">Selecione uma subcategoria...</option>
                  {subsForUploadCategory.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Dropzone */}
            <div
              className={`upload-dropzone ${dragOver ? 'drag-over' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept=".pdf"
                id="file-upload"
                className="file-input-hidden"
                onChange={handleFileChange}
              />
              {!selectedFile ? (
                <label htmlFor="file-upload" className="dropzone-label">
                  <div className="dropzone-icon">
                    <UploadCloud size={32} color="var(--accent)" />
                  </div>
                  <h3>Clique para selecionar ou arraste o arquivo</h3>
                  <p>Somente arquivos no formato .PDF</p>
                </label>
              ) : (
                <div className="file-preview">
                  <div className="file-preview-icon">
                    <FileText size={24} color="var(--accent)" />
                  </div>
                  <div className="file-preview-info">
                    <div className="file-preview-name">{selectedFile.name}</div>
                    <div className="file-preview-size">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                  <button
                    type="button"
                    className="file-preview-remove"
                    onClick={() => setSelectedFile(null)}
                    title="Remover arquivo"
                  >
                    <X size={18} />
                  </button>
                </div>
              )}
            </div>

            <div className="upload-form-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!selectedFile || uploading || !subcategoryId}
              >
                {uploading ? (
                  <>
                    <span className="spinner" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <UploadCloud size={18} />
                    Fazer Upload
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Tips Card */}
        <div className="card tips-card">
          <h3>
            <Info size={16} color="var(--accent)" />
            Dicas de uso
          </h3>
          <ul className="tip-list">
            <li className="tip-item">
              <span className="tip-bullet" />
              <span>Apenas arquivos <strong>.PDF</strong> são aceitos pelo sistema.</span>
            </li>
            <li className="tip-item">
              <span className="tip-bullet" />
              <span>Escolha a <strong>categoria e subcategoria corretas</strong> antes de enviar.</span>
            </li>
            <li className="tip-item">
              <span className="tip-bullet" />
              <span>Documentos enviados ficam disponíveis <strong>imediatamente</strong> no app mobile para sincronização.</span>
            </li>
            <li className="tip-item">
              <span className="tip-bullet" />
              <span>Para <strong>renomear ou excluir</strong> um PDF, acesse o Dashboard.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* ---- Subcategory Management ---- */}
      <div className="subcats-section animate-fade-in">
        <div className="subcats-header">
          <div>
            <h2>Gerenciar Subcategorias</h2>
            <p>Crie, renomeie ou exclua subcategorias dentro de cada categoria.</p>
          </div>
        </div>

        {/* Create new */}
        <div className="card subcat-create-card">
          <h3><FolderPlus size={16} color="var(--accent)" /> Nova Subcategoria</h3>
          <form className="subcat-create-form" onSubmit={handleCreateSub}>
            <select
              value={newSubCategory}
              onChange={(e) => setNewSubCategory(e.target.value)}
            >
              {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <input
              type="text"
              placeholder="Nome da subcategoria..."
              value={newSubName}
              onChange={(e) => setNewSubName(e.target.value)}
              maxLength={80}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!newSubName.trim() || creatingNew}
            >
              {creatingNew ? <span className="spinner" /> : <><FolderPlus size={16} /> Criar</>}
            </button>
          </form>
        </div>

        {/* List by category */}
        {loadingSubs ? (
          <div className="loading-state">
            <div className="spinner spinner-lg" />
            <span>Carregando subcategorias...</span>
          </div>
        ) : (
          <div className="subcats-grid">
            {groupedSubs.map(({ category: cat, items }) => (
              <div key={cat} className="card subcat-group-card">
                <div className="subcat-group-title">{cat}</div>
                {items.length === 0 ? (
                  <p className="subcat-empty">Nenhuma subcategoria.</p>
                ) : (
                  <ul className="subcat-list">
                    {items.map(sub => (
                      <li key={sub.id} className="subcat-item">
                        {editingId === sub.id ? (
                          <div className="subcat-rename-form">
                            <input
                              className="rename-input"
                              value={editName}
                              onChange={e => setEditName(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') confirmRename(sub.id); if (e.key === 'Escape') setEditingId(null); }}
                              autoFocus
                            />
                            <button className="btn btn-primary btn-icon btn-sm" onClick={() => confirmRename(sub.id)}><Check size={14} /></button>
                            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setEditingId(null)}><XCircle size={14} /></button>
                          </div>
                        ) : (
                          <>
                            <div className="subcat-item-info">
                              <span className="subcat-name">{sub.name}</span>
                              <span className="subcat-count">{sub._count.pdfs} PDF{sub._count.pdfs !== 1 ? 's' : ''}</span>
                            </div>
                            <div className="subcat-item-actions">
                              <button className="btn btn-ghost btn-icon btn-sm" title="Renomear" onClick={() => startEdit(sub)}>
                                <Pencil size={14} />
                              </button>
                              <button
                                className="btn btn-ghost btn-icon btn-sm btn-danger"
                                title="Excluir"
                                onClick={() => setConfirmDeleteSub(sub)}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {confirmDeleteSub && (
        <div className="pdf-modal-overlay animate-fade-in" onClick={() => !deletingId && setConfirmDeleteSub(null)}>
          <div className="delete-confirm-modal" onClick={e => e.stopPropagation()}>
            <div className="delete-confirm-icon">
              <AlertTriangle size={32} color="#ef4444" />
            </div>
            <h3>Excluir subcategoria</h3>
            <p>
              Tem certeza que deseja excluir <strong>{confirmDeleteSub.name}</strong>?
              {confirmDeleteSub._count.pdfs > 0 && (
                <> Esta subcategoria possui <strong>{confirmDeleteSub._count.pdfs} PDF(s)</strong> vinculados e não pode ser excluída.</>
              )}
            </p>
            <div className="delete-confirm-actions">
              <button className="btn btn-ghost" onClick={() => setConfirmDeleteSub(null)} disabled={!!deletingId}>
                Cancelar
              </button>
              {confirmDeleteSub._count.pdfs === 0 && (
                <button className="btn btn-danger" onClick={handleDeleteSub} disabled={!!deletingId}>
                  {deletingId ? <><span className="spinner" /> Excluindo...</> : <><Trash2 size={16} /> Excluir</>}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
