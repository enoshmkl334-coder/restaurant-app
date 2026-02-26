import React, { createContext, useState, useContext, useMemo, useCallback } from "react";

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  // ✅ PHASE 1: useCallback - Memoize functions to prevent unnecessary re-renders
  const addToCart = useCallback((item) => {
    setCartItems((prev) => {
      const existingItem = prev.find(
        (i) => i.id === item.id && i.variant === item.variant
      );
      if (existingItem) {
        return prev.map((i) =>
          i.id === item.id && i.variant === item.variant
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      }
      return [...prev, { ...item, quantity: item.quantity }];
    });
  }, []); // No dependencies - uses functional setState

  const removeFromCart = useCallback((itemId, variant) => {
    setCartItems((prev) =>
      prev.filter((item) => !(item.id === itemId && item.variant === variant))
    );
  }, []); // No dependencies - uses functional setState

  const updateQuantity = useCallback((itemId, variant, newQuantity) => {
    if (newQuantity < 1) {
      setCartItems((prev) =>
        prev.filter((item) => !(item.id === itemId && item.variant === variant))
      );
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === itemId && item.variant === variant
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  }, []); // No dependencies - uses functional setState

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  // ✅ PHASE 1: useMemo - Only recalculate when cartItems changes
  const totalItems = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems]);

  const totalPrice = useMemo(() => {
    return cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
  }, [cartItems]);

  // ✅ PHASE 1: useMemo - Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalItems,
    totalPrice,
  }), [cartItems, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice]);

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};
