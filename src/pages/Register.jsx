import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Lock, Mail } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('All fields are required');
      return;
    }
    
    setError('');
    setLoading(true);
    
    try {
      await register(name, email, password);
      // Wait for registration simulation, then redirect to login
      navigate('/login?registered=true');
    } catch (err) {
      setError(err.message || 'Failed to register');
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
              <h2 className="fw-bold mb-2">Create Account</h2>
              <p className="text-muted">Join smartBazaar to start shopping</p>
            </div>

            {error && <div className="alert alert-danger shadow-sm rounded-3">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="form-label fw-medium small">Full Name</label>
                <div className="input-group">
                  <span className="input-group-text bg-transparent border-end-0 text-muted">
                    <User size={18} />
                  </span>
                  <input 
                    type="text" 
                    className="form-control border-start-0 ps-0" 
                    placeholder="John Doe" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label fw-medium small">Email Address</label>
                <div className="input-group">
                  <span className="input-group-text bg-transparent border-end-0 text-muted">
                    <Mail size={18} />
                  </span>
                  <input 
                    type="email" 
                    className="form-control border-start-0 ps-0" 
                    placeholder="you@example.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label fw-medium small m-0">Password</label>
                <div className="input-group mt-1">
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
                <div className="form-text mt-2 small">Password will be encrypted using bcrypt on backend.</div>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary w-100 py-3 mb-4 rounded-3 fw-bold" 
                disabled={loading}
              >
                {loading ? <span className="spinner-border spinner-border-sm me-2" /> : null}
                Register
              </button>
            </form>

            <div className="text-center text-muted small">
              Already have an account? <Link to="/login" className="text-primary fw-semibold text-decoration-none ms-1">Sign In</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
