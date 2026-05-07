import React, { useState, useEffect, useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { Shield, Edit2, Save, X, Search, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { fetchProducts, updateProduct, deleteProduct, createProduct } from '../../services/api';
import { AuthContext } from '../../context/AuthContext';

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ price: '', stock: '' });
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState({ 
    id: '', 
    title: '', 
    price: '', 
    category: '',
    brand: 'SmartBazaar',
    stock: 0 
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user && user.role === 'admin') {
      loadProducts();
    }
  }, [user?.id]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      console.log('Loading products...');
      const data = await fetchProducts();
      console.log('Products fetched:', data, 'Type:', typeof data, 'isArray:', Array.isArray(data));
      
      if (!Array.isArray(data)) {
        console.error('Data is not an array:', data);
        setError('Invalid data format received');
        setLoading(false);
        return;
      }
      
      setProducts(data || []);
      console.log('Products set:', data.length);
    } catch (err) {
      console.error('Error loading products:', err);
      setError('Failed to load products: ' + (err.message || 'Unknown error'));
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
      setError('');
      await updateProduct(id, { 
        price: parseFloat(editForm.price), 
        stock: parseInt(editForm.stock, 10) 
      });
      
      setProducts(products.map(p => p.id === id ? {
        ...p,
        price: parseFloat(editForm.price),
        stock: parseInt(editForm.stock, 10)
      } : p));
      
      setEditingId(null);
      setSuccess('Product updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update product: ' + (err.message || 'Unknown error'));
    }
  };

  const handleDeleteClick = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    try {
      setError('');
      const result = await deleteProduct(id);
      setProducts(products.filter(p => p.id !== id));
      
      // Eğer bu ürünle ilgili siparışlar silindiyse, bunu kullanıcıya bildir
      if (result && result.order_items_deleted && result.order_items_deleted > 0) {
        setSuccess(`Product deleted successfully (${result.order_items_deleted} related order(s) also removed)`);
      } else {
        setSuccess('Product deleted successfully');
      }
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const errorMsg = err.message || 'Unknown error';
      setError('Failed to delete product: ' + errorMsg);
    }
  };

  const handleAddProduct = async () => {
    try {
      setError('');
      
      // Validation - kategori zorunlu değil, default olarak set edilecek
      const categoryValue = newProduct.category && newProduct.category.trim() ? newProduct.category : 'informatica_acessorios';
      
      if (!newProduct.id || !newProduct.title || !newProduct.price) {
        setError('Please fill all required fields (ID, Title, Price)');
        return;
      }

      if (products.some(p => p.id === newProduct.id)) {
        setError('Product ID already exists');
        return;
      }

      await createProduct({
        id: newProduct.id,
        title: newProduct.title,
        price: parseFloat(newProduct.price),
        category: categoryValue,
        brand: newProduct.brand || 'SmartBazaar',
        stock: parseInt(newProduct.stock, 10) || 0
      });

      await loadProducts();
      setShowAddModal(false);
      setNewProduct({ id: '', title: '', price: '', category: '', brand: 'SmartBazaar', stock: 0 });
      setSuccess('Product added successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to add product: ' + (err.message || 'Unknown error'));
    }
  };

  const filteredProducts = products.filter(p => p.title.toLowerCase().includes(search.toLowerCase()));

  // Admin protection - check before rendering
  if (!user || user.role !== 'admin') {
    return (
      <div className="container mt-5 text-center py-5">
        <AlertCircle size={64} className="text-danger mb-3 opacity-75" />
        <h2 className="fw-bold">Access Denied</h2>
        <p className="text-muted">You do not have administrative privileges to view this page.</p>
      </div>
    );
  }

  return (
    <div className="container mt-5 animate-fade-in">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div className="d-flex align-items-center gap-2">
          <Shield className="text-primary" size={28} />
          <h2 className="fw-bold m-0">Admin Dashboard</h2>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={() => setError('')}></button>
        </div>
      )}
      {success && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          {success}
          <button type="button" className="btn-close" onClick={() => setSuccess('')}></button>
        </div>
      )}

      <div className="card border-0 shadow-sm overflow-hidden mb-5">
        <div className="card-header bg-white border-bottom p-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
          <h5 className="fw-bold m-0">Inventory Management</h5>
          <div className="d-flex gap-2 align-items-center flex-wrap">
            <button 
              className="btn btn-primary btn-sm d-flex align-items-center gap-2"
              onClick={() => setShowAddModal(true)}
            >
              <Plus size={16} /> Add Product
            </button>
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
        </div>
        
        <div className="card-body p-0">
          {/* TEST: Always show table для debug */}
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
                          <div className="d-flex gap-2 justify-content-end">
                            <button className="btn btn-sm btn-light border py-1 px-2 d-flex align-items-center" onClick={() => handleEditClick(product)}>
                              <Edit2 size={14} className="me-1" /> Edit
                            </button>
                            <button 
                              className="btn btn-sm btn-light border py-1 px-2 d-flex align-items-center text-danger"
                              onClick={() => handleDeleteClick(product.id)}
                            >
                              <Trash2 size={14} className="me-1" /> Delete
                            </button>
                          </div>
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
            {/* TEST: loading condition removed, table always shown */}
        </div>
      </div>

      {showAddModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold">Add New Product</h5>
                <button type="button" className="btn-close" onClick={() => { setShowAddModal(false); setError(''); }}></button>
              </div>
              <div className="modal-body">
                {error && (
                  <div className="alert alert-danger mb-3">{error}</div>
                )}
                <div className="mb-3">
                  <label className="form-label fw-medium">Product ID *</label>
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="e.g., PROD-001"
                    value={newProduct.id}
                    onChange={(e) => setNewProduct({...newProduct, id: e.target.value})}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-medium">Product Title *</label>
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="Product name"
                    value={newProduct.title}
                    onChange={(e) => setNewProduct({...newProduct, title: e.target.value})}
                  />
                </div>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label fw-medium">Price ($) *</label>
                    <input 
                      type="number" 
                      className="form-control"
                      placeholder="0.00"
                      step="0.01"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-medium">Stock</label>
                    <input 
                      type="number" 
                      className="form-control"
                      placeholder="0"
                      value={newProduct.stock}
                      onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})}
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-medium">Category *</label>
                  <select 
                    className="form-select"
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                  >
                    <option value="">Select category...</option>
                    <option value="perfumaria">Perfumaria</option>
                    <option value="artes">Artes</option>
                    <option value="esporte_lazer">Esporte Lazer</option>
                    <option value="bebes">Bebes</option>
                    <option value="utilidades_domesticas">Utilidades Domesticas</option>
                    <option value="instrumentos_musicais">Instrumentos Musicais</option>
                    <option value="cool_stuff">Cool Stuff</option>
                    <option value="moveis_decoracao">Moveis Decoracao</option>
                    <option value="informatica_acessorios">Informatica Acessorios</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-medium">Brand</label>
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="SmartBazaar"
                    value={newProduct.brand}
                    onChange={(e) => setNewProduct({...newProduct, brand: e.target.value})}
                  />
                </div>
              </div>
              <div className="modal-footer border-top">
                <button 
                  type="button" 
                  className="btn btn-light border"
                  onClick={() => { setShowAddModal(false); setError(''); }}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={handleAddProduct}
                >
                  <Plus size={16} className="me-1" /> Add Product
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
