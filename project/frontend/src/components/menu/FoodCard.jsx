// src/components/menu/FoodCard.jsx
import React from "react";

// ✅ PHASE 1: React.memo - Prevents re-render if props haven't changed
const FoodCard = React.memo(({ item, handleOptionClick }) => {
  return (
    <div className="col-md-4 col-sm-6 col-6" id={item.id}>
      <div className="card h-100">
        <img
          src={item.image || item.image_url || "/image/placeholder.jpg"}
          className="card-img-top"
          alt={item.name}
          style={{ objectFit: "cover", height: 180 }}
        />
        <div className="card-body">
          <h5 className="card-title">{item.name}</h5>
          <p className="card-text">{item.description}</p>

          <div className="options-container">
            {item.options ? (
              item.options.map((option) => (
                <div
                  key={`${item.id}-${option.label}`}
                  className="option-box"
                  onClick={() =>
                    handleOptionClick(
                      item.id,
                      item.name,
                      option.price,
                      option.label
                    )
                  }
                >
                  <span>{option.label}</span>
                  <span className="price">Rs. {option.price}</span>
                </div>
              ))
            ) : (
              <div
                className="option-box"
                onClick={() =>
                  handleOptionClick(item.id, item.name, item.price)
                }
              >
                <span className="price">Rs. {item.price}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

// Add display name for debugging
FoodCard.displayName = 'FoodCard';

export default FoodCard;
