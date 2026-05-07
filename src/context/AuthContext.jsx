import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { AuthContext } from './authContext';

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

  const updateProfile = async (data) => {
    const { error } = await supabase.auth.updateUser({ data });
    if (error) throw new Error(error.message);
    setUser((prev) => ({ ...prev, user_metadata: { ...prev.user_metadata, ...data } }));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, resetPassword, updatePassword, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
