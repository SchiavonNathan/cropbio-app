import { useState } from 'react';
import Layout from '../components/Layout';
import { UploadCloud, File, X } from 'lucide-react';
import api from '../services/api';
import { toast } from 'sonner';
import './Admin.css';

export default function Admin() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      await api.post('/pdfs', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Upload realizado com sucesso!');
      setSelectedFile(null);
    } catch (error) {
      console.error('Upload error', error);
      toast.error('Falha ao fazer o upload. Você tem permissão de Admin?');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Layout>
      <div className="page-header animate-fade-in">
        <h1>Administração</h1>
        <p>Gerencie o repositório de PDFs do sistema.</p>
      </div>

      <div className="admin-content animate-fade-in">
        <div className="glass-panel upload-card">
          <h2>Novo Documento</h2>
          <p className="upload-subtitle">Faça o upload de novos PDFs para disponibilizar aos usuários.</p>
          
          <form onSubmit={handleUpload}>
            <div className="upload-dropzone">
              <input 
                type="file" 
                accept=".pdf" 
                id="file-upload" 
                className="file-input-hidden"
                onChange={handleFileChange}
              />
              
              {!selectedFile ? (
                <label htmlFor="file-upload" className="dropzone-content">
                  <UploadCloud size={48} color="var(--primary)" />
                  <h3>Clique ou arraste um PDF</h3>
                  <p>Apenas arquivos terminados em .pdf</p>
                </label>
              ) : (
                <div className="selected-file">
                  <div className="file-icon">
                    <File size={32} color="var(--accent)" />
                  </div>
                  <div className="file-details">
                    <span className="file-name">{selectedFile.name}</span>
                    <span className="file-size">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                  <button 
                    type="button" 
                    className="remove-file-btn"
                    onClick={() => setSelectedFile(null)}
                  >
                    <X size={20} />
                  </button>
                </div>
              )}
            </div>

            <div className="form-actions">
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={!selectedFile || uploading}
              >
                {uploading ? 'Enviando...' : 'Fazer Upload'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
