import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAuthMe, loginWithGoogle, loginDev, loginAdmin, getMyRegistration } from '../services/api';
import { signInWithGoogleFirebase } from '../config/firebase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [loading, setLoading] = useState(true);
  const [registrationState, setRegistrationState] = useState(null);
  const [error, setError] = useState('');

  const fetchUserData = async () => {
    try {
      if (!localStorage.getItem('token')) {
        setLoading(false);
        return;
      }
      const res = await getAuthMe();
      if (res.data.success) {
        const u = res.data.user;
        setUser({
          ...u,
          displayName: u.displayName || u.name,
          photoURL: u.photoURL || u.profilePhoto
        });
        await refreshRegistration();
      }
    } catch (err) {
      console.warn('[Auth Context] Token expired or invalid, logging out.');
      logout();
    } finally {
      setLoading(false);
    }
  };

  const refreshRegistration = async () => {
    try {
      const regRes = await getMyRegistration();
      if (regRes.data.success) {
        setRegistrationState(regRes.data);
      }
    } catch (err) {
      // Registration fetch warning silent
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const handleGoogleLogin = async () => {
    setError('');
    try {
      const fbResult = await signInWithGoogleFirebase();
      const { idToken, firebaseUser } = fbResult;

      // Verify domain before backend call
      if (!firebaseUser.email.endsWith('@klu.ac.in')) {
        const domainErr = 'Please sign in using your KLU (@klu.ac.in) Google account.';
        setError(domainErr);
        throw new Error(domainErr);
      }

      // Send credential to backend for JWT issue
      const res = await loginWithGoogle(idToken || firebaseUser.uid);
      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        setToken(res.data.token);

        const userData = {
          ...res.data.user,
          displayName: firebaseUser.displayName || res.data.user.displayName || res.data.user.name,
          photoURL: firebaseUser.photoURL || res.data.user.photoURL || res.data.user.profilePhoto
        };

        setUser(userData);
        await refreshRegistration();
        return res.data;
      }
    } catch (err) {
      if (err.message === 'Sign-in cancelled.') {
        throw err;
      }
      const errorMessage = err.response?.data?.message || err.message || 'Please sign in using your KLU (@klu.ac.in) Google account.';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const handleDevLogin = async (email) => {
    setError('');
    const normalizedEmail = (email || '').toLowerCase().trim();
    if (!normalizedEmail.endsWith('@klu.ac.in')) {
      const domainErr = 'Please sign in using your KLU (@klu.ac.in) Google account.';
      setError(domainErr);
      throw new Error(domainErr);
    }

    try {
      const res = await loginDev(normalizedEmail);
      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        setToken(res.data.token);
        const userData = {
          ...res.data.user,
          displayName: res.data.user.displayName || res.data.user.name,
          photoURL: res.data.user.photoURL || res.data.user.profilePhoto
        };
        setUser(userData);
        await refreshRegistration();
        return res.data;
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Please sign in using your KLU (@klu.ac.in) Google account.';
      setError(msg);
      throw new Error(msg);
    }
  };

  const handleAdminLogin = async (username, password) => {
    setError('');
    try {
      const res = await loginAdmin(username, password);
      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
        return res.data;
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid admin username or password.';
      setError(msg);
      throw new Error(msg);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
    setRegistrationState(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        registrationState,
        handleGoogleLogin,
        handleDevLogin,
        handleAdminLogin,
        refreshRegistration,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
