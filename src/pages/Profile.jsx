import React, { useContext, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { User as UserIcon, Package, Settings, LogOut, Trash2 } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const Profile = () => {
  const { user, updateProfile, logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || ''
  });
  const [message, setMessage] = useState('');

  if (!user) {
    return <Navigate to="/login" />;
  }

  const handleUpdate = (e) => {
    e.preventDefault();
    updateProfile(formData);
    setMessage('Profile updated successfully');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete your account? This cannot be undone.")) {
      // simulate api call
      logout();
    }
  };

  const mockOrders = [
    { id: 'ORD-10029', date: '2026-04-10', total: 349.99, status: 'Delivered' },
    { id: 'ORD-10045', date: '2026-04-15', total: 120.00, status: 'Processing' }
  ];

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
              <h5 className="fw-bold mb-1">{user.name}</h5>
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
                        <input className="form-control" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-medium">Email Address</label>
                        <input className="form-control" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-medium">Phone Number</label>
                        <input className="form-control" placeholder="+1..." value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                      </div>
                    </div>
                    <button type="submit" className="btn btn-primary px-4 fw-medium bg-primary">Update Profile</button>
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
                  <div className="table-responsive">
                    <table className="table table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Order ID</th>
                          <th>Date</th>
                          <th>Total</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mockOrders.map(order => (
                          <tr key={order.id}>
                            <td className="fw-medium">{order.id}</td>
                            <td className="text-muted">{order.date}</td>
                            <td className="fw-semibold">${order.total.toFixed(2)}</td>
                            <td>
                              <span className={`badge ${order.status === 'Delivered' ? 'bg-success' : 'bg-warning text-dark'}`}>
                                {order.status}
                              </span>
                            </td>
                            <td>
                              <button className="btn btn-sm btn-light">View Details</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
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
