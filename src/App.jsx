import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Cart from './pages/Cart';
import AdminDashboard from './pages/admin/AdminDashboard';
import ProductDetail from './pages/ProductDetail';

function App() {
  return (
    <div className="app-container d-flex flex-column min-vh-100">
      <Navbar />
      <main className="flex-grow-1 flex-shrink-0 mb-5">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </main>
      <footer className="footer mt-auto py-4 bg-light">
        <div className="container text-center">
          <span className="text-muted">© 2026 smartBazaar. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
