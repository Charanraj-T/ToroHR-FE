import { useState } from 'react';
import { Building2, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.ts';
import api from '../lib/api.ts';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // If already logged in, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await api.post('/api/auth/login', { email, password });
      
      if (response.data.success) {
        const { token, user } = response.data.data;
        setAuth(user, token);
        navigate('/');
      }
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('An error occurred during login. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Left Panel */}
      <div className="login-left">
        <div className="login-brand">
          <div className="brand-logo-container">
            <Building2 size={32} color="#fff" strokeWidth={1.5} />
          </div>
          <h1>ToroHR</h1>
          <p>Empowering your enterprise workforce with intelligent<br/>HR solutions.</p>
        </div>
        <div className="dotted-bg"></div>
      </div>

      {/* Right Panel */}
      <div className="login-right">
        <div className="login-form-container">
          <div className="login-header">
            <h2>Welcome back</h2>
            <p>Please enter your details to access your account.</p>
          </div>

          <form onSubmit={handleLogin} className="login-form">
            {error && <div className="error-message">{error}</div>}
            
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input 
                type="email" 
                id="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com" 
                required 
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input 
                type="password" 
                id="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                required 
                disabled={loading}
              />
            </div>

            <button type="submit" className="btn-login" style={{ marginTop: '32px' }} disabled={loading}>
              {loading ? (
                <>Logging in <Loader2 size={18} className="spin" /></>
              ) : (
                <>Login <ArrowRight size={18} /></>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
