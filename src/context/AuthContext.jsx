import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage for user simulation
    const storedUser = localStorage.getItem('smartbazaar_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    // Mock login logic -> in real app, call axios api here
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (email === 'admin@smartbazaar.com' && password === 'admin') {
          const adminUser = { id: 1, name: 'System Admin', email, role: 'admin' };
          setUser(adminUser);
          localStorage.setItem('smartbazaar_user', JSON.stringify(adminUser));
          resolve(adminUser);
        } else if (email && password) {
          const normalUser = { id: 2, name: 'Test User', email, role: 'user' };
          setUser(normalUser);
          localStorage.setItem('smartbazaar_user', JSON.stringify(normalUser));
          resolve(normalUser);
        } else {
          reject(new Error('Invalid credentials'));
        }
      }, 800);
    });
  };

  const register = async (name, email, password) => {
    // Mock register logic
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true, message: 'User registered' });
      }, 800);
    });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('smartbazaar_user');
  };

  const updateProfile = (data) => {
    const updatedUser = { ...user, ...data };
    setUser(updatedUser);
    localStorage.setItem('smartbazaar_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
