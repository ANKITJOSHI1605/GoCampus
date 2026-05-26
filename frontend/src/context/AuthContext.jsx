import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage for persistent JWT payload
    const storedUser = localStorage.getItem('gocampus_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error('Failed to parse user session', err);
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5005' : '')}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        throw new Error(`API returned invalid data (not JSON). Status: ${response.status}`);
      }
      const data = await response.json();
      
      if (!response.ok) {
         throw new Error(data.message || 'Login failed');
      }

      setUser(data);
      localStorage.setItem('gocampus_user', JSON.stringify(data));
      return data;
      
    } catch (error) {
       throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('gocampus_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
