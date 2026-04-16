import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Star } from 'lucide-react';
import { CartContext } from '../context/CartContext';

const ProductCard = ({ product }) => {
  const { addToCart } = useContext(CartContext);

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
    // Optional: could add a toast notification here
  };

  return (
    <Link to={`/product/${product.id}`} className="text-decoration-none text-dark">
      <div className="card h-100 card-hover border-0 overflow-hidden">
        <div className="position-relative bg-light" style={{ height: '220px' }}>
          <img 
            src={product.image} 
            alt={product.title} 
            className="w-100 h-100 object-fit-cover"
          />
          {product.brand && (
            <span className="position-absolute top-0 start-0 m-2 badge bg-dark opacity-75">
              {product.brand}
            </span>
          )}
        </div>
        <div className="card-body d-flex flex-column p-4">
          <div className="text-muted small mb-1">{product.category}</div>
          <h5 className="card-title fw-semibold text-truncate mb-2">{product.title}</h5>
          
          <div className="d-flex align-items-center mb-3">
            <Star size={16} className="text-warning fill-warning" />
            <span className="ms-1 small fw-medium">{product.rating}</span>
          </div>

          <div className="mt-auto d-flex align-items-center justify-content-between">
            <span className="fs-5 fw-bold">${product.price.toFixed(2)}</span>
            <button 
              className="btn btn-primary d-flex align-items-center justify-content-center rounded-circle"
              style={{ width: '40px', height: '40px' }}
              onClick={handleAddToCart}
              aria-label="Add to cart"
            >
              <ShoppingCart size={18} />
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
