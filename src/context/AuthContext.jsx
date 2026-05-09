import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { AuthContext } from './AuthContextInstance';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    return data.user;
  };

  const register = async (name, email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) throw new Error(error.message);
    return data;
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const resetPassword = async (email) => {
    const redirectTo = `${window.location.origin}/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw new Error(error.message);
  };

  const updatePassword = async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw new Error(error.message);
  };

  const updateProfile = async ({ name, email, phone }) => {
    const updates = {};
    if (email) updates.email = email;
    if (name !== undefined || phone !== undefined) {
      updates.data = { name, phone };
    }
    const { data, error } = await supabase.auth.updateUser(updates);
    if (error) throw new Error(error.message);
    if (data?.user) setUser(data.user);
  };

  const toggleFavorite = async (productId) => {
    if (!user) return;
    const currentFavorites = user.user_metadata?.favorites || [];
    let newFavorites;
    if (currentFavorites.includes(productId)) {
      newFavorites = currentFavorites.filter(id => id !== productId);
    } else {
      newFavorites = [...currentFavorites, productId];
    }
    const { data, error } = await supabase.auth.updateUser({
      data: { favorites: newFavorites }
    });
    if (error) throw new Error(error.message);
    if (data?.user) setUser(data.user);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, resetPassword, updatePassword, updateProfile, toggleFavorite }}>
      {children}
    </AuthContext.Provider>
  );
};
