// src/components/menu/menuDataManager.js
import { menuData as initialMenuData } from "./menuData";

export const getMenuData = () => {
  // Try to get admin-managed data first
  const adminItems = localStorage.getItem("adminMenuItems");

  if (adminItems) {
    const itemsArray = JSON.parse(adminItems);

    // Convert back to categorized structure for Menu.jsx
    return {
      appetizers: itemsArray.filter((item) => item.category === "appetizer"),
      mains: itemsArray.filter((item) => item.category === "main"),
      desserts: itemsArray.filter((item) => item.category === "dessert"),
      beverages: itemsArray.filter((item) => item.category === "drinks"),
    };
  }

  // Fall back to initial data
  return initialMenuData;
};

export const updateMenuData = (itemsArray) => {
  localStorage.setItem("adminMenuItems", JSON.stringify(itemsArray));
};

// Helper to get all items as flat array
export const getAllMenuItems = () => {
  const data = getMenuData();
  return [
    ...data.appetizers,
    ...data.mains,
    ...data.desserts,
    ...data.beverages,
  ];
};
