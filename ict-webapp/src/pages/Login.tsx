import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks';
import { login, clearError } from '../store/slices/authSlice';
import { Zap, Mail, Lock, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearError());

    try {
      await dispatch(login({ email, password })).unwrap();
      navigate('/');
    } catch {
      // Error handled by reducer
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="logo">
            <Zap size={32} />
          </div>
          <h1>ICT Platform</h1>
          <p>Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <div className="input-wrapper">
              <Mail size={20} />
              <input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <Lock size={20} />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="form-options">
            <label className="remember-me">
              <input type="checkbox" />
              Remember me
            </label>
            <a href="/forgot-password" className="forgot-link">
              Forgot password?
            </a>
          </div>

          <button type="submit" className="btn-submit" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="login-footer">
          <p>Support: 630-709-8200</p>
        </div>
      </div>

      <style>{`
        .login-page {
          min-height: 100vh;
          display: flex; align-items: center; justify-content: center;
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          padding: 24px;
        }
        .login-card {
          background: white; border-radius: 16px;
          padding: 48px; width: 100%; max-width: 420px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.2);
        }
        .login-header { text-align: center; margin-bottom: 32px; }
        .logo {
          width: 64px; height: 64px; border-radius: 16px;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: white; display: flex; align-items: center; justify-content: center;
          margin: 0 auto 16px;
        }
        .login-header h1 { font-size: 24px; margin: 0 0 8px; }
        .login-header p { color: #64748b; margin: 0; }
        .error-message {
          background: #fee2e2; color: #dc2626;
          padding: 12px 16px; border-radius: 8px;
          margin-bottom: 24px; font-size: 14px;
        }
        .form-group { margin-bottom: 20px; }
        .form-group label { display: block; margin-bottom: 8px; font-weight: 500; font-size: 14px; }
        .input-wrapper {
          display: flex; align-items: center; gap: 12px;
          border: 1px solid #e2e8f0; border-radius: 10px;
          padding: 0 16px; transition: border-color 0.2s;
        }
        .input-wrapper:focus-within { border-color: #3b82f6; }
        .input-wrapper svg { color: #94a3b8; flex-shrink: 0; }
        .input-wrapper input {
          flex: 1; border: none; padding: 14px 0;
          font-size: 16px; outline: none;
        }
        .toggle-password {
          background: none; border: none; cursor: pointer; color: #94a3b8;
          padding: 4px; display: flex;
        }
        .form-options {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 24px; font-size: 14px;
        }
        .remember-me { display: flex; align-items: center; gap: 8px; cursor: pointer; }
        .remember-me input { width: 16px; height: 16px; }
        .forgot-link { color: #3b82f6; text-decoration: none; }
        .forgot-link:hover { text-decoration: underline; }
        .btn-submit {
          width: 100%; padding: 14px;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: white; border: none; border-radius: 10px;
          font-size: 16px; font-weight: 600; cursor: pointer;
          transition: opacity 0.2s;
        }
        .btn-submit:hover { opacity: 0.9; }
        .btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }
        .login-footer { text-align: center; margin-top: 24px; padding-top: 24px; border-top: 1px solid #e2e8f0; }
        .login-footer p { color: #64748b; margin: 0; font-size: 14px; }
      `}</style>
    </div>
  );
}
