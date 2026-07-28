import { useEffect, useState } from 'react';
import { fetchMe, getToken, clearToken, ApiError } from './api.js';
import AuthScreen from './AuthScreen.jsx';
import LevelPicker from './LevelPicker.jsx';
import SubjectsView from './SubjectsView.jsx';
import BrandMark from './BrandMark.jsx';

export default function App() {
  const [user, setUser] = useState(null);
  // 'checking' cho tới khi biết token còn hạn hay không, tránh nháy màn đăng nhập khi F5
  const [status, setStatus] = useState(getToken() ? 'checking' : 'anonymous');

  useEffect(() => {
    if (status !== 'checking') return;
    fetchMe()
      .then((data) => {
        setUser(data.user);
        setStatus('ready');
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) clearToken();
        setStatus('anonymous');
      });
  }, [status]);

  function handleLogout() {
    clearToken();
    setUser(null);
    setStatus('anonymous');
  }

  function handleAuthenticated(nextUser) {
    setUser(nextUser);
    setStatus('ready');
  }

  if (status === 'checking') {
    return (
      <div className="auth-shell">
        <p className="subtitle">Đang kiểm tra phiên đăng nhập…</p>
      </div>
    );
  }

  if (status === 'anonymous') {
    return <AuthScreen onAuthenticated={handleAuthenticated} />;
  }

  if (!user.educationLevel) {
    return <LevelPicker email={user.email} onPicked={setUser} onLogout={handleLogout} />;
  }

  return (
    <>
      <nav className="top-nav">
        <span className="wordmark">
          <BrandMark />
          Grade Tracker
        </span>
        <span className="nav-user">{user.email}</span>
        <button type="button" className="ghost" onClick={handleLogout}>
          Đăng xuất
        </button>
      </nav>
      <SubjectsView level={user.educationLevel} />
    </>
  );
}
