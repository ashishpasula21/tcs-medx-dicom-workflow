import React, { useState } from 'react';
import { useWorkflow } from '../context/WorkflowContext';

export default function LoginScreen() {
  const { loginUser } = useWorkflow();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Username and password are required.');
      return;
    }
    setError('');
    setLoading(true);
    // Simulate brief auth delay for realism
    setTimeout(() => {
      loginUser(username.trim());
      setLoading(false);
    }, 600);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-brand-name">TCS – IAE CareSphere Dx</div>
          <div className="login-brand-sub">Clinical Imaging Platform</div>
        </div>

        <div className="login-divider" />

        <div className="login-title">Sign In</div>
        <div className="login-subtitle">Enter your credentials to access the imaging workflow.</div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              className="form-input"
              type="text"
              placeholder="e.g. dr.smith, qa.lead, researcher01"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoComplete="username"
              autoFocus
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="alert alert-err" style={{ marginTop: 4 }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: 8, padding: '11px 0', fontSize: 14 }}
            disabled={loading}
          >
            {loading ? 'Signing in…' : 'Sign In →'}
          </button>
        </form>

        <div className="login-hint">
          <div className="login-hint-title">Demo Credentials</div>
          <div className="login-hint-row"><span>Any username / any password</span></div>
          <div className="login-hint-row"><span className="login-hint-key">Tip:</span> username containing "rad" → Radiologist role, "qa" → QA Reviewer, "sci" → Imaging Scientist</div>
        </div>
      </div>

      <div className="login-footer">
        TCS Confidential &nbsp;·&nbsp; GxP-Compliant Platform &nbsp;·&nbsp; v1.0.0
      </div>
    </div>
  );
}
