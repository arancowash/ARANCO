import { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authAPI, setAuthToken, setOnUnauthorized } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setOnUnauthorized(() => setUser(null));
    const loadUser = async () => {
      try {
        const token = await SecureStore.getItemAsync('authToken');
        const userData = await SecureStore.getItemAsync('userData');
        if (token && userData) {
          setAuthToken(token);
          const parsed = JSON.parse(userData);
          setUser({ ...parsed, isStaff: parsed.role === 'staff' });
          const meRes = await authAPI.getMe();
          const freshUser = meRes.data.data.user;
          await SecureStore.setItemAsync('userData', JSON.stringify(freshUser));
          setUser({ ...freshUser, isStaff: freshUser.role === 'staff' });
        }
      } catch {
        // A rejected token is cleared by the 401 interceptor; anything else here
        // is a network failure, so keep the cached session and let the app retry.
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { user: userData, token } = res.data.data;
    // Fetch fresh user data to ensure role is included
    setAuthToken(token);
    try {
      const meRes = await authAPI.getMe();
      const freshUser = meRes.data.data.user;
      await SecureStore.setItemAsync('authToken', token);
      await SecureStore.setItemAsync('userData', JSON.stringify(freshUser));
      setUser({ ...freshUser, isStaff: freshUser.role === 'staff' });
      return freshUser;
    } catch {
      await SecureStore.setItemAsync('authToken', token);
      await SecureStore.setItemAsync('userData', JSON.stringify(userData));
      setUser({ ...userData, isStaff: userData.role === 'staff' });
      return userData;
    }
  };

  const register = async (data) => {
    const res = await authAPI.register(data);
    const { user: userData, token } = res.data.data;
    setAuthToken(token);
    try {
      const meRes = await authAPI.getMe();
      const freshUser = meRes.data.data.user;
      await SecureStore.setItemAsync('authToken', token);
      await SecureStore.setItemAsync('userData', JSON.stringify(freshUser));
      setUser({ ...freshUser, isStaff: freshUser.role === 'staff' });
      return freshUser;
    } catch {
      await SecureStore.setItemAsync('authToken', token);
      await SecureStore.setItemAsync('userData', JSON.stringify(userData));
      setUser({ ...userData, isStaff: userData.role === 'staff' });
      return userData;
    }
  };

  const logout = async () => {
    setAuthToken(null);
    await SecureStore.deleteItemAsync('authToken');
    await SecureStore.deleteItemAsync('userData');
    setUser(null);
  };

  const updateUser = async (data) => {
    const res = await authAPI.updateProfile(data);
    const userData = res.data.data.user;
    await SecureStore.setItemAsync('userData', JSON.stringify(userData));
    setUser({ ...userData, isStaff: userData.role === 'staff' });
    return userData;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be within AuthProvider');
  return ctx;
};
