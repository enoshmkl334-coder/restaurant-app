import React, { createContext, useState, useContext, useEffect } from "react";

const UserContext = createContext();

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // NEW: Loading state

  useEffect(() => {
    // Check localStorage on initial load
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (error) {
        console.error("Error parsing user data:", error);
        localStorage.removeItem("user");
      }
    }
    setLoading(false); // Done loading
  }, []);

  const login = (userData) => {
    localStorage.setItem("user", JSON.stringify(userData));
    // Store token separately for easy access
    if (userData.token) {
      localStorage.setItem("token", userData.token);
    }
    setUser(userData);
  };

  const updateUser = (userData) => {
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    console.log("Logout called, removing user");
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <UserContext.Provider value={{ user, login, logout, updateUser, loading }}>
      {children}
    </UserContext.Provider>
  );
};
