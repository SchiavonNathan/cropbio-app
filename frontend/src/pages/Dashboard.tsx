import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Layout from '../components/Layout';
import { FileText, Download, Eye, X, ExternalLink, Pencil, Check, XCircle } from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import './Dashboard.css';

interface PdfMetadata {
  id: string;
  name: string;
  hash: string;
  url_download: string;
}

export default function Dashboard() {
  const [pdfs, setPdfs] = useState<PdfMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPdf, setSelectedPdf] = useState<PdfMetadata | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    const fetchPdfs = async () => {
      try {
        const response = await api.get('/pdfs');
        setPdfs(response.data);
      } catch (error) {
        console.error('Error fetching PDFs', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPdfs();
  }, []);

  // Foca o input ao entrar em modo de edição
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
    setEditName('');
  };

  const confirmRename = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const trimmed = editName.trim();
    if (!trimmed) return cancelEditing();

    try {
      const response = await api.patch(`/pdfs/${id}`, { name: trimmed });
      setPdfs((prev) =>
        prev.map((p) => (p.id === id ? { ...p, name: response.data.name } : p))
      );
      // Atualiza o PDF no modal se estiver aberto
      if (selectedPdf?.id === id) {
        setSelectedPdf((prev) => prev ? { ...prev, name: response.data.name } : prev);
      }
    } catch (error) {
      console.error('Rename error', error);
      alert('Falha ao renomear. Verifique se você tem permissão de admin.');
    } finally {
      setEditingId(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter') confirmRename(id);
    if (e.key === 'Escape') cancelEditing();
  };

  const openViewer = (pdf: PdfMetadata) => {
    if (editingId) return; // Não abre o modal enquanto edita
    setSelectedPdf(pdf);
  };

  const closeViewer = () => setSelectedPdf(null);

  return (
    <Layout>
      <div className="page-header animate-fade-in">
        <h1>Dashboard</h1>
        <p>Visualize e gerencie os documentos disponíveis.</p>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner" />
          Carregando documentos...
        </div>
      ) : pdfs.length === 0 ? (
        <div className="empty-state animate-fade-in">
          <FileText size={64} color="var(--text-muted)" />
          <h3>Nenhum documento encontrado</h3>
          <p>Peça ao administrador para fazer o upload de novos PDFs.</p>
        </div>
      ) : (
        <div className="pdf-grid animate-fade-in">
          {pdfs.map((pdf) => (
            <div
              key={pdf.id}
              className="glass-panel pdf-card"
              onClick={() => openViewer(pdf)}
            >
              <div className="pdf-icon-wrapper">
                <FileText size={40} color="var(--primary)" />
              </div>

              <div className="pdf-info">
                {editingId === pdf.id ? (
                  <div className="rename-form" onClick={(e) => e.stopPropagation()}>
                    <input
                      ref={inputRef}
                      type="text"
                      className="rename-input"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, pdf.id)}
                    />
                    <div className="rename-actions">
                      <button
                        className="btn btn-primary icon-btn rename-btn"
                        onClick={(e) => confirmRename(pdf.id, e)}
                        title="Confirmar"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        className="btn btn-ghost icon-btn rename-btn"
                        onClick={cancelEditing}
                        title="Cancelar"
                      >
                        <XCircle size={16} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <h3 className="pdf-title" title={pdf.name}>
                    {pdf.name}
                  </h3>
                )}
                <span className="pdf-meta">MD5: {pdf.hash.slice(0, 12)}...</span>
              </div>

              <div className="pdf-actions" onClick={(e) => e.stopPropagation()}>
                <button
                  className="btn btn-ghost icon-btn"
                  title="Visualizar"
                  onClick={() => openViewer(pdf)}
                >
                  <Eye size={18} />
                </button>
                {isAdmin && (
                  <button
                    className="btn btn-ghost icon-btn"
                    title="Renomear"
                    onClick={(e) => startEditing(pdf, e)}
                  >
                    <Pencil size={18} />
                  </button>
                )}
                <a
                  href={pdf.url_download}
                  download
                  className="btn btn-primary icon-btn"
                  title="Baixar"
                >
                  <Download size={18} />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PDF Viewer Modal */}
      {selectedPdf && createPortal(
        <div className="pdf-modal-overlay animate-fade-in" onClick={closeViewer}>
          <div className="pdf-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pdf-modal-header">
              <div className="pdf-modal-title">
                <FileText size={20} color="var(--primary)" />
                <span>{selectedPdf.name}</span>
              </div>
              <div className="pdf-modal-actions">
                <a
                  href={selectedPdf.url_download}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-ghost icon-btn"
                  title="Abrir em nova aba"
                >
                  <ExternalLink size={18} />
                </a>
                <a
                  href={selectedPdf.url_download}
                  download
                  className="btn btn-primary icon-btn"
                  title="Baixar"
                >
                  <Download size={18} />
                </a>
                <button className="btn btn-ghost icon-btn" onClick={closeViewer} title="Fechar">
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="pdf-modal-body">
              <iframe
                src={selectedPdf.url_download}
                title={selectedPdf.name}
                className="pdf-iframe"
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </Layout>
  );
}
