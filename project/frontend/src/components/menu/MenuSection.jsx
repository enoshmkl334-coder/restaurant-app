// src/components/menu/MenuSection.jsx
import React from "react";
import FoodCard from "./FoodCard";

const MenuSection = ({ title, items, handleOptionClick }) => {
  const sectionId = title.toLowerCase().replace(/\s+/g, "-");

  return (
    <section id={sectionId} className="mb-5">
      <h2 className="mb-4">{title}</h2>
      {items.length === 0 ? (
        <p className="text-white-50 fst-italic">
          No items available in this category yet.
        </p>
      ) : (
        <div className="row g-4">
          {items.map((item) => (
            <FoodCard
              key={item.id}
              item={item}
              handleOptionClick={handleOptionClick}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default MenuSection;
