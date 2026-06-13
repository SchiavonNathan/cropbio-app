import { ReactNode, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { LogOut, LayoutDashboard, Settings, Users, Menu, X } from 'lucide-react';
import './Layout.css';

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [mobileMenuOpen]);

  return (
    <div className="layout-container">
      {/* Mobile Top Bar */}
      <div className="mobile-topbar glass-panel">
        <div className="sidebar-brand">
          <h2>PDF Hub</h2>
        </div>
        <button 
          className="btn btn-ghost icon-btn mobile-menu-btn" 
          onClick={() => setMobileMenuOpen(true)}
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div className="mobile-overlay animate-fade-in" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`glass-panel sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <h2>PDF Hub</h2>
          </div>
          <button 
            className="btn btn-ghost icon-btn mobile-close-btn" 
            onClick={() => setMobileMenuOpen(false)}
          >
            <X size={24} />
          </button>
        </div>
        
        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${location.pathname === '/dashboard' ? 'active' : ''}`}
            onClick={() => navigate('/dashboard')}
          >
            <LayoutDashboard size={20} />
            Dashboard
          </button>
          
          {user?.role === 'admin' && (
            <>
              <button 
                className={`nav-item ${location.pathname === '/admin' ? 'active' : ''}`}
                onClick={() => navigate('/admin')}
              >
                <Settings size={20} />
                Administração
              </button>
              <button 
                className={`nav-item ${location.pathname === '/users' ? 'active' : ''}`}
                onClick={() => navigate('/users')}
              >
                <Users size={20} />
                Usuários
              </button>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{(user?.fullName || user?.username || '?').charAt(0).toUpperCase()}</div>
            <div className="user-details">
              <span className="user-name">{user?.fullName || user?.username}</span>
              <span className="user-role">{user?.role === 'admin' ? 'Administrador' : 'Usuário'}</span>
            </div>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </aside>

      <main className="main-content animate-fade-in">
        {children}
      </main>
    </div>
  );
}
