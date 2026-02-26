// src/pages/Menu.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useCart } from "../contexts/CartContext";
import { useUser } from "../contexts/UserContext";
import Header from "../components/Header";
import HomeSection from "../components/HomeSection";
import Footer from "../components/Footer";
import QuantityModal from "../components/QuantityModal";
import MenuSection from "../components/menu/MenuSection";
import { API_BASE, ENDPOINTS } from "../config/api";
import "../styles/menu.css";

function Menu() {
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);
  const { addToCart } = useCart();
  const { user, loading: userLoading } = useUser();
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState({
    name: "",
    price: 0,
    variant: "",
  });
  const [quantity, setQuantity] = useState(1);
  const [menuLoading, setMenuLoading] = useState(true);
  const [menuData, setMenuData] = useState({
    appetizers: [],
    mains: [],
    desserts: [],
    beverages: [],
  });

  useEffect(() => {
    // Wait for user context to finish loading before fetching menu
    if (userLoading) {
      console.log("⏳ Waiting for user context to load...");
      return;
    }

    const loadMenuFromDatabase = async () => {
      try {
        console.log("📥 Loading menu from database...");
        setMenuLoading(true);

        // Clear existing data immediately to avoid showing stale items
        setMenuData({ appetizers: [], mains: [], desserts: [], beverages: [] });

        const restaurantId = user?.restaurantId ?? null;
        const url = restaurantId
          ? `${API_BASE}${ENDPOINTS.MENU_ITEMS}?restaurantId=${restaurantId}`
          : `${API_BASE}${ENDPOINTS.MENU_ITEMS}`;

        console.log(`🔎 Fetching menu with url=${url} restaurantId=${restaurantId}`);

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const rawItems = await response.json();

        // Normalize each item: ensure `image` property is present
        const items = rawItems.map((it) => ({
          ...it,
          image: it.image || it.image_url || "/image/placeholder.jpg",
        }));

        console.log(`✅ Loaded ${items.length} items from database`);

        const categorized = {
          appetizers: items.filter((item) => item.category === "appetizer"),
          mains: items.filter((item) => item.category === "main"),
          desserts: items.filter((item) => item.category === "dessert"),
          beverages: items.filter((item) => item.category === "drinks"),
        };

        console.log("📊 Categories:", {
          appetizers: categorized.appetizers.length,
          mains: categorized.mains.length,
          desserts: categorized.desserts.length,
          beverages: categorized.beverages.length,
        });

        setMenuData(categorized);
      } catch (error) {
        console.error("❌ Error loading menu from database:", error);
        console.log("⚠️ Falling back to empty menu data");
        setMenuData({ appetizers: [], mains: [], desserts: [], beverages: [] });
      } finally {
        setMenuLoading(false);
      }
    };

    loadMenuFromDatabase();
  }, [userLoading, user?.restaurantId]);

  // ✅ Memoize handleOptionClick to prevent FoodCard re-renders
  const handleOptionClick = useCallback((menuItemId, itemName, price, variant = "") => {
    setSelectedItem({ menuItemId, name: itemName, price, variant });
    setQuantity(1);
    setShowQuantityModal(true);
  }, []);

  const handleAddWithQuantity = () => {
    const itemId = `${selectedItem.menuItemId || selectedItem.name}-${selectedItem.variant}`
      .toLowerCase()
      .replace(/\s+/g, "-");

    const cartItem = {
      id: itemId,
      menuItemId: selectedItem.menuItemId,
      name: selectedItem.variant
        ? `${selectedItem.name} (${selectedItem.variant})`
        : selectedItem.name,
      variant: selectedItem.variant || "Standard",
      price: selectedItem.price,
      quantity: quantity,
    };

    addToCart(cartItem);
    setShowQuantityModal(false);
    // Note: toast icon is rendered in JSX — no emoji needed in the message string
    showNotification(`${quantity}x ${cartItem.name} added to cart!`);
  };

  const showNotification = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Navbar scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const navbar = document.querySelector(".navbar");
      if (!navbar) return; // null guard: navbar may not be mounted yet
      if (window.scrollY > 50) {
        navbar.classList.add("scrolled");
      } else {
        navbar.classList.remove("scrolled");
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <Header />

      {/* Toast Notification */}
      {showToast && (
        <div className="toast-notification">
          <div className="toast-content">
            <span className="toast-icon">✅</span>
            <span className="toast-message">{toastMessage}</span>
          </div>
        </div>
      )}

      <HomeSection />

      <section className="menu-section">
        <main className="container my-5">
          {menuLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-light" role="status">
                <span className="visually-hidden">Loading menu...</span>
              </div>
              <p className="text-white mt-3">Loading menu, please wait…</p>
            </div>
          ) : (
            <>
              <MenuSection
                title="Appetizers"
                items={menuData.appetizers}
                handleOptionClick={handleOptionClick}
              />
              <MenuSection
                title="Main Course"
                items={menuData.mains}
                handleOptionClick={handleOptionClick}
              />
              <MenuSection
                title="Desserts"
                items={menuData.desserts}
                handleOptionClick={handleOptionClick}
              />
              <MenuSection
                title="Beverages"
                items={menuData.beverages}
                handleOptionClick={handleOptionClick}
              />
            </>
          )}
        </main>
      </section>

      <Footer />

      <QuantityModal
        show={showQuantityModal}
        onClose={() => setShowQuantityModal(false)}
        selectedItem={selectedItem}
        quantity={quantity}
        setQuantity={setQuantity}
        onAddWithQuantity={handleAddWithQuantity}
      />
    </>
  );
}

export default Menu;
