// src/components/Footer.jsx
import React from "react";
import { useUser } from "../contexts/UserContext";

const Footer = () => {
  const { user } = useUser();
  return (
    <footer>
      <div className="footer-content">
        <h3>{user?.restaurantName || "Himalayan Feast & Flavors"}</h3>
        <div className="footer-grid">
          <div>
            <p>&copy; 2025 Enosh's Restaurant</p>
            <p>Developed by Enosh</p>
          </div>
          <div>
            <p>Contact Us:</p>
            <p>
              Email:{" "}
              <a href="mailto:enosh.mkl334@gmail.com">enosh.mkl334@gmail.com</a>
            </p>
            <p>
              Phone: <a href="tel:+97798496623470">9845268042</a>
            </p>
          </div>
          <div>
            <p>Follow Us:</p>
            <p>
              <a
                href="https://www.facebook.com/enosh.tamang.33/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Facebook
              </a>{" "}
              |
              <a
                href="https://www.instagram.com/enoshlama64/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Instagram
              </a>
            </p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>Made by foodie to a foodie</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
