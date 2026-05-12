import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CheckCircle, ShoppingBag, ArrowRight, Package, CreditCard } from 'lucide-react';

const OrderConfirmation = () => {
  const location = useLocation();
  const { orderId, amount, paymentMethod } = location.state || {};

  return (
    <div className="container mt-5 animate-fade-in">
      <div className="row justify-content-center">
        <div className="col-md-8 text-center">
          <div className="bg-white p-5 rounded-4 shadow-sm border-0">
            <div className="mb-4 d-inline-flex align-items-center justify-content-center bg-success bg-opacity-10 rounded-circle" style={{ width: '100px', height: '100px' }}>
              <CheckCircle size={54} className="text-success" />
            </div>
            
            <h1 className="fw-bold mb-3">Order Confirmed!</h1>
            <p className="text-muted fs-5 mb-5">
              Thank you for your purchase. Your order has been received and is being processed.
            </p>
            
            <div className="row g-4 text-start mb-5">
              <div className="col-sm-6">
                <div className="p-4 bg-light rounded-4 h-100 border border-light">
                  <div className="d-flex align-items-center gap-2 text-primary fw-bold mb-3">
                    <Package size={20} />
                    <span>Order Details</span>
                  </div>
                  <div className="mb-2">
                    <span className="text-muted small d-block">Order ID</span>
                    <span className="fw-semibold">#{orderId || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-muted small d-block">Estimated Delivery</span>
                    <span className="fw-semibold">3-5 Business Days</span>
                  </div>
                </div>
              </div>
              
              <div className="col-sm-6">
                <div className="p-4 bg-light rounded-4 h-100 border border-light">
                  <div className="d-flex align-items-center gap-2 text-primary fw-bold mb-3">
                    <CreditCard size={20} />
                    <span>Payment Summary</span>
                  </div>
                  <div className="mb-2">
                    <span className="text-muted small d-block">Total Amount</span>
                    <span className="fw-bold fs-5 text-dark">${amount?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div>
                    <span className="text-muted small d-block">Paid via</span>
                    <span className="fw-semibold text-capitalize">{(paymentMethod || 'Digital Wallet').replace('_', ' ')}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="d-flex flex-column flex-sm-row justify-content-center gap-3">
              <Link to="/profile" className="btn btn-primary px-5 py-3 fw-bold rounded-pill d-flex align-items-center justify-content-center gap-2 shadow-sm">
                Track My Order <ArrowRight size={20} />
              </Link>
              <Link to="/" className="btn btn-outline-secondary px-5 py-3 fw-bold rounded-pill d-flex align-items-center justify-content-center gap-2">
                <ShoppingBag size={20} /> Continue Shopping
              </Link>
            </div>
          </div>
          
          <div className="mt-5 text-muted small">
            A confirmation email has been sent to your registered email address.
            <br />
            Need help? <a href="#" className="text-decoration-none fw-medium">Contact Customer Support</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
