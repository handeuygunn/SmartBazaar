import React, { useState, useEffect, useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { Shield, Edit2, Save, X, Search, AlertCircle } from 'lucide-react';
import { fetchProducts, updateProduct } from '../../services/api';
import { AuthContext } from '../../context/AuthContext';

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ price: '', stock: '' });

  // Admin protection
  if (!user || user.role !== 'admin') {
    return (
      <div className="container mt-5 text-center py-5">
        <AlertCircle size={64} className="text-danger mb-3 opacity-75" />
        <h2 className="fw-bold">Access Denied</h2>
        <p className="text-muted">You do not have administrative privileges to view this page.</p>
      </div>
    );
  }

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await fetchProducts();
      setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (product) => {
    setEditingId(product.id);
    setEditForm({ price: product.price, stock: product.stock });
  };

  const handleSave = async (id) => {
    try {
      const updated = await updateProduct(id, { 
        price: parseFloat(editForm.price), 
        stock: parseInt(editForm.stock, 10) 
      });
      setProducts(products.map(p => p.id === id ? updated : p));
      setEditingId(null);
    } catch (err) {
      alert("Failed to update product");
    }
  };

  const filteredProducts = products.filter(p => p.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="container mt-5 animate-fade-in">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div className="d-flex align-items-center gap-2">
          <Shield className="text-primary" size={28} />
          <h2 className="fw-bold m-0">Admin Dashboard</h2>
        </div>
      </div>

      <div className="card border-0 shadow-sm overflow-hidden mb-5">
        <div className="card-header bg-white border-bottom p-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
          <h5 className="fw-bold m-0">Inventory Management</h5>
          <div className="input-group" style={{ maxWidth: '300px' }}>
            <span className="input-group-text bg-light border-end-0"><Search size={16} className="text-muted" /></span>
            <input 
              type="text" 
              className="form-control bg-light border-start-0" 
              placeholder="Search products..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5"><span className="spinner-border text-primary" /></div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle m-0">
                <thead className="table-light">
                  <tr>
                    <th className="px-4 py-3">ID</th>
                    <th className="py-3">Product</th>
                    <th className="py-3">Category</th>
                    <th className="py-3">Price</th>
                    <th className="py-3">Stock</th>
                    <th className="px-4 py-3 text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map(product => (
                    <tr key={product.id}>
                      <td className="px-4 text-muted small">#{product.id}</td>
                      <td>
                        <div className="d-flex align-items-center gap-3">
                          <img src={product.image} alt={product.title} className="rounded" style={{ width: '40px', height: '40px', objectFit: 'cover' }} />
                          <span className="fw-medium text-truncate" style={{ maxWidth: '200px' }}>{product.title}</span>
                        </div>
                      </td>
                      <td className="text-muted small">{product.category}</td>
                      
                      <td>
                        {editingId === product.id ? (
                          <div className="input-group input-group-sm" style={{ width: '100px' }}>
                            <span className="input-group-text">$</span>
                            <input 
                              type="number" 
                              className="form-control" 
                              value={editForm.price} 
                              onChange={(e) => setEditForm({...editForm, price: e.target.value})}
                            />
                          </div>
                        ) : (
                          <span className="fw-semibold">${product.price.toFixed(2)}</span>
                        )}
                      </td>
                      
                      <td>
                        {editingId === product.id ? (
                          <input 
                            type="number" 
                            className="form-control form-control-sm" 
                            style={{ width: '80px' }}
                            value={editForm.stock} 
                            onChange={(e) => setEditForm({...editForm, stock: e.target.value})}
                          />
                        ) : (
                          <span className={`badge ${product.stock > 10 ? 'bg-success' : product.stock > 0 ? 'bg-warning text-dark' : 'bg-danger'}`}>
                            {product.stock} in stock
                          </span>
                        )}
                      </td>
                      
                      <td className="px-4 text-end">
                        {editingId === product.id ? (
                          <div className="d-flex gap-2 justify-content-end">
                            <button className="btn btn-sm btn-success text-white py-1 px-2 d-flex align-items-center" onClick={() => handleSave(product.id)}>
                              <Save size={14} className="me-1" /> Save
                            </button>
                            <button className="btn btn-sm btn-light py-1 px-2 d-flex align-items-center border" onClick={() => setEditingId(null)}>
                              <X size={14} className="me-1" /> Cancel
                            </button>
                          </div>
                        ) : (
                          <button className="btn btn-sm btn-light border py-1 px-2 d-flex align-items-center ms-auto" onClick={() => handleEditClick(product)}>
                            <Edit2 size={14} className="me-1" /> Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredProducts.length === 0 && (
                     <tr><td colSpan="6" className="text-center py-4 text-muted">No products found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
