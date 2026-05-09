import { Building2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, perform auth here. For now, navigate to dashboard
    navigate('/');
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
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input 
                type="email" 
                id="email" 
                placeholder="name@company.com" 
                required 
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input 
                type="password" 
                id="password" 
                placeholder="••••••••" 
                required 
              />
            </div>

            <button type="submit" className="btn-login" style={{ marginTop: '32px' }}>
              Login <ArrowRight size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
