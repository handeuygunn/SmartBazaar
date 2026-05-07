import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const { resetPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await resetPassword(email);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Bir hata oluştu. Lütfen tekrar deneyin.');
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
              <h2 className="fw-bold mb-2">Şifremi Unuttum</h2>
              <p className="text-muted">
                E-posta adresinizi girin, şifre sıfırlama bağlantısı gönderelim.
              </p>
            </div>

            {error && <div className="alert alert-danger shadow-sm rounded-3">{error}</div>}

            {success ? (
              <div className="text-center">
                <div className="alert alert-success shadow-sm rounded-3 mb-4">
                  Şifre sıfırlama bağlantısı <strong>{email}</strong> adresine gönderildi.
                  Gelen kutunuzu kontrol edin.
                </div>
                <Link to="/login" className="btn btn-outline-primary rounded-3 fw-bold px-4">
                  Giriş Sayfasına Dön
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="form-label fw-medium small">E-posta Adresi</label>
                  <div className="input-group">
                    <span className="input-group-text bg-transparent border-end-0 text-muted">
                      <Mail size={18} />
                    </span>
                    <input
                      type="email"
                      className="form-control border-start-0 ps-0"
                      placeholder="E-posta adresinizi girin"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
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
                  Sıfırlama Bağlantısı Gönder
                </button>
              </form>
            )}

            {!success && (
              <div className="text-center text-muted small">
                Şifrenizi hatırladınız mı?{' '}
                <Link to="/login" className="text-primary fw-semibold text-decoration-none ms-1">
                  Giriş Yap
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
