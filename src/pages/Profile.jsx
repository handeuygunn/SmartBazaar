import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { User as UserIcon, Package, Settings, LogOut, Trash2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { fetchUserOrders } from '../services/orderService';

const statusBadge = (status) => {
  const map = {
    processing:  'bg-warning text-dark',
    delivered:   'bg-success',
    shipped:     'bg-info text-dark',
    cancelled:   'bg-danger',
  };
  return map[status] || 'bg-secondary';
};

const Profile = () => {
  const { user, updateProfile, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    name: user?.user_metadata?.name || '',
    email: user?.email || '',
    phone: user?.user_metadata?.phone || ''
  });
  const [message, setMessage] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState('');

  useEffect(() => {
    if (activeTab === 'orders' && user) {
      setOrdersLoading(true);
      setOrdersError('');
      fetchUserOrders(user.id)
        .then(setOrders)
        .catch(err => setOrdersError(err.message))
        .finally(() => setOrdersLoading(false));
    }
  }, [activeTab, user]);

  if (!user) {
    return <Navigate to="/login" />;
  }

  const handleUpdate = async (e) => {
    e.preventDefault();
    setPhoneError('');

    if (formData.phone && !/^[+]?[\d\s\-().]{7,15}$/.test(formData.phone.trim())) {
      setPhoneError('Geçerli bir telefon numarası girin (7-15 rakam, +, boşluk, tire kabul edilir).');
      return;
    }

    try {
      await updateProfile(formData);
      setMessage('Profil başarıyla güncellendi.');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('');
      setPhoneError(err.message || 'Güncelleme başarısız.');
    }
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete your account? This cannot be undone.")) {
      logout();
    }
  };

  return (
    <div className="container mt-5 animate-fade-in">
      <div className="row g-4">
        {/* Sidebar */}
        <div className="col-lg-3">
          <div className="card border-0 shadow-sm overflow-hidden">
            <div className="card-body p-4 text-center border-bottom bg-primary bg-opacity-10">
              <div className="bg-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3 shadow-sm" style={{ width: '80px', height: '80px' }}>
                <UserIcon size={32} className="text-primary" />
              </div>
              <h5 className="fw-bold mb-1">{user.user_metadata?.name || user.email}</h5>
              <p className="text-muted small mb-0">{user.email}</p>
            </div>
            <div className="list-group list-group-flush border-0">
              <button
                className={`list-group-item list-group-item-action d-flex align-items-center gap-3 py-3 border-0 ${activeTab === 'profile' ? 'active bg-primary text-white' : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                <Settings size={18} /> Account Settings
              </button>
              <button
                className={`list-group-item list-group-item-action d-flex align-items-center gap-3 py-3 border-0 ${activeTab === 'orders' ? 'active bg-primary text-white' : ''}`}
                onClick={() => setActiveTab('orders')}
              >
                <Package size={18} /> Order History
              </button>
              <button
                className="list-group-item list-group-item-action d-flex align-items-center gap-3 py-3 border-0 text-danger"
                onClick={logout}
              >
                <LogOut size={18} /> Logout
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="col-lg-9">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-4 p-md-5">

              {activeTab === 'profile' && (
                <>
                  <h4 className="fw-bold mb-4">Account Settings</h4>
                  {message && <div className="alert alert-success">{message}</div>}
                  <form onSubmit={handleUpdate}>
                    <div className="row g-4 mb-4">
                      <div className="col-md-6">
                        <label className="form-label small fw-medium">Full Name</label>
                        <input className="form-control" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-medium">Email Address</label>
                        <input className="form-control" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-medium">Phone Number</label>
                        <input
                          className={`form-control ${phoneError ? 'is-invalid' : ''}`}
                          placeholder="+90 5XX XXX XX XX"
                          value={formData.phone}
                          onChange={e => { setPhoneError(''); setFormData({ ...formData, phone: e.target.value }); }}
                        />
                        {phoneError && <div className="invalid-feedback">{phoneError}</div>}
                      </div>
                    </div>
                    <button type="submit" className="btn btn-primary px-4 fw-medium">Update Profile</button>
                  </form>

                  <hr className="my-5" />

                  <div>
                    <h5 className="fw-bold text-danger mb-3">Danger Zone</h5>
                    <p className="text-muted small">Once you delete your account, there is no going back. Please be certain.</p>
                    <button className="btn btn-outline-danger d-flex align-items-center gap-2" onClick={handleDelete}>
                      <Trash2 size={18} /> Delete Account
                    </button>
                  </div>
                </>
              )}

              {activeTab === 'orders' && (
                <>
                  <h4 className="fw-bold mb-4">Order History</h4>

                  {ordersLoading && (
                    <div className="text-center py-5">
                      <div className="spinner-border text-primary" />
                    </div>
                  )}

                  {ordersError && (
                    <div className="alert alert-danger">{ordersError}</div>
                  )}

                  {!ordersLoading && !ordersError && orders.length === 0 && (
                    <div className="text-center py-5 text-muted">
                      <Package size={48} className="mb-3 opacity-50" />
                      <p>Henüz siparişiniz bulunmuyor.</p>
                    </div>
                  )}

                  {!ordersLoading && orders.length > 0 && (
                    <div className="table-responsive">
                      <table className="table table-hover align-middle">
                        <thead className="table-light">
                          <tr>
                            <th>Order ID</th>
                            <th>Date</th>
                            <th>Items</th>
                            <th>Total</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orders.map(order => {
                            const items     = order.order_items || [];
                            const itemCount = items.length;
                            const total     = items.reduce(
                              (sum, item) => sum + (item.price ?? 0) * (item.quantity ?? 1), 0
                            );
                            const date = order.order_purchase_timestamp
                              ? new Date(order.order_purchase_timestamp).toLocaleDateString('tr-TR')
                              : '-';
                            return (
                              <tr key={order.order_id}>
                                <td className="fw-medium small text-muted">{order.order_id.slice(0, 8)}...</td>
                                <td className="text-muted">{date}</td>
                                <td>
                                  {itemCount > 0
                                    ? `${itemCount} ürün`
                                    : <span className="text-muted small">—</span>}
                                </td>
                                <td className="fw-semibold">
                                  {total > 0
                                    ? `$${(total * 1.08).toFixed(2)}`
                                    : <span className="text-muted small">—</span>}
                                </td>
                                <td>
                                  <span className={`badge ${statusBadge(order.order_status)}`}>
                                    {order.order_status}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
