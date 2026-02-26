// src/components/admin/ImageUploader.jsx
import React, { useState, useEffect, useRef } from "react";

const ImageUploader = ({
  currentImage,
  onImageUpload,
  useImagePath = false,
  currentCategory = "appetizer",
}) => {
  const [preview, setPreview] = useState(currentImage);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef(null);
  const uniqueIdRef = useRef(
    "image-upload-" + Math.random().toString(36).slice(2)
  );

  // Update preview when parent changes currentImage
  useEffect(() => {
    setPreview(currentImage);
  }, [currentImage]);

  // Resize image using canvas to keep upload sizes reasonable (landscape-friendly)
  const resizeImage = (file, maxWidth = 800, maxHeight = 600, quality = 0.8) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();
      reader.onload = (e) => (img.src = e.target.result);
      reader.onerror = (e) => reject(e);
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            const reader2 = new FileReader();
            reader2.onloadend = () => resolve(reader2.result);
            reader2.onerror = (err) => reject(err);
            reader2.readAsDataURL(blob);
          },
          "image/jpeg",
          quality
        );
      };
      reader.readAsDataURL(file);
    });

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    // clear the file input value so re-selecting same filename triggers change
    if (inputRef.current) inputRef.current.value = null;

    if (!file) return;

    // Check file type
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file");
      return;
    }

    setIsUploading(true);

    try {
      // Resize to keep size down
      const resizedDataUrl = await resizeImage(file, 800, 800, 0.8);

      // Safety: if still too large, warn and allow user to cancel
      const approxBytes = (resizedDataUrl.length * 3) / 4;
      if (approxBytes > 1.5 * 1024 * 1024) {
        if (
          !window.confirm(
            "Image is still large after resizing (>1.5MB). Continue with upload?"
          )
        ) {
          setIsUploading(false);
          return;
        }
      }

      setPreview(resizedDataUrl);
      onImageUpload(resizedDataUrl);

      // Clear the file input value after processing
      if (inputRef.current) inputRef.current.value = null;

      // Warn for large images
      if (resizedDataUrl.length > 100000) {
        console.warn(
          "⚠️ Large Base64 image detected. Consider using a hosted image instead."
        );
      }
    } catch (err) {
      console.error("Image processing failed:", err);
      alert("Failed to process image. Please try a different file.");
    } finally {
      setIsUploading(false);
    }
  };

  const useSampleImage = () => {
    const category = currentCategory || "appetizer";

    const categoryImages = {
      appetizer: "/image/f momo.jpeg",
      main: "/image/dal bhat.jpeg",
      dessert: "/image/yomari.jpg",
      drinks: "/image/masala chiya.jpg",
    };

    const sampleImage = categoryImages[category] || "/image/stem momo.jpeg";

    setPreview(sampleImage);
    onImageUpload(sampleImage); // Send PATH, not Base64
    alert(`Using sample image for ${category}`);
  };

  return (
    <div className="image-upload">
      <input
        ref={inputRef}
        id={uniqueIdRef.current}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        onClick={(e) => (e.target.value = null)}
        style={{ display: "none" }}
      />

      {preview ? (
        <div className="image-preview">
          <img
            src={preview}
            alt="Preview"
            style={{ maxWidth: "100%", maxHeight: 180, objectFit: "cover" }}
          />
          <div style={{ marginTop: "10px" }}>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={() => inputRef.current && inputRef.current.click()}
            >
              Change Image
            </button>
          </div>
        </div>
      ) : (
        <div
          className="upload-placeholder"
          onClick={() => inputRef.current && inputRef.current.click()}
        >
          <div>📷</div>
          <p>Click to upload food image</p>
          <p className="text-muted">or</p>
          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={useSampleImage}
          >
            Use Sample Image
          </button>
        </div>
      )}

      {isUploading && <p>Uploading...</p>}
    </div>
  );
};

export default ImageUploader;
