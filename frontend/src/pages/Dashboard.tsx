import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import {
  FileText, Download, Eye, X, ExternalLink, Pencil,
  Check, XCircle, ChevronRight, FileSpreadsheet,
  BookOpen, Award, ArrowLeft
} from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { toast } from 'sonner';
import './Dashboard.css';

interface PdfMetadata {
  id: string;
  name: string;
  hash: string;
  url_download: string;
  category?: string;
}

const CATEGORIES = [
  { key: 'Produtos e tabelas', label: 'Produtos e Tabelas', icon: FileSpreadsheet },
  { key: 'Culturas',           label: 'Culturas',           icon: BookOpen },
  { key: 'Resultados',         label: 'Resultados',         icon: Award },
  { key: 'Palestras',          label: 'Palestras',          icon: FileText },
];

export default function Dashboard() {
  const [pdfs, setPdfs] = useState<PdfMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPdf, setSelectedPdf] = useState<PdfMetadata | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const [searchParams] = useSearchParams();
  const categoryParam = searchParams.get('category');
  const navigate = useNavigate();
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin');

  useEffect(() => {
    const fetchPdfs = async () => {
      try {
        const response = await api.get('/pdfs');
        setPdfs(response.data);
      } catch {
        toast.error('Erro ao carregar documentos.');
      } finally {
        setLoading(false);
      }
    };
    fetchPdfs();
  }, []);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  const startEditing = (pdf: PdfMetadata, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(pdf.id);
    setEditName(pdf.name);
  };

  const cancelEditing = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingId(null);
  };

  const confirmRename = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const trimmed = editName.trim();
    if (!trimmed) { cancelEditing(); return; }
    try {
      const response = await api.patch(`/pdfs/${id}`, { name: trimmed });
      setPdfs((prev) => prev.map((p) => p.id === id ? { ...p, name: response.data.name } : p));
      if (selectedPdf?.id === id) setSelectedPdf((prev) => prev ? { ...prev, name: response.data.name } : prev);
      toast.success('PDF renomeado com sucesso!');
    } catch {
      toast.error('Erro ao renomear o PDF.');
    } finally {
      setEditingId(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter') confirmRename(id);
    if (e.key === 'Escape') cancelEditing();
  };

  const openViewer = (pdf: PdfMetadata) => {
    if (editingId) return;
    setSelectedPdf(pdf);
  };

  const filteredPdfs = categoryParam
    ? pdfs.filter((p) => (p.category || 'Produtos e tabelas') === categoryParam)
    : [];

  const currentCategory = CATEGORIES.find((c) => c.key === categoryParam);

  // ---- HOME VIEW (no category) ----
  if (!categoryParam) {
    return (
      <Layout>
        <div className="page-header animate-fade-in">
          <h1>Início</h1>
          <p>Selecione uma categoria para visualizar os documentos.</p>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner spinner-lg" />
            <span>Carregando documentos...</span>
          </div>
        ) : (
          <div className="category-grid animate-fade-in">
            {CATEGORIES.map(({ key, label, icon: Icon }) => {
              const count = pdfs.filter((p) => (p.category || 'Produtos e tabelas') === key).length;
              return (
                <div
                  key={key}
                  className="category-card"
                  onClick={() => navigate(`/dashboard?category=${key}`)}
                >
                  <div className="category-card-icon">
                    <Icon size={24} color="var(--accent)" />
                  </div>
                  <div className="category-card-info">
                    <h3>{label}</h3>
                    <span>{count} {count === 1 ? 'documento' : 'documentos'}</span>
                  </div>
                  <ChevronRight size={18} className="category-card-arrow" />
                </div>
              );
            })}
          </div>
        )}
      </Layout>
    );
  }

  // ---- CATEGORY VIEW ----
  return (
    <Layout>
      <div className="category-view-header animate-fade-in">
        <button className="btn btn-ghost btn-icon" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={18} />
        </button>
        <div className="breadcrumb">
          <span>Início</span>
          <ChevronRight size={14} />
          <span className="breadcrumb-current">{currentCategory?.label || categoryParam}</span>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner spinner-lg" />
          <span>Carregando documentos...</span>
        </div>
      ) : filteredPdfs.length === 0 ? (
        <div className="empty-state animate-fade-in">
          <FileText size={48} color="var(--text-muted)" />
          <h3>Nenhum documento encontrado</h3>
          <p>Nenhum PDF cadastrado nesta categoria.</p>
        </div>
      ) : (
        <div className="pdf-list animate-fade-in">
          {filteredPdfs.map((pdf) => (
            <div
              key={pdf.id}
              className="pdf-item"
              onClick={() => openViewer(pdf)}
            >
              <div className="pdf-item-icon">
                <FileText size={22} color="var(--accent)" />
              </div>

              {editingId === pdf.id ? (
                <div className="rename-form" onClick={(e) => e.stopPropagation()}>
                  <input
                    ref={inputRef}
                    className="rename-input"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, pdf.id)}
                  />
                  <button className="btn btn-primary btn-icon btn-sm" onClick={(e) => confirmRename(pdf.id, e)}>
                    <Check size={14} />
                  </button>
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={cancelEditing}>
                    <XCircle size={14} />
                  </button>
                </div>
              ) : (
                <div className="pdf-item-info">
                  <div className="pdf-item-name">{pdf.name}</div>
                  <div className="pdf-item-meta">{pdf.category || 'Produtos e tabelas'}</div>
                </div>
              )}

              {editingId !== pdf.id && (
                <div className="pdf-item-actions" onClick={(e) => e.stopPropagation()}>
                  <button className="btn btn-ghost btn-icon btn-sm" title="Visualizar" onClick={() => openViewer(pdf)}>
                    <Eye size={16} />
                  </button>
                  {isAdmin && (
                    <button className="btn btn-ghost btn-icon btn-sm" title="Renomear" onClick={(e) => startEditing(pdf, e)}>
                      <Pencil size={16} />
                    </button>
                  )}
                  <a
                    href={pdf.url_download}
                    download
                    className="btn btn-outline btn-icon btn-sm"
                    title="Baixar"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Download size={16} />
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedPdf && createPortal(
        <div className="pdf-modal-overlay animate-fade-in" onClick={() => setSelectedPdf(null)}>
          <div className="pdf-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pdf-modal-header">
              <div className="pdf-modal-title">
                <FileText size={18} color="var(--primary)" />
                <span>{selectedPdf.name}</span>
              </div>
              <div className="pdf-modal-actions">
                <a href={selectedPdf.url_download} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-icon btn-sm">
                  <ExternalLink size={16} />
                </a>
                <a href={selectedPdf.url_download} download className="btn btn-primary btn-icon btn-sm">
                  <Download size={16} />
                </a>
                <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setSelectedPdf(null)}>
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className="pdf-modal-body">
              <iframe src={selectedPdf.url_download} title={selectedPdf.name} className="pdf-iframe" />
            </div>
          </div>
        </div>,
        document.body
      )}
    </Layout>
  );
}
