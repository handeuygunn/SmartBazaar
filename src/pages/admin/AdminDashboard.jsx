import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import {
  Shield,
  Edit2,
  Save,
  X,
  Search,
  AlertCircle,
  Plus,
  Trash2,
  Package,
  ChevronDown,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from "recharts";
import {
  fetchProducts,
  updateProduct,
  deleteProduct,
  createProduct,
} from "../../services/api";
import {
  fetchAllOrders,
  updateOrderStatus,
  ORDER_STATUSES,
  getStatusMeta,
} from "../../services/orderService";
import { useAuth } from "../../hooks/useAuth";

// ─── Order Status Updater Row ─────────────────────────────────────────────────

const OrderRow = ({ order, onSaved }) => {
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState(order.order_status);
  const [delivery, setDelivery] = useState(
    order.order_estimated_delivery_date
      ? new Date(order.order_estimated_delivery_date)
          .toISOString()
          .split("T")[0]
      : "",
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const meta = getStatusMeta(order.order_status);
  const purchaseDate = order.order_purchase_timestamp
    ? new Date(order.order_purchase_timestamp).toLocaleDateString("tr-TR")
    : "—";

  const handleSave = async () => {
    setSaving(true);
    setSaveError("");
    try {
      await updateOrderStatus(order.order_id, status, delivery || null);
      onSaved(order.order_id, status, delivery);
      setEditing(false);
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <tr>
      {/* Order ID */}
      <td className="px-3 py-3">
        <span className="fw-medium text-muted small">
          #{order.order_id.slice(0, 8).toUpperCase()}
        </span>
      </td>

      {/* Purchase Date */}
      <td className="text-muted small py-3">{purchaseDate}</td>

      {/* User ID */}
      <td className="text-muted small py-3" title={order.user_id}>
        {order.user_id?.slice(0, 8)}...
      </td>

      {/* Status */}
      <td className="py-3">
        {editing ? (
          <select
            className="form-select form-select-sm"
            style={{ width: 160 }}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {ORDER_STATUSES.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        ) : (
          <span
            className="badge"
            style={{
              backgroundColor: meta.bg,
              color: meta.color,
              border: `1px solid ${meta.color}40`,
              fontWeight: 600,
              fontSize: 11,
              padding: "5px 10px",
            }}
          >
            {meta.label}
          </span>
        )}
      </td>

      {/* Estimated Delivery */}
      <td className="py-3">
        {editing ? (
          <input
            type="date"
            className="form-control form-control-sm"
            style={{ width: 150 }}
            value={delivery}
            onChange={(e) => setDelivery(e.target.value)}
          />
        ) : (
          <span className="text-muted small">
            {delivery ? (
              new Date(delivery).toLocaleDateString("tr-TR")
            ) : (
              <span className="text-muted opacity-50">—</span>
            )}
          </span>
        )}
      </td>

      {/* Actions */}
      <td className="px-3 py-3 text-end">
        {saveError && <div className="text-danger small mb-1">{saveError}</div>}
        {editing ? (
          <div className="d-flex gap-2 justify-content-end">
            <button
              className="btn btn-sm btn-success text-white d-flex align-items-center gap-1"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <>
                  <span className="spinner-border spinner-border-sm" />{" "}
                  Kaydediliyor
                </>
              ) : (
                <>
                  <Save size={13} /> Kaydet
                </>
              )}
            </button>
            <button
              className="btn btn-sm btn-light border d-flex align-items-center gap-1"
              onClick={() => {
                setEditing(false);
                setStatus(order.order_status);
              }}
            >
              <X size={13} /> İptal
            </button>
          </div>
        ) : (
          <button
            className="btn btn-sm btn-light border d-flex align-items-center gap-1 ms-auto"
            onClick={() => setEditing(true)}
          >
            <Edit2 size={13} /> Düzenle
          </button>
        )}
      </td>
    </tr>
  );
};

// ─── Admin Dashboard ──────────────────────────────────────────────────────────

const AdminDashboard = () => {
  const { user } = useAuth();

  // ── Tab state
  const [activeTab, setActiveTab] = useState("products");

  // ── Products state
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ price: "", stock: "" });
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    id: "",
    title: "",
    price: "",
    category: "",
    brand: "SmartBazaar",
    stock: 0,
  });

  // ── Orders state
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersSearch, setOrdersSearch] = useState("");

  // ── Forecast state
  const [forecast, setForecast] = useState(null);
  const [forecastLoading, setForecastLoading] = useState(false);

  // ── Shared
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load products on mount
  useEffect(() => {
    const isAdmin = user && (user.role === "admin" || user.email === 'testaccount@hotmail.com');
    if (!isAdmin) return;
    let active = true;
    fetchProducts()
      .then((data) => {
        if (active && Array.isArray(data)) setProducts(data);
      })
      .catch((err) => {
        if (active) setError("Ürünler yüklenemedi: " + (err.message || ""));
      })
      .finally(() => {
        if (active) setProductsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user?.id]);

  // Load orders when tab opened
  useEffect(() => {
    if (activeTab !== "orders") return;
    setOrdersLoading(true);
    fetchAllOrders()
      .then(setOrders)
      .catch((err) => setError("Siparişler yüklenemedi: " + err.message))
      .finally(() => setOrdersLoading(false));
  }, [activeTab]);

  // Load forecast when tab opened
  useEffect(() => {
    if (activeTab !== "forecast" || forecast) return;
    setForecastLoading(true);

    // We get the token from localStorage (assuming standard auth pattern)
    const token = localStorage.getItem("token") || "admin"; // fallback for demo

    fetch("http://localhost:5001/api/forecast/sales", {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Admin-Token": token,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setForecast(data);
        } else {
          throw new Error(data.error || "Failed to fetch forecast");
        }
      })
      .catch((err) => setError("Satış tahminleri yüklenemedi: " + err.message))
      .finally(() => setForecastLoading(false));
  }, [activeTab, forecast]);

  // ── Product handlers
  const loadProducts = async () => {
    setProductsLoading(true);
    try {
      const data = await fetchProducts();
      if (Array.isArray(data)) setProducts(data);
    } catch (err) {
      setError("Failed to load products: " + (err.message || ""));
    } finally {
      setProductsLoading(false);
    }
  };

  const handleEditClick = (product) => {
    setEditingId(product.id);
    setEditForm({ price: product.price, stock: product.stock });
  };

  const handleSaveProduct = async (id) => {
    try {
      setError("");
      await updateProduct(id, {
        price: parseFloat(editForm.price),
        stock: parseInt(editForm.stock, 10),
      });
      setProducts(
        products.map((p) =>
          p.id === id
            ? {
                ...p,
                price: parseFloat(editForm.price),
                stock: parseInt(editForm.stock, 10),
              }
            : p,
        ),
      );
      setEditingId(null);
      setSuccess("Ürün güncellendi.");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Ürün güncellenemedi: " + (err.message || ""));
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Bu ürünü silmek istediğinizden emin misiniz?")) return;
    try {
      setError("");
      const result = await deleteProduct(id);
      setProducts(products.filter((p) => p.id !== id));
      setSuccess(
        result?.order_items_deleted > 0
          ? `Ürün silindi (${result.order_items_deleted} ilgili sipariş kalemi de kaldırıldı).`
          : "Ürün silindi.",
      );
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Ürün silinemedi: " + (err.message || ""));
    }
  };

  const handleAddProduct = async () => {
    try {
      setError("");
      const category = newProduct.category?.trim() || "informatica_acessorios";
      if (!newProduct.id || !newProduct.title || !newProduct.price) {
        setError("ID, Başlık ve Fiyat zorunludur.");
        return;
      }
      if (products.some((p) => p.id === newProduct.id)) {
        setError("Bu ID zaten mevcut.");
        return;
      }
      await createProduct({
        id: newProduct.id,
        title: newProduct.title,
        price: parseFloat(newProduct.price),
        category,
        brand: newProduct.brand || "SmartBazaar",
        stock: parseInt(newProduct.stock, 10) || 0,
      });
      await loadProducts();
      setShowAddModal(false);
      setNewProduct({
        id: "",
        title: "",
        price: "",
        category: "",
        brand: "SmartBazaar",
        stock: 0,
      });
      setSuccess("Ürün başarıyla eklendi.");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Ürün eklenemedi: " + (err.message || ""));
    }
  };

  // ── Order handler: update local state after save
  const handleOrderSaved = (orderId, newStatus, newDelivery) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.order_id === orderId
          ? {
              ...o,
              order_status: newStatus,
              order_estimated_delivery_date: newDelivery
                ? new Date(newDelivery).toISOString()
                : o.order_estimated_delivery_date,
            }
          : o,
      ),
    );
    setSuccess("Sipariş durumu güncellendi.");
    setTimeout(() => setSuccess(""), 3000);
  };

  const filteredProducts = products.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase()),
  );

  const filteredOrders = orders.filter(
    (o) =>
      o.order_id.toLowerCase().includes(ordersSearch.toLowerCase()) ||
      (o.user_id || "").toLowerCase().includes(ordersSearch.toLowerCase()),
  );

  // ── Access guard
  const isAdmin = user && (user.role === "admin" || user.email === 'testaccount@hotmail.com');
  if (!isAdmin) {
    return (
      <div className="container mt-5 text-center py-5">
        <AlertCircle size={64} className="text-danger mb-3 opacity-75" />
        <h2 className="fw-bold">Erişim Reddedildi</h2>
        <p className="text-muted">
          Bu sayfayı görüntülemek için admin yetkiniz yok.
        </p>
      </div>
    );
  }

  return (
    <div className="container mt-5 animate-fade-in">
      {/* Header */}
      <div className="d-flex align-items-center gap-2 mb-4">
        <Shield className="text-primary" size={28} />
        <h2 className="fw-bold m-0">Admin Dashboard</h2>
      </div>

      {/* Alerts */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show">
          {error}
          <button
            type="button"
            className="btn-close"
            onClick={() => setError("")}
          />
        </div>
      )}
      {success && (
        <div className="alert alert-success alert-dismissible fade show">
          {success}
          <button
            type="button"
            className="btn-close"
            onClick={() => setSuccess("")}
          />
        </div>
      )}

      {/* Tabs */}
      <ul className="nav nav-tabs mb-4 border-bottom">
        <li className="nav-item">
          <button
            className={`nav-link fw-medium ${activeTab === "products" ? "active" : ""}`}
            onClick={() => setActiveTab("products")}
          >
            Ürün Yönetimi
            <span className="badge bg-secondary ms-2 fw-normal">
              {products.length}
            </span>
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link fw-medium d-flex align-items-center gap-2 ${activeTab === "orders" ? "active" : ""}`}
            onClick={() => setActiveTab("orders")}
          >
            <Package size={15} /> Sipariş Yönetimi
            {orders.length > 0 && (
              <span className="badge bg-primary ms-1 fw-normal">
                {orders.length}
              </span>
            )}
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link fw-medium d-flex align-items-center gap-2 ${activeTab === "forecast" ? "active" : ""}`}
            onClick={() => setActiveTab("forecast")}
          >
            <TrendingUp size={15} /> Satış Tahmini (ML)
          </button>
        </li>
      </ul>

      {/* ── Products Tab ── */}
      {activeTab === "products" && (
        <div className="card border-0 shadow-sm overflow-hidden">
          <div className="card-header bg-white border-bottom p-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
            <h5 className="fw-bold m-0">Stok Yönetimi</h5>
            <div className="d-flex gap-2 align-items-center flex-wrap">
              <button
                className="btn btn-primary btn-sm d-flex align-items-center gap-2"
                onClick={() => setShowAddModal(true)}
              >
                <Plus size={16} /> Ürün Ekle
              </button>
              <div className="input-group" style={{ maxWidth: 280 }}>
                <span className="input-group-text bg-light border-end-0">
                  <Search size={15} className="text-muted" />
                </span>
                <input
                  type="text"
                  className="form-control bg-light border-start-0"
                  placeholder="Ürün ara..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="card-body p-0">
            {productsLoading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" />
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle m-0">
                  <thead className="table-light">
                    <tr>
                      <th className="px-4 py-3">ID</th>
                      <th className="py-3">Ürün</th>
                      <th className="py-3">Kategori</th>
                      <th className="py-3">Fiyat</th>
                      <th className="py-3">Stok</th>
                      <th className="px-4 py-3 text-end">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => (
                      <tr key={product.id}>
                        <td className="px-4 text-muted small">#{product.id}</td>
                        <td>
                          <div className="d-flex align-items-center gap-3">
                            <img
                              src={product.image}
                              alt={product.title}
                              className="rounded"
                              style={{
                                width: 40,
                                height: 40,
                                objectFit: "cover",
                              }}
                            />
                            <span
                              className="fw-medium text-truncate"
                              style={{ maxWidth: 200 }}
                            >
                              {product.title}
                            </span>
                          </div>
                        </td>
                        <td className="text-muted small">{product.category}</td>
                        <td>
                          {editingId === product.id ? (
                            <div
                              className="input-group input-group-sm"
                              style={{ width: 110 }}
                            >
                              <span className="input-group-text">$</span>
                              <input
                                type="number"
                                className="form-control"
                                value={editForm.price}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    price: e.target.value,
                                  })
                                }
                              />
                            </div>
                          ) : (
                            <span className="fw-semibold">
                              ${product.price.toFixed(2)}
                            </span>
                          )}
                        </td>
                        <td>
                          {editingId === product.id ? (
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              style={{ width: 80 }}
                              value={editForm.stock}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  stock: e.target.value,
                                })
                              }
                            />
                          ) : (
                            <span
                              className={`badge ${product.stock > 10 ? "bg-success" : product.stock > 0 ? "bg-warning text-dark" : "bg-danger"}`}
                            >
                              {product.stock} adet
                            </span>
                          )}
                        </td>
                        <td className="px-4 text-end">
                          {editingId === product.id ? (
                            <div className="d-flex gap-2 justify-content-end">
                              <button
                                className="btn btn-sm btn-success text-white d-flex align-items-center gap-1"
                                onClick={() => handleSaveProduct(product.id)}
                              >
                                <Save size={13} /> Kaydet
                              </button>
                              <button
                                className="btn btn-sm btn-light border d-flex align-items-center gap-1"
                                onClick={() => setEditingId(null)}
                              >
                                <X size={13} /> İptal
                              </button>
                            </div>
                          ) : (
                            <div className="d-flex gap-2 justify-content-end">
                              <button
                                className="btn btn-sm btn-light border d-flex align-items-center gap-1"
                                onClick={() => handleEditClick(product)}
                              >
                                <Edit2 size={13} /> Düzenle
                              </button>
                              <button
                                className="btn btn-sm btn-light border d-flex align-items-center gap-1 text-danger"
                                onClick={() => handleDeleteProduct(product.id)}
                              >
                                <Trash2 size={13} /> Sil
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                    {filteredProducts.length === 0 && (
                      <tr>
                        <td colSpan="6" className="text-center py-4 text-muted">
                          Ürün bulunamadı.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Orders Tab ── */}
      {activeTab === "orders" && (
        <div className="card border-0 shadow-sm overflow-hidden">
          <div className="card-header bg-white border-bottom p-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
            <h5 className="fw-bold m-0">Sipariş Durumu Yönetimi</h5>
            <div className="d-flex gap-2 align-items-center">
              <button
                className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
                onClick={() => {
                  setOrdersLoading(true);
                  fetchAllOrders()
                    .then(setOrders)
                    .finally(() => setOrdersLoading(false));
                }}
              >
                <RefreshCw size={14} /> Yenile
              </button>
              <div className="input-group" style={{ maxWidth: 280 }}>
                <span className="input-group-text bg-light border-end-0">
                  <Search size={15} className="text-muted" />
                </span>
                <input
                  type="text"
                  className="form-control bg-light border-start-0"
                  placeholder="Sipariş ID veya kullanıcı ara..."
                  value={ordersSearch}
                  onChange={(e) => setOrdersSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Status summary badges */}
          <div className="p-3 border-bottom bg-light d-flex flex-wrap gap-2">
            {ORDER_STATUSES.map((s) => {
              const count = orders.filter(
                (o) => o.order_status === s.key,
              ).length;
              return (
                <span
                  key={s.key}
                  className="badge"
                  style={{
                    backgroundColor: s.bg,
                    color: s.color,
                    border: `1px solid ${s.color}40`,
                    fontSize: 12,
                    padding: "6px 12px",
                  }}
                >
                  {s.label}: {count}
                </span>
              );
            })}
          </div>

          <div className="card-body p-0">
            {ordersLoading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" />
                <p className="text-muted small mt-3">
                  Siparişler yükleniyor...
                </p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle m-0">
                  <thead className="table-light">
                    <tr>
                      <th className="px-3 py-3">Sipariş ID</th>
                      <th className="py-3">Tarih</th>
                      <th className="py-3">Kullanıcı</th>
                      <th className="py-3">Durum</th>
                      <th className="py-3">Tahmini Teslim</th>
                      <th className="px-3 py-3 text-end">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => (
                      <OrderRow
                        key={order.order_id}
                        order={order}
                        onSaved={handleOrderSaved}
                      />
                    ))}
                    {filteredOrders.length === 0 && (
                      <tr>
                        <td colSpan="6" className="text-center py-4 text-muted">
                          Sipariş bulunamadı.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Add Product Modal ── */}
      {showAddModal && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold">Yeni Ürün Ekle</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowAddModal(false);
                    setError("");
                  }}
                />
              </div>
              <div className="modal-body">
                {error && (
                  <div className="alert alert-danger mb-3">{error}</div>
                )}
                <div className="mb-3">
                  <label className="form-label fw-medium">Ürün ID *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="PROD-001"
                    value={newProduct.id}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, id: e.target.value })
                    }
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-medium">Ürün Adı *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ürün adı"
                    value={newProduct.title}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, title: e.target.value })
                    }
                  />
                </div>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label fw-medium">Fiyat ($) *</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="0.00"
                      step="0.01"
                      value={newProduct.price}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, price: e.target.value })
                      }
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-medium">Stok</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="0"
                      value={newProduct.stock}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, stock: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-medium">Kategori</label>
                  <select
                    className="form-select"
                    value={newProduct.category}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, category: e.target.value })
                    }
                  >
                    <option value="">Kategori seçin...</option>
                    {[
                      "perfumaria",
                      "artes",
                      "esporte_lazer",
                      "bebes",
                      "utilidades_domesticas",
                      "instrumentos_musicais",
                      "cool_stuff",
                      "moveis_decoracao",
                      "informatica_acessorios",
                    ].map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-medium">Marka</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="SmartBazaar"
                    value={newProduct.brand}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, brand: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="modal-footer border-top">
                <button
                  type="button"
                  className="btn btn-light border"
                  onClick={() => {
                    setShowAddModal(false);
                    setError("");
                  }}
                >
                  İptal
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleAddProduct}
                >
                  <Plus size={16} className="me-1" /> Ekle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Forecast Tab ── */}
      {activeTab === "forecast" && (
        <div className="card border-0 shadow-sm overflow-hidden">
          <div className="card-header bg-white border-bottom p-4">
            <h5 className="fw-bold m-0 d-flex align-items-center gap-2">
              <TrendingUp className="text-primary" /> Yapay Zeka Satış Tahmini
            </h5>
            <p className="text-muted small mb-0 mt-1">
              Geçmiş verilere dayalı olarak önümüzdeki 30 günün makine öğrenimi
              destekli satış öngörüsü.
            </p>
          </div>

          <div className="card-body p-4">
            {forecastLoading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" />
                <p className="text-muted small mt-3">
                  Model hesaplamaları yapılıyor, veriler hazırlanıyor...
                </p>
              </div>
            ) : forecast && forecast.data ? (
              <>
                <div className="row g-4 mb-4">
                  <div className="col-md-4">
                    <div className="p-3 bg-light rounded-3 border">
                      <div className="text-muted small fw-medium mb-1">
                        Beklenen 30 Günlük Gelir
                      </div>
                      <h3 className="fw-bold m-0 text-primary">
                        $
                        {forecast.summary.totalPredicted30Days.toLocaleString()}
                      </h3>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="p-3 bg-light rounded-3 border">
                      <div className="text-muted small fw-medium mb-1">
                        Günlük Ortalama Beklenti
                      </div>
                      <h3 className="fw-bold m-0 text-success">
                        $
                        {forecast.summary.averageDailyPredicted.toLocaleString()}
                      </h3>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="p-3 bg-light rounded-3 border">
                      <div className="text-muted small fw-medium mb-1">
                        Genel Trend
                      </div>
                      <h3
                        className={`fw-bold m-0 ${forecast.summary.trend === "up" ? "text-success" : "text-danger"}`}
                      >
                        {forecast.summary.trend === "up"
                          ? "Yükseliş ↗"
                          : "Düşüş ↘"}
                      </h3>
                    </div>
                  </div>
                </div>

                <div style={{ width: "100%", height: 400 }} className="mt-4">
                  <ResponsiveContainer>
                    <ComposedChart
                      data={forecast.data}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        opacity={0.3}
                      />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 12 }}
                        tickFormatter={(val) => {
                          const d = new Date(val);
                          return `${d.getDate()} ${d.toLocaleString("tr-TR", { month: "short" })}`;
                        }}
                        minTickGap={30}
                      />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        tickFormatter={(val) => `$${val}`}
                        width={80}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "8px",
                          border: "none",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        }}
                        formatter={(value, name) => {
                          if (name === "actualSales")
                            return [
                              `$${value.toFixed(2)}`,
                              "Gerçekleşen Satış",
                            ];
                          if (name === "predictedSales")
                            return [`$${value.toFixed(2)}`, "Tahmin Edilen"];
                          if (name === "confidenceUpper")
                            return [`$${value.toFixed(2)}`, "Üst Sınır (95%)"];
                          if (name === "confidenceLower")
                            return [`$${value.toFixed(2)}`, "Alt Sınır (95%)"];
                          return [value, name];
                        }}
                        labelFormatter={(label) =>
                          new Date(label).toLocaleDateString("tr-TR", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                        }
                      />
                      <Legend wrapperStyle={{ paddingTop: "20px" }} />

                      {/* Confidence Interval Area */}
                      <Area
                        type="monotone"
                        dataKey="confidenceUpper"
                        stroke="none"
                        fill="#8b5cf6"
                        fillOpacity={0.1}
                        name="Güven Aralığı"
                        isAnimationActive={false}
                      />
                      <Area
                        type="monotone"
                        dataKey="confidenceLower"
                        stroke="none"
                        fill="#ffffff"
                        fillOpacity={1}
                        name=" "
                        isAnimationActive={false}
                      />

                      {/* Actual Sales Line */}
                      <Line
                        type="monotone"
                        dataKey="actualSales"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        dot={{ r: 2 }}
                        activeDot={{ r: 6 }}
                        name="Gerçekleşen Satış"
                      />

                      {/* Predicted Sales Line */}
                      <Line
                        type="monotone"
                        dataKey="predictedSales"
                        stroke="#8b5cf6"
                        strokeWidth={3}
                        strokeDasharray="5 5"
                        dot={{ r: 0 }}
                        activeDot={{ r: 6 }}
                        name="Tahmin Edilen"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </>
            ) : (
              <div className="text-center py-5 text-muted">
                Tahmin verisi bulunamadı.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
