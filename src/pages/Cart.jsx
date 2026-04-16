import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowRight, Minus, Plus } from 'lucide-react';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';

const Cart = () => {
  const { cartItems, removeFromCart, updateQuantity, cartTotal, clearCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);

  const handleCheckout = () => {
    if (!user) {
      alert("Please login to complete your checkout.");
      return;
    }
    
    if (window.confirm("Simulating Secure Checkout. Proceed with payment?")) {
      setTimeout(() => {
        alert("Payment Successful! Your order has been placed.");
        clearCart();
      }, 1000);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="container mt-5">
        <div className="text-center py-5 bg-white rounded-4 shadow-sm">
          <ShoppingBag size={64} className="text-muted mb-3 opacity-50" />
          <h3 className="fw-bold">Your cart is empty</h3>
          <p className="text-muted mb-4">Looks like you haven't added any products to your cart yet.</p>
          <Link to="/" className="btn btn-primary px-4 fw-medium">Start Shopping</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-5 animate-fade-in">
      <h2 className="fw-bold mb-4">Shopping Cart</h2>
      
      <div className="row g-4">
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-0">
              <ul className="list-group list-group-flush border-0">
                {cartItems.map((item) => (
                  <li key={item.id} className="list-group-item p-4 border-bottom">
                    <div className="row align-items-center">
                      <div className="col-3 col-md-2">
                        <img src={item.image} alt={item.title} className="img-fluid rounded bg-light" />
                      </div>
                      <div className="col-9 col-md-5">
                        <h6 className="fw-bold mb-1">{item.title}</h6>
                        <div className="text-muted small mb-2">{item.category}</div>
                        <div className="fw-semibold text-primary">${item.price.toFixed(2)}</div>
                      </div>
                      
                      <div className="col-12 col-md-5 mt-3 mt-md-0 d-flex align-items-center justify-content-between justify-content-md-end gap-4">
                        <div className="d-flex align-items-center bg-light rounded-pill p-1 border">
                          <button 
                            className="btn btn-sm btn-light rounded-circle p-1 d-flex shadow-none bg-white"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus size={14} />
                          </button>
                          <span className="mx-3 fw-medium" style={{ minWidth: '20px', textAlign: 'center' }}>
                            {item.quantity}
                          </span>
                          <button 
                            className="btn btn-sm btn-light rounded-circle p-1 d-flex shadow-none bg-white"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        
                        <div className="fw-bold">
                          ${(item.price * item.quantity).toFixed(2)}
                        </div>
                        
                        <button 
                          className="btn btn-link text-danger p-0 shadow-none border-0"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card border-0 shadow-sm position-sticky" style={{ top: '100px' }}>
            <div className="card-body p-4">
              <h5 className="fw-bold mb-4">Order Summary</h5>
              
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Subtotal</span>
                <span className="fw-medium">${cartTotal.toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Shipping</span>
                <span className="text-success fw-medium">Free</span>
              </div>
              <div className="d-flex justify-content-between mb-4">
                <span className="text-muted">Tax (Estimated)</span>
                <span className="fw-medium">${(cartTotal * 0.08).toFixed(2)}</span>
              </div>
              
              <hr className="mb-4" />
              
              <div className="d-flex justify-content-between mb-4">
                <span className="fw-bold fs-5">Total</span>
                <span className="fw-bold fs-5 text-primary">${(cartTotal * 1.08).toFixed(2)}</span>
              </div>
              
              <button 
                className="btn btn-primary w-100 py-3 fw-bold d-flex align-items-center justify-content-center gap-2 rounded-3 shadow-sm"
                onClick={handleCheckout}
              >
                Proceed to Checkout <ArrowRight size={18} />
              </button>
              
              <div className="text-center mt-3 small text-muted">
                <Shield size={14} className="me-1 d-inline" /> Secure encryption & payment
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// need Shield icon import
import { Shield } from 'lucide-react';

export default Cart;
