import React, { useState, useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import {
  User as UserIcon, Package, Settings, LogOut, Trash2,
  ShoppingBag, Truck, CheckCircle, XCircle, Clock, Wifi, WifiOff,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { fetchUserOrders, subscribeToOrderUpdates, getStatusMeta } from '../services/orderService';

// ─── Timeline Component ───────────────────────────────────────────────────────

const TIMELINE_STEPS = [
  { key: 'processing', label: 'Sipariş Alındı',  Icon: ShoppingBag },
  { key: 'shipped',    label: 'Kargoya Verildi', Icon: Truck        },
  { key: 'delivered',  label: 'Teslim Edildi',   Icon: CheckCircle  },
];

const StatusTimeline = ({ status }) => {
  if (status === 'cancelled') {
    return (
      <div className="d-flex align-items-center gap-2 py-2">
        <XCircle size={20} style={{ color: '#ef4444' }} />
        <span className="fw-medium" style={{ color: '#ef4444' }}>Sipariş İptal Edildi</span>
      </div>
    );
  }

  const activeIdx = Math.max(0, TIMELINE_STEPS.findIndex(s => s.key === status));

  return (
    <div className="d-flex align-items-center w-100 py-2">
      {TIMELINE_STEPS.map(({ key, label, Icon }, i) => {
        const done    = i < activeIdx;
        const current = i === activeIdx;
        const color   = done || current ? '#0d6efd' : '#cbd5e1';
        const bgColor = done || current ? '#dbeafe' : '#f1f5f9';
        const textColor = done || current ? '#1d4ed8' : '#94a3b8';

        return (
          <React.Fragment key={key}>
            <div className="d-flex flex-column align-items-center" style={{ minWidth: '80px' }}>
              <div
                className="rounded-circle d-flex align-items-center justify-content-center mb-1"
                style={{
                  width: 38, height: 38,
                  backgroundColor: bgColor,
                  border: `2px solid ${color}`,
                  transition: 'all 0.4s ease',
                  position: 'relative',
                }}
              >
                {current && (
                  <span
                    className="position-absolute rounded-circle"
                    style={{
                      width: 46, height: 46, top: -6, left: -6,
                      border: '2px solid #93c5fd',
                      animation: 'pulse-ring 1.5s infinite',
                    }}
                  />
                )}
                <Icon size={16} style={{ color }} />
              </div>
              <span
                className="text-center"
                style={{ fontSize: '10px', fontWeight: current ? 700 : 500, color: textColor, lineHeight: 1.3 }}
              >
                {label}
              </span>
            </div>
            {i < TIMELINE_STEPS.length - 1 && (
              <div
                className="flex-grow-1 mx-1"
                style={{
                  height: 3,
                  borderRadius: 2,
                  marginBottom: 18,
                  background: done ? 'linear-gradient(90deg, #3b82f6, #60a5fa)' : '#e2e8f0',
                  transition: 'background 0.4s ease',
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ─── Estimated Delivery Badge ─────────────────────────────────────────────────

const DeliveryInfo = ({ order }) => {
  const rawDate = order.order_estimated_delivery_date || order.order_delivered_customer_date;
  if (!rawDate) return null;

  const isDelivered = order.order_status === 'delivered';
  const date = new Date(rawDate);
  const today = new Date();
  const daysLeft = Math.ceil((date - today) / (1000 * 60 * 60 * 24));

  const label = isDelivered
    ? `Teslim tarihi: ${date.toLocaleDateString('tr-TR')}`
    : daysLeft < 0
    ? `Tahmini teslim: ${date.toLocaleDateString('tr-TR')} (gecikmiş olabilir)`
    : daysLeft === 0
    ? 'Bugün teslim edilmesi bekleniyor! 🎉'
    : `Tahmini teslim: ${date.toLocaleDateString('tr-TR')} (~${daysLeft} gün)`;

  const color = isDelivered ? '#10b981' : daysLeft <= 1 ? '#f59e0b' : '#6366f1';

  return (
    <div className="d-flex align-items-center gap-2 mt-2" style={{ fontSize: 13 }}>
      <Clock size={13} style={{ color }} />
      <span style={{ color }}>{label}</span>
    </div>
  );
};

// ─── Order Card ───────────────────────────────────────────────────────────────

const OrderCard = ({ order, isNew }) => {
  const [expanded, setExpanded] = useState(false);
  const meta    = getStatusMeta(order.order_status);
  const items   = order.order_items || [];
  const total   = items.reduce((s, i) => s + (i.price ?? 0) * (i.quantity ?? 1), 0);
  const date    = order.order_purchase_timestamp
    ? new Date(order.order_purchase_timestamp).toLocaleDateString('tr-TR')
    : '—';

  return (
    <div
      className="card border-0 mb-3"
      style={{
        borderRadius: 16,
        boxShadow: isNew
          ? '0 0 0 2px #3b82f6, 0 4px 20px rgba(59,130,246,0.25)'
          : '0 2px 12px rgba(0,0,0,0.08)',
        transition: 'box-shadow 0.5s ease',
        overflow: 'hidden',
      }}
    >
      {/* Card Header */}
      <div
        className="card-header border-0 d-flex align-items-center justify-content-between flex-wrap gap-2"
        style={{ background: '#f8fafc', padding: '14px 20px', cursor: 'pointer' }}
        onClick={() => setExpanded(v => !v)}
      >
        <div>
          <span className="text-muted me-2" style={{ fontSize: 12 }}>Sipariş #{order.order_id.slice(0, 8).toUpperCase()}</span>
          <span className="text-muted" style={{ fontSize: 12 }}> · {date}</span>
        </div>
        <div className="d-flex align-items-center gap-2">
          {items.length > 0 && (
            <span className="text-muted" style={{ fontSize: 13 }}>
              {items.length} ürün · <strong>${(total * 1.08).toFixed(2)}</strong>
            </span>
          )}
          <span
            className="badge"
            style={{
              backgroundColor: meta.bg,
              color: meta.color,
              border: `1px solid ${meta.color}40`,
              fontWeight: 600,
              fontSize: 11,
              padding: '5px 10px',
            }}
          >
            {meta.label}
          </span>
          <span className="text-muted" style={{ fontSize: 12 }}>{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* Timeline Section */}
      <div className="px-4 pt-3 pb-1">
        <StatusTimeline status={order.order_status} />
        <DeliveryInfo order={order} />
      </div>

      {/* Expanded Details */}
      {expanded && items.length > 0 && (
        <div className="border-top mx-3 mb-3 pt-3">
          <p className="text-muted mb-2" style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Sipariş Kalemleri
          </p>
          {items.map((item, i) => (
            <div key={i} className="d-flex justify-content-between align-items-center py-1" style={{ fontSize: 13 }}>
              <span className="text-muted">#{item.order_item_id} — {item.product_id?.slice(0, 10) ?? '—'}...</span>
              <span className="fw-medium">
                {item.quantity > 1 ? `${item.quantity} × ` : ''} ${(item.price ?? 0).toFixed(2)}
              </span>
            </div>
          ))}
          <div className="d-flex justify-content-end pt-2 border-top mt-2">
            <span className="fw-semibold" style={{ fontSize: 14 }}>
              Toplam (vergi dahil): ${(total * 1.08).toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main Profile Page ────────────────────────────────────────────────────────

const Profile = () => {
  const { user, updateProfile, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    name:  user?.user_metadata?.name  || '',
    email: user?.email                || '',
    phone: user?.user_metadata?.phone || '',
  });
  const [message,    setMessage]    = useState('');
  const [phoneError, setPhoneError] = useState('');

  // Orders state
  const [orders,        setOrders]        = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError,   setOrdersError]   = useState('');
  const [realtimeOn,    setRealtimeOn]    = useState(false);
  const [newOrderIds,   setNewOrderIds]   = useState(new Set()); // flash animation for updated cards
  const unsubscribeRef = useRef(null);

  // Load orders when tab opened
  useEffect(() => {
    if (activeTab !== 'orders' || !user) return;

    setOrdersLoading(true);
    setOrdersError('');

    fetchUserOrders(user.id)
      .then(data => {
        setOrders(data);

        // Subscribe to realtime updates for these orders
        const ids = data.map(o => o.order_id);
        unsubscribeRef.current = subscribeToOrderUpdates(ids, (updatedRow) => {
          setOrders(prev =>
            prev.map(o =>
              o.order_id === updatedRow.order_id ? { ...o, ...updatedRow } : o
            )
          );
          // Flash highlight the card that changed
          setNewOrderIds(prev => {
            const next = new Set(prev);
            next.add(updatedRow.order_id);
            return next;
          });
          setTimeout(() => {
            setNewOrderIds(prev => {
              const next = new Set(prev);
              next.delete(updatedRow.order_id);
              return next;
            });
          }, 3000);
        });
        setRealtimeOn(true);
      })
      .catch(err => setOrdersError(err.message))
      .finally(() => setOrdersLoading(false));

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
        setRealtimeOn(false);
      }
    };
  }, [activeTab, user]);

  if (!user) return <Navigate to="/login" />;

  const handleUpdate = async (e) => {
    e.preventDefault();
    setPhoneError('');
    if (formData.phone && !/^[+]?[\d\s\-().]{7,15}$/.test(formData.phone.trim())) {
      setPhoneError('Geçerli bir telefon numarası girin.');
      return;
    }
    try {
      await updateProfile(formData);
      setMessage('Profil başarıyla güncellendi.');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setPhoneError(err.message || 'Güncelleme başarısız.');
    }
  };

  const handleDelete = () => {
    if (window.confirm('Hesabınızı silmek istediğinizden emin misiniz?')) logout();
  };

  return (
    <>
      {/* Pulse animation for realtime indicator */}
      <style>{`
        @keyframes pulse-ring {
          0%   { transform: scale(1);   opacity: 0.8; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        .realtime-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: #10b981;
          animation: pulse-ring 1.5s infinite;
          display: inline-block;
        }
      `}</style>

      <div className="container mt-5 animate-fade-in">
        <div className="row g-4">

          {/* Sidebar */}
          <div className="col-lg-3">
            <div className="card border-0 shadow-sm overflow-hidden">
              <div className="card-body p-4 text-center border-bottom" style={{ background: 'linear-gradient(135deg, #eff6ff, #dbeafe)' }}>
                <div
                  className="bg-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3 shadow-sm"
                  style={{ width: 80, height: 80 }}
                >
                  <UserIcon size={32} className="text-primary" />
                </div>
                <h5 className="fw-bold mb-1">{user.user_metadata?.name || user.email}</h5>
                <p className="text-muted small mb-0">{user.email}</p>
              </div>

              <div className="list-group list-group-flush border-0">
                {[
                  { key: 'profile', label: 'Hesap Ayarları', Icon: Settings },
                  { key: 'orders',  label: 'Siparişlerim',   Icon: Package  },
                ].map(({ key, label, Icon }) => (
                  <button
                    key={key}
                    className={`list-group-item list-group-item-action d-flex align-items-center gap-3 py-3 border-0 ${activeTab === key ? 'active bg-primary text-white' : ''}`}
                    onClick={() => setActiveTab(key)}
                  >
                    <Icon size={18} /> {label}
                  </button>
                ))}
                <button
                  className="list-group-item list-group-item-action d-flex align-items-center gap-3 py-3 border-0 text-danger"
                  onClick={logout}
                >
                  <LogOut size={18} /> Çıkış Yap
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="col-lg-9">
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4 p-md-5">

                {/* ── Account Settings ── */}
                {activeTab === 'profile' && (
                  <>
                    <h4 className="fw-bold mb-4">Hesap Ayarları</h4>
                    {message && <div className="alert alert-success">{message}</div>}
                    <form onSubmit={handleUpdate}>
                      <div className="row g-4 mb-4">
                        <div className="col-md-6">
                          <label className="form-label small fw-medium">Ad Soyad</label>
                          <input className="form-control" value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })} />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label small fw-medium">E-posta</label>
                          <input className="form-control" type="email" value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })} />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label small fw-medium">Telefon</label>
                          <input
                            className={`form-control ${phoneError ? 'is-invalid' : ''}`}
                            placeholder="+90 5XX XXX XX XX"
                            value={formData.phone}
                            onChange={e => { setPhoneError(''); setFormData({ ...formData, phone: e.target.value }); }}
                          />
                          {phoneError && <div className="invalid-feedback">{phoneError}</div>}
                        </div>
                      </div>
                      <button type="submit" className="btn btn-primary px-4 fw-medium">
                        Profili Güncelle
                      </button>
                    </form>

                    <hr className="my-5" />

                    <div>
                      <h5 className="fw-bold text-danger mb-3">Tehlikeli Bölge</h5>
                      <p className="text-muted small">Hesabınızı sildikten sonra geri dönemezsiniz.</p>
                      <button className="btn btn-outline-danger d-flex align-items-center gap-2" onClick={handleDelete}>
                        <Trash2 size={18} /> Hesabı Sil
                      </button>
                    </div>
                  </>
                )}

                {/* ── Order History ── */}
                {activeTab === 'orders' && (
                  <>
                    <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
                      <h4 className="fw-bold m-0">Siparişlerim</h4>
                      <div className="d-flex align-items-center gap-2">
                        {realtimeOn ? (
                          <span className="d-flex align-items-center gap-2 badge" style={{ background: '#d1fae5', color: '#065f46', fontSize: 12, padding: '6px 12px' }}>
                            <Wifi size={13} /> Canlı Takip Aktif
                          </span>
                        ) : (
                          <span className="d-flex align-items-center gap-2 badge bg-secondary" style={{ fontSize: 12, padding: '6px 12px' }}>
                            <WifiOff size={13} /> Bağlanıyor...
                          </span>
                        )}
                      </div>
                    </div>

                    {ordersLoading && (
                      <div className="text-center py-5">
                        <div className="spinner-border text-primary" />
                        <p className="text-muted mt-3 small">Siparişler yükleniyor...</p>
                      </div>
                    )}

                    {ordersError && (
                      <div className="alert alert-danger">{ordersError}</div>
                    )}

                    {!ordersLoading && !ordersError && orders.length === 0 && (
                      <div className="text-center py-5 text-muted">
                        <Package size={56} className="mb-3 opacity-50" />
                        <h5>Henüz sipariş bulunmuyor</h5>
                        <p className="small">İlk siparişinizi oluşturduktan sonra buradan takip edebilirsiniz.</p>
                      </div>
                    )}

                    {!ordersLoading && orders.map(order => (
                      <OrderCard
                        key={order.order_id}
                        order={order}
                        isNew={newOrderIds.has(order.order_id)}
                      />
                    ))}
                  </>
                )}

              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;
