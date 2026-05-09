import React, { createContext, useState, useEffect } from 'react';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [savedItems, setSavedItems] = useState([]);

  useEffect(() => {
    const storedCart = localStorage.getItem('smartbazaar_cart');
    if (storedCart) {
      setCartItems(JSON.parse(storedCart));
    }
    const storedSaved = localStorage.getItem('smartbazaar_saved');
    if (storedSaved) {
      setSavedItems(JSON.parse(storedSaved));
    }
  }, []);

  const saveCart = (items) => {
    setCartItems(items);
    localStorage.setItem('smartbazaar_cart', JSON.stringify(items));
  };

  const saveSaved = (items) => {
    setSavedItems(items);
    localStorage.setItem('smartbazaar_saved', JSON.stringify(items));
  };

  const addToCart = (product, quantity = 1) => {
    const existing = cartItems.find((item) => item.id === product.id);
    let newItems;
    if (existing) {
      newItems = cartItems.map((item) =>
        item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
      );
    } else {
      newItems = [...cartItems, { ...product, quantity }];
    }
    saveCart(newItems);
  };

  const removeFromCart = (id) => {
    const newItems = cartItems.filter((item) => item.id !== id);
    saveCart(newItems);
  };

  const updateQuantity = (id, quantity) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    const newItems = cartItems.map((item) =>
      item.id === id ? { ...item, quantity } : item
    );
    saveCart(newItems);
  };

  const clearCart = () => {
    saveCart([]);
  };

  const saveForLater = (id) => {
    const item = cartItems.find((i) => i.id === id);
    if (item) {
      removeFromCart(id);
      
      const existingSaved = savedItems.find((i) => i.id === id);
      if (existingSaved) {
        saveSaved(savedItems.map(i => i.id === id ? { ...i, quantity: i.quantity + item.quantity } : i));
      } else {
        saveSaved([...savedItems, item]);
      }
    }
  };

  const moveToCart = (id) => {
    const item = savedItems.find((i) => i.id === id);
    if (item) {
      removeSavedItem(id);
      addToCart(item, item.quantity);
    }
  };

  const removeSavedItem = (id) => {
     const newSaved = savedItems.filter(i => i.id !== id);
     saveSaved(newSaved);
  };

  const cartTotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider value={{ 
      cartItems, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, cartCount,
      savedItems, saveForLater, moveToCart, removeSavedItem
    }}>
      {children}
    </CartContext.Provider>
  );
};
