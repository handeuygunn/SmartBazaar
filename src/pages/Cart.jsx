import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowRight, Minus, Plus, Shield, Bookmark, CreditCard, Wallet, Apple } from 'lucide-react';
import { CartContext } from '../context/CartContext';
import { useAuth } from '../hooks/useAuth';
import { createOrder } from '../services/orderService';
import { processPayment, PAYMENT_METHODS } from '../services/paymentService';

const Cart = () => {
  const { 
    cartItems, removeFromCart, updateQuantity, cartTotal, clearCart,
    savedItems, saveForLater, moveToCart, removeSavedItem 
  } = useContext(CartContext);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedPayment, setSelectedPayment] = useState('credit_card');

  const totalAmount = cartTotal * 1.08;

  const handleCheckout = async () => {
    if (!user) {
      alert('Please login to complete your checkout.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // 1. Process Payment via RESTful API (Simulated)
      const paymentResponse = await processPayment({
        method: selectedPayment,
        amount: totalAmount,
        userId: user.id
      });

      if (!paymentResponse.success) {
        throw new Error('Payment processing failed. Please try again.');
      }

      // 2. Create Order in Database
      const orderId = await createOrder(user.id, cartItems);
      
      // 3. Clear Cart and Redirect to Confirmation Page
      clearCart();
      navigate('/order-confirmation', { 
        state: { 
          orderId, 
          amount: totalAmount, 
          paymentMethod: selectedPayment 
        } 
      });
    } catch (err) {
      setError(err.message || 'An error occurred during checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0 && savedItems.length === 0) {
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

      {error && <div className="alert alert-danger rounded-3 mb-4">{error}</div>}

      <div className="row g-4">
        <div className="col-lg-8">
          {cartItems.length > 0 ? (
            <div className="card border-0 shadow-sm mb-4">
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

                        <div className="col-12 col-md-5 mt-3 mt-md-0 d-flex align-items-center justify-content-between justify-content-md-end gap-3">
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

                          <div className="d-flex align-items-center ms-2">
                            <button
                              className="btn btn-link text-secondary p-0 shadow-none border-0 me-3"
                              onClick={() => saveForLater(item.id)}
                              title="Save for Later"
                            >
                              <Bookmark size={20} />
                            </button>
                            <button
                              className="btn btn-link text-danger p-0 shadow-none border-0"
                              onClick={() => removeFromCart(item.id)}
                              title="Remove"
                            >
                              <Trash2 size={20} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-body text-center py-5">
                <ShoppingBag size={48} className="text-muted mb-3 opacity-50" />
                <h4 className="fw-bold">Your active cart is empty</h4>
                <p className="text-muted">You have no items currently ready for checkout.</p>
                <Link to="/" className="btn btn-primary px-4 fw-medium mt-2">Continue Shopping</Link>
              </div>
            </div>
          )}

          {/* Saved for Later Section */}
          {savedItems && savedItems.length > 0 && (
            <div className="mt-5 mb-5">
              <h4 className="fw-bold mb-3">Saved for Later ({savedItems.length} items)</h4>
              <div className="card border-0 shadow-sm">
                <div className="card-body p-0">
                  <ul className="list-group list-group-flush border-0">
                    {savedItems.map((item) => (
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

                          <div className="col-12 col-md-5 mt-3 mt-md-0 d-flex align-items-center justify-content-between justify-content-md-end gap-3">
                            <button
                              className="btn btn-outline-primary btn-sm fw-medium px-3 rounded-pill"
                              onClick={() => moveToCart(item.id)}
                            >
                              Move to Cart
                            </button>
                            <button
                              className="btn btn-link text-danger p-0 shadow-none border-0 ms-2"
                              onClick={() => removeSavedItem(item.id)}
                              title="Remove"
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
          )}
        </div>

        {cartItems.length > 0 && (
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
                  <span className="fw-bold fs-5 text-primary">${totalAmount.toFixed(2)}</span>
                </div>

                <div className="mb-4">
                  <h6 className="fw-bold mb-3 small text-uppercase text-muted">Select Payment Method</h6>
                  <div className="d-flex flex-column gap-2">
                    {PAYMENT_METHODS.map((method) => (
                      <button
                        key={method.id}
                        type="button"
                        className={`btn d-flex align-items-center justify-content-between p-3 rounded-3 border-2 transition-all ${
                          selectedPayment === method.id 
                            ? 'border-primary bg-primary bg-opacity-10 text-primary' 
                            : 'border-light bg-light text-secondary'
                        }`}
                        onClick={() => setSelectedPayment(method.id)}
                      >
                        <div className="d-flex align-items-center gap-3">
                          {method.id === 'apple_pay' && <Apple size={20} />}
                          {method.id === 'google_pay' && <Wallet size={20} />}
                          {method.id === 'paypal' && <CreditCard size={20} />}
                          {method.id === 'credit_card' && <CreditCard size={20} />}
                          <span className="fw-semibold">{method.name}</span>
                        </div>
                        <div className={`rounded-circle border border-2 d-flex align-items-center justify-content-center ${
                          selectedPayment === method.id ? 'border-primary' : 'border-secondary'
                        }`} style={{ width: '18px', height: '18px' }}>
                          {selectedPayment === method.id && <div className="bg-primary rounded-circle" style={{ width: '10px', height: '10px' }} />}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  className="btn btn-primary w-100 py-3 fw-bold d-flex align-items-center justify-content-center gap-2 rounded-3 shadow-sm"
                  onClick={handleCheckout}
                  disabled={loading}
                >
                  {loading
                    ? <><span className="spinner-border spinner-border-sm me-2" />Processing...</>
                    : <>Complete Purchase <ArrowRight size={18} /></>
                  }
                </button>

                <div className="text-center mt-3 small text-muted">
                  <Shield size={14} className="me-1 d-inline" /> Secure encryption & payment
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
