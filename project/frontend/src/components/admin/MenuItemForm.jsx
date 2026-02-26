// src/components/admin/MenuItemForm.jsx
import React, { useState, useEffect } from "react";
import ImageUploader from "./ImageUploader";

const MenuItemForm = ({ item, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: "",
    category: "appetizer",
    description: "",
    price: "",
    image: "",
    options: [{ label: "Standard", price: "" }],
  });

  const [errors, setErrors] = useState({});

  // Initialize form if editing existing item
  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || "",
        category: item.category || "appetizer",
        description: item.description || "",
        price: item.price || "",
        image: item.image || item.image_url || "",
        options: item.options || [
          { label: "Standard", price: item.price || "" },
        ],
      });
    }
  }, [item]);

  const categories = [
    { value: "appetizer", label: "Appetizers" },
    { value: "main", label: "Main Course" },
    { value: "dessert", label: "Desserts" },
    { value: "drinks", label: "Beverages" },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    // Clear error for this field
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
      });
    }
  };

  const handleVarietyChange = (index, field, value) => {
    const newOptions = [...formData.options];
    newOptions[index] = {
      ...newOptions[index],
      [field]: value,
    };
    setFormData({
      ...formData,
      options: newOptions,
    });
  };

  const addVariety = () => {
    setFormData({
      ...formData,
      options: [...formData.options, { label: "", price: "" }],
    });
  };

  const removeVariety = (index) => {
    if (formData.options.length > 1) {
      const newOptions = formData.options.filter((_, i) => i !== index);
      setFormData({
        ...formData,
        options: newOptions,
      });
    }
  };

  const handleImageUpload = (imageUrl) => {
    setFormData({
      ...formData,
      image: imageUrl,
    });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.description.trim())
      newErrors.description = "Description is required";
    if (!formData.image) newErrors.image = "Image is required";

    // Check variety options
    formData.options.forEach((option, index) => {
      if (!option.label.trim())
        newErrors[`optionLabel${index}`] = "Variety label required";
      if (!option.price || isNaN(option.price) || option.price <= 0) {
        newErrors[`optionPrice${index}`] = "Valid price required";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // In MenuItemForm.jsx - Update handleSubmit function:

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      // Convert price strings to numbers
      const processedOptions = formData.options.map((option) => ({
        ...option,
        price: Number(option.price),
      }));

      // Prepare final data - ALWAYS include options
      const finalData = {
        ...formData,
        id: item ? item.id : Date.now(),
        options: processedOptions, // Always include
        price: processedOptions[0].price,
      };

      // Keep Base64 images as-is; the admin flow will upload them to the server before saving

      console.log("📤 Submitting form data:", finalData);
      console.log("📤 Options being sent:", finalData.options); // Debug line

      onSave(finalData);
    }
  };
  return (
    <div className="form-overlay">
      <div className="form-container">
        <div className="form-header">
          <h3>{item ? "Edit Menu Item" : "Add New Menu Item"}</h3>
          <button className="close-btn" onClick={onCancel}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="name">Item Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                className="form-control"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Steamed Momo"
              />
              {errors.name && <span className="error-text">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="category">Category *</label>
              <select
                id="category"
                name="category"
                className="form-control"
                value={formData.category}
                onChange={handleChange}
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group full-width">
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              name="description"
              className="form-control"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the food item..."
              rows="3"
            />
            {errors.description && (
              <span className="error-text">{errors.description}</span>
            )}
          </div>

          <div className="form-group full-width">
            <label>Food Image *</label>
            <ImageUploader
              currentImage={formData.image}
              onImageUpload={handleImageUpload}
              useImagePath={true}
              currentCategory={formData.category}
            />
            {errors.image && <span className="error-text">{errors.image}</span>}
          </div>

          <div className="form-group full-width">
            <label>Variety & Pricing</label>
            <div className="variety-section">
              {formData.options.map((option, index) => (
                <div key={index} className="variety-item">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Variety (e.g., Veg, Chicken, Pork)"
                    value={option.label}
                    onChange={(e) =>
                      handleVarietyChange(index, "label", e.target.value)
                    }
                  />
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Price"
                    value={option.price}
                    onChange={(e) =>
                      handleVarietyChange(index, "price", e.target.value)
                    }
                    min="0"
                    step="1"
                  />
                  <button
                    type="button"
                    className="remove-variety"
                    onClick={() => removeVariety(index)}
                    disabled={formData.options.length === 1}
                  >
                    ×
                  </button>
                </div>
              ))}

              {errors.optionLabel0 && (
                <span className="error-text">{errors.optionLabel0}</span>
              )}
              {errors.optionPrice0 && (
                <span className="error-text">{errors.optionPrice0}</span>
              )}

              <button
                type="button"
                className="add-variety"
                onClick={addVariety}
              >
                <span>+</span> Add Variety
              </button>
              <p className="form-help">
                <small>
                  Add different varieties (e.g., Veg, Chicken) with different
                  prices.
                </small>
              </p>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="submit-btn">
              {item ? "Update Item" : "Add Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MenuItemForm;
