import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const { updatePassword } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Şifreler eşleşmiyor.');
      return;
    }

    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır.');
      return;
    }

    setLoading(true);

    try {
      await updatePassword(password);
      navigate('/login');
    } catch (err) {
      setError(err.message || 'Şifre güncellenemedi. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  if (!ready) {
    return (
      <div className="container mt-5">
        <div className="row justify-content-center animate-fade-in">
          <div className="col-md-6 col-lg-5">
            <div className="card border-0 shadow-lg p-4 p-md-5 text-center">
              <div className="spinner-border text-primary mx-auto mb-3" />
              <p className="text-muted">Oturum doğrulanıyor...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <div className="row justify-content-center animate-fade-in">
        <div className="col-md-6 col-lg-5">
          <div className="card border-0 shadow-lg p-4 p-md-5">
            <div className="text-center mb-5">
              <h2 className="fw-bold mb-2">Yeni Şifre Belirle</h2>
              <p className="text-muted">Hesabınız için yeni bir şifre girin.</p>
            </div>

            {error && <div className="alert alert-danger shadow-sm rounded-3">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="form-label fw-medium small">Yeni Şifre</label>
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

              <div className="mb-4">
                <label className="form-label fw-medium small">Şifre Tekrar</label>
                <div className="input-group">
                  <span className="input-group-text bg-transparent border-end-0 text-muted">
                    <Lock size={18} />
                  </span>
                  <input
                    type="password"
                    className="form-control border-start-0 ps-0"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary w-100 py-3 rounded-3 fw-bold"
                disabled={loading}
              >
                {loading ? <span className="spinner-border spinner-border-sm me-2" /> : null}
                Şifremi Güncelle
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
