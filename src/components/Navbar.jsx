import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Search, LogOut, Shield } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { cartCount } = useContext(CartContext);
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate('/');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar navbar-expand-lg sticky-top py-3">
      <div className="container">
        <Link className="navbar-brand fw-bold text-primary-custom d-flex align-items-center gap-2" to="/">
          <div className="bg-primary text-white rounded p-1">sB</div>
          smartBazaar
        </Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span className="navbar-toggler-icon"></span>
        </button>
        
        <div className="collapse navbar-collapse" id="navbarNav">
          <form className="d-flex mx-auto w-100 px-lg-4 my-3 my-lg-0" style={{ maxWidth: '500px' }} onSubmit={handleSearch}>
            <div className="input-group">
              <input 
                type="text" 
                className="form-control" 
                placeholder="Search products..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button className="btn btn-outline-secondary d-flex align-items-center" type="submit">
                <Search size={18} />
              </button>
            </div>
          </form>

          <ul className="navbar-nav ms-auto align-items-center gap-3">
            {user?.role === 'admin' && (
              <li className="nav-item">
                <Link className="nav-link d-flex align-items-center gap-1" to="/admin">
                  <Shield size={20} /> Admin
                </Link>
              </li>
            )}
            
            <li className="nav-item position-relative">
              <Link className="nav-link d-flex align-items-center" to="/cart">
                <ShoppingCart size={22} />
                {cartCount > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.65rem' }}>
                    {cartCount}
                  </span>
                )}
              </Link>
            </li>

            {user ? (
              <li className="nav-item dropdown">
                <button className="btn btn-link nav-link dropdown-toggle d-flex align-items-center gap-2 text-decoration-none" id="userDropdown" data-bs-toggle="dropdown">
                  <User size={22} /> 
                  <span className="d-none d-lg-inline">{user.name.split(' ')[0]}</span>
                </button>
                <ul className="dropdown-menu dropdown-menu-end shadow border-0" aria-labelledby="userDropdown">
                  <li><Link className="dropdown-item py-2" to="/profile">My Profile</Link></li>
                  <li><hr className="dropdown-divider" /></li>
                  <li><button className="dropdown-item text-danger py-2" onClick={handleLogout}><LogOut size={16} className="me-2"/>Logout</button></li>
                </ul>
              </li>
            ) : (
              <li className="nav-item">
                <Link className="btn btn-primary px-4" to="/login">Sign In</Link>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
