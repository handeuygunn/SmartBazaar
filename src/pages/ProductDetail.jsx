import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingCart, Star, ShieldCheck, Truck, ArrowLeft } from 'lucide-react';
import { fetchProductById } from '../services/api';
import { CartContext } from '../context/CartContext';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useContext(CartContext);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const data = await fetchProductById(id);
        setProduct(data);
      } catch (error) {
        console.error("Failed to load product", error);
      } finally {
        setLoading(false);
      }
    };
    loadProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="container mt-5 text-center py-5">
        <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
      </div>
    );
  }

  if (!product) {
    return <div className="container mt-5 text-center py-5"><h2>Product Not Found</h2></div>;
  }

  return (
    <div className="container mt-4 animate-fade-in">
      <Link to="/" className="btn btn-link text-decoration-none text-muted mb-4 px-0 d-flex align-items-center gap-2">
        <ArrowLeft size={18} /> Back to products
      </Link>
      
      <div className="card border-0 shadow-sm overflow-hidden rounded-4">
        <div className="row g-0">
          {/* Image Gallery */}
          <div className="col-md-6 bg-light p-4 p-lg-5 d-flex align-items-center justify-content-center">
            <img 
              src={product.image} 
              alt={product.title} 
              className="img-fluid rounded shadow-sm"
              style={{ maxHeight: '400px', objectFit: 'contain' }}
            />
          </div>
          
          {/* Product Info */}
          <div className="col-md-6 p-4 p-lg-5 d-flex flex-column justify-content-center">
            <div className="mb-2 d-flex align-items-center gap-2">
              <span className="badge bg-primary bg-opacity-10 text-primary">{product.category}</span>
              <span className="text-muted small fw-medium">{product.brand}</span>
            </div>
            
            <h2 className="fw-bold mb-3">{product.title}</h2>
            
            <div className="d-flex align-items-center mb-4 gap-3">
              <div className="d-flex align-items-center">
                {[1,2,3,4,5].map(star => (
                   <Star key={star} size={18} className={star <= Math.round(product.rating) ? 'text-warning fill-warning' : 'text-muted opacity-25'} style={star <= Math.round(product.rating) ? {fill: "currentColor"} : {}} />
                ))}
                <span className="ms-2 fw-medium">{product.rating}</span>
              </div>
              <span className="text-muted small">|</span>
              <span className="text-success fw-medium small">In Stock ({product.stock})</span>
            </div>
            
            <div className="fs-2 fw-bold text-dark mb-4">
              ${product.price.toFixed(2)}
            </div>
            
            <p className="text-muted mb-5 line-height-lg">
              Experience premium quality with this {product.title}. Designed carefully by {product.brand} to meet all your needs.
              Perfect for everyday use and built to last. Add it to your collection today.
            </p>
            
            <div className="d-flex flex-column flex-sm-row gap-3 mt-auto">
              {/* Quantity selector */}
              <div className="d-flex align-items-center border rounded flex-shrink-0" style={{ width: 'fit-content' }}>
                <button className="btn btn-light border-0 shadow-none px-3" onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
                <div className="px-3 fw-medium text-center" style={{ minWidth: '40px' }}>{quantity}</div>
                <button className="btn btn-light border-0 shadow-none px-3" onClick={() => setQuantity(quantity + 1)}>+</button>
              </div>
              
              {/* Add to cart */}
              <button 
                className="btn btn-primary flex-grow-1 py-2 fw-bold d-flex align-items-center justify-content-center gap-2"
                onClick={() => addToCart(product, quantity)}
              >
                <ShoppingCart size={20} /> Add to Cart
              </button>
            </div>
            
            {/* Features */}
            <div className="d-flex flex-column gap-3 mt-5 pt-4 border-top">
              <div className="d-flex align-items-center gap-3 text-muted small">
                <Truck size={20} className="text-primary" /> Free shipping on orders over $50
              </div>
              <div className="d-flex align-items-center gap-3 text-muted small">
                <ShieldCheck size={20} className="text-success" /> 30-day money back guarantee
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
