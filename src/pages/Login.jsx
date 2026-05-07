import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center animate-fade-in">
        <div className="col-md-6 col-lg-5">
          <div className="card border-0 shadow-lg p-4 p-md-5">
            <div className="text-center mb-5">
              <h2 className="fw-bold mb-2">Welcome Back</h2>
              <p className="text-muted">Enter your credentials to access your account.</p>
            </div>

            {error && <div className="alert alert-danger shadow-sm rounded-3">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="form-label fw-medium small">Email Address</label>
                <div className="input-group">
                  <span className="input-group-text bg-transparent border-end-0 text-muted">
                    <Mail size={18} />
                  </span>
                  <input 
                    type="email" 
                    className="form-control border-start-0 ps-0" 
                    placeholder="Enter your email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <label className="form-label fw-medium small m-0">Password</label>
                  <Link to="/forgot-password" className="small text-decoration-none text-primary">Forgot Password?</Link>
                </div>
                <div className="input-group">
                  <span className="input-group-text bg-transparent border-end-0 text-muted">
                    <Lock size={18} />
                  </span>
                  <input 
                    type="password" 
                    className="form-control border-start-0 ps-0" 
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary w-100 py-3 mb-4 rounded-3 fw-bold" 
                disabled={loading}
              >
                {loading ? <span className="spinner-border spinner-border-sm me-2" /> : null}
                Sign In
              </button>
            </form>

            <div className="text-center text-muted small">
              Don't have an account? <Link to="/register" className="text-primary fw-semibold text-decoration-none ms-1">Create Account</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
