import { useCallback, useEffect, useState } from 'react';
import { listSubjects } from './api.js';
import { applyTheme, getTheme } from './theme.js';
import BrandMark from './BrandMark.jsx';
import OverviewPanel from './panels/OverviewPanel.jsx';
import SubjectsPanel from './panels/SubjectsPanel.jsx';
import SemestersPanel from './panels/SemestersPanel.jsx';
import SettingsPanel from './panels/SettingsPanel.jsx';
import {
  LayoutIcon,
  ListIcon,
  CalendarIcon,
  SettingsIcon,
  MenuIcon,
  CloseIcon,
  LogOutIcon,
  PanelLeftIcon,
  SunIcon,
  MoonIcon,
} from './Icons.jsx';

const SIDEBAR_KEY = 'gt_sidebar_collapsed';

const LEVEL_LABEL = {
  'pho-thong': 'Giáo dục phổ thông',
  'dai-hoc': 'Giáo dục đại học',
};

const NAV = [
  { id: 'overview', label: 'Tổng quan', Icon: LayoutIcon },
  { id: 'subjects', label: 'Môn học', Icon: ListIcon },
  { id: 'semesters', label: 'Học kỳ', Icon: CalendarIcon },
  { id: 'settings', label: 'Cài đặt', Icon: SettingsIcon },
];

const EMPTY_DATA = {
  subjects: [],
  gpa: 0,
  gpaScale: 4,
  classification: 'Chưa có dữ liệu',
  semesters: [],
};

export default function Dashboard({ user, onUserChange, onLogout }) {
  const [view, setView] = useState('overview');
  const [navOpen, setNavOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(SIDEBAR_KEY) === '1');
  const [theme, setTheme] = useState(getTheme);
  const [data, setData] = useState(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_KEY, next ? '1' : '0');
      return next;
    });
  }

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    setTheme(next);
  }

  const level = user.educationLevel;

  const reload = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await listSubjects());
    } catch (err) {
      setError(`Không tải được dữ liệu: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  // Đóng menu khi chuyển trang trên mobile, tránh menu che nội dung vừa mở
  function go(id) {
    setView(id);
    setNavOpen(false);
  }

  const current = NAV.find((n) => n.id === view);

  return (
    <div className={`dash${navOpen ? ' nav-open' : ''}${collapsed ? ' is-collapsed' : ''}`}>
      <aside className="sidebar" aria-label="Điều hướng chính">
        <div className="sidebar-header">
          <span className="sidebar-brand">
            <span className="sidebar-brand-mark">
              <BrandMark size={15} />
            </span>
            <span className="sidebar-brand-text">
              <strong>Grade Tracker</strong>
              <small>{LEVEL_LABEL[level]}</small>
            </span>
          </span>
          <button type="button" className="icon-btn nav-close" onClick={() => setNavOpen(false)} aria-label="Đóng menu">
            <CloseIcon />
          </button>
        </div>

        <nav className="sidebar-nav">
          <p className="sidebar-group-label">Quản lý</p>
          {NAV.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              className={`sidebar-item${view === id ? ' is-active' : ''}`}
              aria-current={view === id ? 'page' : undefined}
              onClick={() => go(id)}
              title={collapsed ? label : undefined}
            >
              <Icon />
              <span className="label">{label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <span className="sidebar-user">
            <span className="avatar" aria-hidden="true">
              {user.email.slice(0, 1).toUpperCase()}
            </span>
            <span className="sidebar-user-mail">{user.email}</span>
          </span>
          <button type="button" className="icon-btn" onClick={onLogout} aria-label="Đăng xuất" title="Đăng xuất">
            <LogOutIcon />
          </button>
        </div>
      </aside>

      <button
        type="button"
        className="sidebar-scrim"
        onClick={() => setNavOpen(false)}
        tabIndex={-1}
        aria-hidden="true"
      />

      <div className="dash-main">
        <header className="dash-header">
          <button
            type="button"
            className="icon-btn nav-trigger"
            onClick={() => setNavOpen(true)}
            aria-label="Mở menu"
          >
            <MenuIcon />
          </button>
          <button
            type="button"
            className="icon-btn collapse-trigger"
            onClick={toggleCollapsed}
            aria-label={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
            title={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
          >
            <PanelLeftIcon />
          </button>
          <nav className="crumbs" aria-label="Breadcrumb">
            <span>Grade Tracker</span>
            <span className="crumb-sep" aria-hidden="true">
              /
            </span>
            <span className="crumb-current">{current.label}</span>
          </nav>
          <button
            type="button"
            className="icon-btn theme-trigger"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
            title={theme === 'dark' ? 'Chế độ sáng' : 'Chế độ tối'}
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
        </header>

        <main className="dash-content">
          {error && (
            <div className="alert" role="alert">
              <span>{error}</span>
              <button type="button" className="secondary" onClick={reload}>
                Thử lại
              </button>
            </div>
          )}

          {view === 'overview' && (
            <OverviewPanel data={data} level={level} loading={loading} onGoSubjects={() => go('subjects')} />
          )}
          {view === 'subjects' && (
            <SubjectsPanel data={data} level={level} loading={loading} reload={reload} />
          )}
          {view === 'semesters' && <SemestersPanel data={data} level={level} loading={loading} />}
          {view === 'settings' && (
            <SettingsPanel user={user} onUserChange={onUserChange} onLogout={onLogout} reload={reload} />
          )}
        </main>
      </div>
    </div>
  );
}
