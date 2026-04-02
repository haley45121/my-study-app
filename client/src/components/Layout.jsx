import { NavLink } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, GraduationCap, LineChart, 
  Folder, ArrowRightLeft, FileText, BookOpen,
  Sun, Moon 
} from 'lucide-react';

export default function Layout({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('misba-theme') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('misba-theme', theme);
  }, [theme]);

  function toggleTheme() {
    setTheme(t => t === 'dark' ? 'light' : 'dark');
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h1>MISBA</h1>
            <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
          <div className="brand-sub">Study Application</div>
        </div>
        <nav>
          <ul className="sidebar-nav">
            <li className="sidebar-section">Overview</li>
            <li>
              <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>
                <span className="nav-icon"><LayoutDashboard size={18} /></span> Dashboard
              </NavLink>
            </li>
            <li>
              <NavLink to="/learn" className={({ isActive }) => isActive ? 'active' : ''}>
                <span className="nav-icon"><GraduationCap size={18} /></span> Learn
              </NavLink>
            </li>
            <li>
              <NavLink to="/progress" className={({ isActive }) => isActive ? 'active' : ''}>
                <span className="nav-icon"><LineChart size={18} /></span> Progress
              </NavLink>
            </li>
            <li className="sidebar-section">Library</li>
            <li>
              <NavLink to="/folders" className={({ isActive }) => isActive ? 'active' : ''}>
                <span className="nav-icon"><Folder size={18} /></span> Folders
              </NavLink>
            </li>
            <li>
              <NavLink to="/import-export" className={({ isActive }) => isActive ? 'active' : ''}>
                <span className="nav-icon"><ArrowRightLeft size={18} /></span> Import / Export
              </NavLink>
            </li>
            <li className="sidebar-section">Notes</li>
            <li>
              <NavLink to="/notes" className={({ isActive }) => isActive ? 'active' : ''}>
                <span className="nav-icon"><FileText size={18} /></span> Notes
              </NavLink>
            </li>
            <li>
              <NavLink to="/cornell-notes" className={({ isActive }) => isActive ? 'active' : ''}>
                <span className="nav-icon"><BookOpen size={18} /></span> Cornell Notes
              </NavLink>
            </li>
          </ul>
        </nav>
      </aside>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
