// src/components/QuantityModal.jsx
import React from "react";

const QuantityModal = ({
  show,
  onClose,
  selectedItem,
  quantity,
  setQuantity,
  onAddWithQuantity,
}) => {
  if (!show) return null;

  return (
    <div className="order-modal" style={{ display: "flex" }}>
      <div className="order-modal-content">
        <span className="close" onClick={onClose}>
          &times;
        </span>
        <h3>
          {selectedItem.variant
            ? `${selectedItem.name} (${selectedItem.variant})`
            : selectedItem.name}
        </h3>
        <p>Price: Rs. {selectedItem.price}</p>

        {/* Quantity Selector */}
        <div className="quantity-selector">
          <button
            className="btn btn-outline-secondary"
            onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
          >
            −
          </button>
          <span className="quantity-display">{quantity}</span>
          <button
            className="btn btn-outline-secondary"
            onClick={() => setQuantity((prev) => prev + 1)}
          >
            +
          </button>
        </div>

        <p className="mt-3">Total: Rs. {selectedItem.price * quantity}</p>

        <button className="btn btn-success mt-2" onClick={onAddWithQuantity}>
          Add {quantity} to Cart
        </button>
      </div>
    </div>
  );
};

export default QuantityModal;
