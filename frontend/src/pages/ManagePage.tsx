import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Layout from '../components/Layout';
import {
  FolderPlus, Pencil, Check, XCircle, Trash2, AlertTriangle,
  FileText, FolderOpen, Layers, FileCog,
} from 'lucide-react';
import api from '../services/api';
import { toast } from 'sonner';
import './Dashboard.css'; // shared modal + danger button styles
import './ManagePage.css';

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
  iconUrl?: string;
  _count: { pdfs: number };
}

interface PdfItem {
  id: string;
  name: string;
  hash: string;
  url_download: string;
  category: string;
  subcategoryId: string | null;
  subcategoryName: string | null;
}

type Tab = 'subcategories' | 'pdfs';

export default function ManagePage() {
  const [activeTab, setActiveTab] = useState<Tab>('subcategories');

  // ---- Subcategory state ----
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(true);
  const [newSubName, setNewSubName] = useState('');
  const [newSubCategory, setNewSubCategory] = useState(CATEGORIES[0]);
  const [newSubIcon, setNewSubIcon] = useState<File | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [editSubName, setEditSubName] = useState('');
  const [confirmDeleteSub, setConfirmDeleteSub] = useState<Subcategory | null>(null);
  const [deletingSubId, setDeletingSubId] = useState<string | null>(null);

  // ---- PDF state ----
  const [pdfs, setPdfs] = useState<PdfItem[]>([]);
  const [loadingPdfs, setLoadingPdfs] = useState(true);
  const [editingPdfId, setEditingPdfId] = useState<string | null>(null);
  const [editPdfName, setEditPdfName] = useState('');
  const [confirmDeletePdfId, setConfirmDeletePdfId] = useState<string | null>(null);
  const [deletingPdf, setDeletingPdf] = useState(false);
  const [movingPdf, setMovingPdf] = useState<PdfItem | null>(null);
  const [moveCategory, setMoveCategory] = useState('');
  const [moveSubcategoryId, setMoveSubcategoryId] = useState('');
  const [moving, setMoving] = useState(false);
  const [pdfFilterCategory, setPdfFilterCategory] = useState('');

  // ---- Load data ----
  const fetchSubs = async () => {
    try {
      const res = await api.get<Subcategory[]>('/subcategories');
      setSubcategories(res.data);
    } catch { toast.error('Erro ao carregar subcategorias.'); }
    finally { setLoadingSubs(false); }
  };

  const fetchPdfs = async () => {
    try {
      const res = await api.get<PdfItem[]>('/pdfs');
      setPdfs(res.data);
    } catch { toast.error('Erro ao carregar PDFs.'); }
    finally { setLoadingPdfs(false); }
  };

  useEffect(() => {
    fetchSubs();
    fetchPdfs();
  }, []);

  // ===== SUBCATEGORY HANDLERS =====
  const handleCreateSub = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newSubName.trim();
    if (!name) return;
    setCreatingNew(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('category', newSubCategory);
      if (newSubIcon) {
        formData.append('icon', newSubIcon);
      }

      const res = await api.post<Subcategory>('/subcategories', formData);
      setSubcategories(prev => [...prev, { ...res.data, _count: { pdfs: 0 } }]);
      setNewSubName('');
      setNewSubIcon(null);
      toast.success('Subcategoria criada!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao criar subcategoria.');
    } finally { setCreatingNew(false); }
  };

  const confirmRenameSub = async (id: string) => {
    const name = editSubName.trim();
    if (!name) { setEditingSubId(null); return; }
    try {
      const res = await api.patch<Subcategory>(`/subcategories/${id}`, { name });
      setSubcategories(prev => prev.map(s => s.id === id ? { ...s, name: res.data.name } : s));
      toast.success('Subcategoria renomeada!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao renomear.');
    } finally { setEditingSubId(null); }
  };

  const handleDeleteSub = async () => {
    if (!confirmDeleteSub) return;
    setDeletingSubId(confirmDeleteSub.id);
    try {
      await api.delete(`/subcategories/${confirmDeleteSub.id}`);
      setSubcategories(prev => prev.filter(s => s.id !== confirmDeleteSub.id));
      toast.success('Subcategoria excluída!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao excluir.');
    } finally {
      setDeletingSubId(null);
      setConfirmDeleteSub(null);
    }
  };

  const groupedSubs = CATEGORIES.map(cat => ({
    category: cat,
    items: subcategories.filter(s => s.category === cat),
  }));

  // ===== PDF HANDLERS =====
  const confirmRenamePdf = async (id: string) => {
    const name = editPdfName.trim();
    if (!name) { setEditingPdfId(null); return; }
    try {
      const res = await api.patch(`/pdfs/${id}`, { name });
      setPdfs(prev => prev.map(p => p.id === id ? { ...p, name: res.data.name } : p));
      toast.success('PDF renomeado!');
    } catch { toast.error('Erro ao renomear.'); }
    finally { setEditingPdfId(null); }
  };

  const handleDeletePdf = async () => {
    if (!confirmDeletePdfId) return;
    setDeletingPdf(true);
    try {
      await api.delete(`/pdfs/${confirmDeletePdfId}`);
      setPdfs(prev => prev.filter(p => p.id !== confirmDeletePdfId));
      toast.success('PDF excluído!');
    } catch { toast.error('Erro ao excluir.'); }
    finally { setDeletingPdf(false); setConfirmDeletePdfId(null); }
  };

  const openMoveModal = (pdf: PdfItem) => {
    setMovingPdf(pdf);
    setMoveCategory(pdf.category || CATEGORIES[0]);
    setMoveSubcategoryId(pdf.subcategoryId || '');
  };

  const subsForMoveCategory = subcategories.filter(s => s.category === moveCategory);

  const handleMove = async () => {
    if (!movingPdf || !moveSubcategoryId) return;
    setMoving(true);
    try {
      const res = await api.patch(`/pdfs/${movingPdf.id}`, { subcategoryId: moveSubcategoryId });
      setPdfs(prev => prev.map(p => p.id === movingPdf.id ? {
        ...p,
        category: res.data.category,
        subcategoryId: res.data.subcategoryId,
        subcategoryName: res.data.subcategoryName,
      } : p));
      toast.success('PDF movido!');
      setMovingPdf(null);
    } catch { toast.error('Erro ao mover.'); }
    finally { setMoving(false); }
  };

  const filteredPdfs = pdfFilterCategory
    ? pdfs.filter(p => p.category === pdfFilterCategory)
    : pdfs;

  return (
    <Layout>
      <div className="page-header animate-fade-in">
        <h1>Gerenciamento</h1>
        <p>Gerencie subcategorias e documentos do repositório.</p>
      </div>

      {/* Tab bar */}
      <div className="manage-tabs animate-fade-in">
        <button
          className={`manage-tab ${activeTab === 'subcategories' ? 'active' : ''}`}
          onClick={() => setActiveTab('subcategories')}
        >
          <Layers size={16} />
          Subcategorias
        </button>
        <button
          className={`manage-tab ${activeTab === 'pdfs' ? 'active' : ''}`}
          onClick={() => setActiveTab('pdfs')}
        >
          <FileCog size={16} />
          Documentos
          {pdfs.length > 0 && <span className="manage-tab-badge">{pdfs.length}</span>}
        </button>
      </div>

      {/* ===== TAB: SUBCATEGORIES ===== */}
      {activeTab === 'subcategories' && (
        <div className="manage-content animate-fade-in">
          {/* Create new */}
          <div className="card manage-create-card">
            <h3><FolderPlus size={16} color="var(--accent)" /> Nova Subcategoria</h3>
            <form className="manage-create-form" onSubmit={handleCreateSub}>
              <select value={newSubCategory} onChange={(e) => setNewSubCategory(e.target.value)}>
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <input
                type="text"
                placeholder="Nome da subcategoria..."
                value={newSubName}
                onChange={(e) => setNewSubName(e.target.value)}
                maxLength={80}
              />
              <div className="manage-icon-upload">
                <input
                  type="file"
                  id="sub-icon-upload"
                  accept="image/jpeg, image/png, image/webp"
                  onChange={(e) => setNewSubIcon(e.target.files?.[0] || null)}
                  title="Selecionar ícone"
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={!newSubName.trim() || creatingNew}>
                {creatingNew ? <span className="spinner" /> : <><FolderPlus size={16} /> Criar</>}
              </button>
            </form>
          </div>

          {/* List by category */}
          {loadingSubs ? (
            <div className="loading-state"><div className="spinner spinner-lg" /><span>Carregando...</span></div>
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
                          {editingSubId === sub.id ? (
                            <div className="subcat-rename-form">
                              <input
                                className="rename-input"
                                value={editSubName}
                                onChange={e => setEditSubName(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') confirmRenameSub(sub.id); if (e.key === 'Escape') setEditingSubId(null); }}
                                autoFocus
                              />
                              <button className="btn btn-primary btn-icon btn-sm" onClick={() => confirmRenameSub(sub.id)}><Check size={14} /></button>
                              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setEditingSubId(null)}><XCircle size={14} /></button>
                            </div>
                          ) : (
                            <>
                              <div className="subcat-item-info">
                                <span className="subcat-name">{sub.name}</span>
                                {sub.iconUrl && (
                                  <img src={sub.iconUrl} alt="Ícone" className="subcat-icon" />
                                )}
                                <span className="subcat-count">{sub._count.pdfs} PDF{sub._count.pdfs !== 1 ? 's' : ''}</span>
                              </div>
                              <div className="subcat-item-actions">
                                <button className="btn btn-ghost btn-icon btn-sm" title="Renomear" onClick={() => { setEditingSubId(sub.id); setEditSubName(sub.name); }}>
                                  <Pencil size={14} />
                                </button>
                                <button className="btn btn-ghost btn-icon btn-sm btn-danger" title="Excluir" onClick={() => setConfirmDeleteSub(sub)}>
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
      )}

      {/* ===== TAB: PDFs ===== */}
      {activeTab === 'pdfs' && (
        <div className="manage-content animate-fade-in">
          {/* Filter bar */}
          <div className="manage-pdf-toolbar">
            <select value={pdfFilterCategory} onChange={e => setPdfFilterCategory(e.target.value)}>
              <option value="">Todas as categorias</option>
              {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <span className="manage-pdf-count">{filteredPdfs.length} documento{filteredPdfs.length !== 1 ? 's' : ''}</span>
          </div>

          {loadingPdfs ? (
            <div className="loading-state"><div className="spinner spinner-lg" /><span>Carregando...</span></div>
          ) : filteredPdfs.length === 0 ? (
            <div className="empty-state animate-fade-in">
              <FileText size={48} color="var(--text-muted)" />
              <h3>Nenhum documento encontrado</h3>
              <p>Faça upload de PDFs na aba "Upload de PDF".</p>
            </div>
          ) : (
            <div className="manage-pdf-list">
              {filteredPdfs.map(pdf => (
                <div key={pdf.id} className="manage-pdf-item">
                  <div className="manage-pdf-icon">
                    <FileText size={20} color="var(--accent)" />
                  </div>

                  {editingPdfId === pdf.id ? (
                    <div className="manage-pdf-rename">
                      <input
                        className="rename-input"
                        value={editPdfName}
                        onChange={e => setEditPdfName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') confirmRenamePdf(pdf.id); if (e.key === 'Escape') setEditingPdfId(null); }}
                        autoFocus
                      />
                      <button className="btn btn-primary btn-icon btn-sm" onClick={() => confirmRenamePdf(pdf.id)}><Check size={14} /></button>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setEditingPdfId(null)}><XCircle size={14} /></button>
                    </div>
                  ) : (
                    <div className="manage-pdf-info">
                      <div className="manage-pdf-name">{pdf.name}</div>
                      <div className="manage-pdf-meta">
                        <span className="manage-pdf-cat">{pdf.category}</span>
                        {pdf.subcategoryName && (
                          <><span className="manage-pdf-sep">›</span><span className="manage-pdf-subcat">{pdf.subcategoryName}</span></>
                        )}
                      </div>
                    </div>
                  )}

                  {editingPdfId !== pdf.id && (
                    <div className="manage-pdf-actions">
                      <button className="btn btn-ghost btn-icon btn-sm" title="Renomear" onClick={() => { setEditingPdfId(pdf.id); setEditPdfName(pdf.name); }}>
                        <Pencil size={15} />
                      </button>
                      <button className="btn btn-ghost btn-icon btn-sm" title="Mover" onClick={() => openMoveModal(pdf)}>
                        <FolderOpen size={15} />
                      </button>
                      <button className="btn btn-ghost btn-icon btn-sm btn-danger" title="Excluir" onClick={() => setConfirmDeletePdfId(pdf.id)}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== MODALS ===== */}

      {/* Delete subcategory */}
      {confirmDeleteSub && createPortal(
        <div className="pdf-modal-overlay animate-fade-in" onClick={() => !deletingSubId && setConfirmDeleteSub(null)}>
          <div className="delete-confirm-modal" onClick={e => e.stopPropagation()}>
            <div className="delete-confirm-icon"><AlertTriangle size={32} color="#ef4444" /></div>
            <h3>Excluir subcategoria</h3>
            <p>
              Tem certeza que deseja excluir <strong>{confirmDeleteSub.name}</strong>?
              {confirmDeleteSub._count.pdfs > 0 && (
                <> Esta subcategoria possui <strong>{confirmDeleteSub._count.pdfs} PDF(s)</strong> vinculados e não pode ser excluída.</>
              )}
            </p>
            <div className="delete-confirm-actions">
              <button className="btn btn-ghost" onClick={() => setConfirmDeleteSub(null)} disabled={!!deletingSubId}>Cancelar</button>
              {confirmDeleteSub._count.pdfs === 0 && (
                <button className="btn btn-danger" onClick={handleDeleteSub} disabled={!!deletingSubId}>
                  {deletingSubId ? <><span className="spinner" /> Excluindo...</> : <><Trash2 size={16} /> Excluir</>}
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete PDF */}
      {confirmDeletePdfId && createPortal(
        <div className="pdf-modal-overlay animate-fade-in" onClick={() => !deletingPdf && setConfirmDeletePdfId(null)}>
          <div className="delete-confirm-modal" onClick={e => e.stopPropagation()}>
            <div className="delete-confirm-icon"><AlertTriangle size={32} color="#ef4444" /></div>
            <h3>Excluir documento</h3>
            <p>Tem certeza que deseja excluir <strong>{pdfs.find(p => p.id === confirmDeletePdfId)?.name}</strong>? Esta ação não pode ser desfeita.</p>
            <div className="delete-confirm-actions">
              <button className="btn btn-ghost" onClick={() => setConfirmDeletePdfId(null)} disabled={deletingPdf}>Cancelar</button>
              <button className="btn btn-danger" onClick={handleDeletePdf} disabled={deletingPdf}>
                {deletingPdf ? <><span className="spinner" /> Excluindo...</> : <><Trash2 size={16} /> Excluir</>}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Move PDF */}
      {movingPdf && createPortal(
        <div className="pdf-modal-overlay animate-fade-in" onClick={() => !moving && setMovingPdf(null)}>
          <div className="move-modal" onClick={e => e.stopPropagation()}>
            <div className="move-modal-header">
              <FolderOpen size={20} color="var(--accent)" />
              <h3>Mover documento</h3>
            </div>
            <p className="move-modal-subtitle">Selecione a nova localização para <strong>{movingPdf.name}</strong>.</p>
            <div className="move-modal-fields">
              <div className="input-group">
                <label>Categoria</label>
                <select value={moveCategory} onChange={e => { setMoveCategory(e.target.value); setMoveSubcategoryId(''); }}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label>Subcategoria</label>
                {subsForMoveCategory.length === 0 ? (
                  <div className="no-subs-hint">Nenhuma subcategoria nesta categoria.</div>
                ) : (
                  <select value={moveSubcategoryId} onChange={e => setMoveSubcategoryId(e.target.value)}>
                    <option value="">Selecione...</option>
                    {subsForMoveCategory.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                )}
              </div>
            </div>
            {movingPdf.subcategoryId && (
              <div className="move-modal-current">
                Localização atual: <strong>{movingPdf.category}</strong> › <strong>{movingPdf.subcategoryName}</strong>
              </div>
            )}
            <div className="move-modal-actions">
              <button className="btn btn-ghost" onClick={() => setMovingPdf(null)} disabled={moving}>Cancelar</button>
              <button
                className="btn btn-primary"
                onClick={handleMove}
                disabled={moving || !moveSubcategoryId || moveSubcategoryId === movingPdf.subcategoryId}
              >
                {moving ? <><span className="spinner" /> Movendo...</> : <><FolderOpen size={16} /> Mover</>}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </Layout>
  );
}
