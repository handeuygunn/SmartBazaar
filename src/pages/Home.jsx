import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { fetchProductsPage, fetchCategories, fetchRecommendations } from '../services/api';
import ProductCard from '../components/ProductCard';
import { Sparkles, Filter, X, ChevronDown } from 'lucide-react';

const Home = () => {
  const [products, setProducts]           = useState([]);
  const [hasMore, setHasMore]             = useState(false);
  const [page, setPage]                   = useState(0);
  const [recommendations, setRecommendations] = useState([]);
  const [categories, setCategories]       = useState([]);
  const [loading, setLoading]             = useState(true);
  const [loadingMore, setLoadingMore]     = useState(false);
  const [filters, setFilters]             = useState({ category: '', minPrice: '', maxPrice: '' });
  const [showFilters, setShowFilters]     = useState(false);

  const location    = useLocation();
  const searchQuery = new URLSearchParams(location.search).get('search') || '';

  // Track current request to discard stale responses on fast filter changes
  const requestId = useRef(0);

  useEffect(() => {
    const id = ++requestId.current;
    setLoading(true);
    setProducts([]);
    setPage(0);

    Promise.all([
      fetchProductsPage({ ...filters, search: searchQuery }, 0),
      fetchCategories(),
      fetchRecommendations(),
    ]).then(([{ products: prods, hasMore: more }, cats, recs]) => {
      if (id !== requestId.current) return; // stale
      setProducts(prods);
      setHasMore(more);
      setCategories(cats);
      setRecommendations(!searchQuery && !filters.category ? recs : []);
    }).catch(console.error)
      .finally(() => { if (id === requestId.current) setLoading(false); });
  }, [searchQuery, filters]);

  const handleLoadMore = async () => {
    setLoadingMore(true);
    const nextPage = page + 1;
    try {
      const { products: more, hasMore: stillMore } = await fetchProductsPage(
        { ...filters, search: searchQuery },
        nextPage
      );
      setProducts(prev => [...prev, ...more]);
      setPage(nextPage);
      setHasMore(stillMore);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => setFilters({ category: '', minPrice: '', maxPrice: '' });

  return (
    <div className="container mt-5 animate-fade-in">

      {searchQuery && (
        <div className="mb-4">
          <h3 className="fw-bold m-0">Search results for "{searchQuery}"</h3>
        </div>
      )}

      {recommendations.length > 0 && (
        <div className="mb-5 bg-primary bg-opacity-10 rounded-4 p-4 p-lg-5 position-relative overflow-hidden">
          <div className="d-flex align-items-center gap-2 mb-4">
            <Sparkles className="text-primary" size={24} />
            <h3 className="fw-bold text-primary m-0">Recommended for You</h3>
          </div>
          <div className="row g-4 position-relative" style={{ zIndex: 1 }}>
            {recommendations.map(product => (
              <div key={`rec-${product.id}`} className="col-12 col-md-6 col-lg-4">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
          <div className="position-absolute bg-primary rounded-circle opacity-25"
            style={{ width: '300px', height: '300px', top: '-100px', right: '-100px', filter: 'blur(60px)' }} />
        </div>
      )}

      <div className="row g-4">
        {/* Sidebar Filters */}
        <div className="col-lg-3">
          <div className="d-lg-none mb-3">
            <button className="btn btn-outline-primary w-100 d-flex align-items-center justify-content-center gap-2"
              onClick={() => setShowFilters(!showFilters)}>
              <Filter size={18} /> Filters
            </button>
          </div>

          <div className={`card border-0 shadow-sm ${showFilters ? 'd-block' : 'd-none d-lg-block'}`}>
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold m-0">Filters</h5>
                {(filters.category || filters.minPrice || filters.maxPrice) && (
                  <button className="btn btn-link text-decoration-none p-0 text-muted small d-flex align-items-center gap-1"
                    onClick={clearFilters}>
                    <X size={14} /> Clear
                  </button>
                )}
              </div>

              <hr className="text-muted opacity-25" />

              <div className="mb-4">
                <h6 className="fw-semibold mb-3">Categories</h6>
                <div className="d-flex flex-column gap-2">
                  <div className="form-check">
                    <input className="form-check-input" type="radio" name="category" id="cat-all"
                      value="" checked={filters.category === ''} onChange={handleFilterChange} />
                    <label className="form-check-label ms-1 text-muted" htmlFor="cat-all">All Categories</label>
                  </div>
                  {categories.map(cat => (
                    <div className="form-check" key={cat}>
                      <input className="form-check-input" type="radio" name="category" id={`cat-${cat}`}
                        value={cat} checked={filters.category === cat} onChange={handleFilterChange} />
                      <label className="form-check-label ms-1 text-muted" htmlFor={`cat-${cat}`}>{cat}</label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-3">
                <h6 className="fw-semibold mb-3">Price Range</h6>
                <div className="d-flex align-items-center gap-2">
                  <input type="number" className="form-control form-control-sm" placeholder="Min"
                    name="minPrice" value={filters.minPrice} onChange={handleFilterChange} />
                  <span className="text-muted">-</span>
                  <input type="number" className="form-control form-control-sm" placeholder="Max"
                    name="maxPrice" value={filters.maxPrice} onChange={handleFilterChange} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Product Grid */}
        <div className="col-lg-9">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h4 className="fw-bold m-0">Products</h4>
            <span className="text-muted small">
              {!loading && `${products.length} ürün gösteriliyor${hasMore ? ' (daha fazla var)' : ''}`}
            </span>
          </div>

          {loading ? (
            <div className="d-flex justify-content-center py-5">
              <div className="spinner-border text-primary" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <Filter size={48} className="mb-3 opacity-50" />
              <h5>No products found</h5>
              <p>Try adjusting your search or filters.</p>
              <button className="btn btn-outline-primary mt-2" onClick={clearFilters}>Clear Filters</button>
            </div>
          ) : (
            <>
              <div className="row g-4">
                {products.map(product => (
                  <div key={product.id} className="col-12 col-md-6 col-lg-4">
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>

              {hasMore && (
                <div className="text-center mt-5">
                  <button
                    className="btn btn-outline-primary px-5 py-2 rounded-3 fw-medium d-inline-flex align-items-center gap-2"
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                  >
                    {loadingMore
                      ? <><span className="spinner-border spinner-border-sm" /> Yükleniyor...</>
                      : <><ChevronDown size={18} /> Daha Fazla Göster</>
                    }
                  </button>
                </div>
              )}

              {!hasMore && products.length >= 12 && (
                <p className="text-center text-muted small mt-4">Tüm ürünler yüklendi.</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
