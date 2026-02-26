// src/components/Header.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import CartIcon from "./CartIcon"; // CHANGED from "../CartIcon" to "./CartIcon"
import { useUser } from "../contexts/UserContext";
import { useNavigate } from "react-router-dom";
import { navbarCategories } from "./menu/menuData"; // fallback static data
import { API_BASE, ENDPOINTS } from "../config/api";

const Header = () => {
  const { user, logout, loading: userLoading } = useUser();
  const navigate = useNavigate();

  const slugify = (s) => s.toLowerCase().replace(/\s+/g, "-");
  const initialNavFromStatic = (arr) =>
    arr.map((name) => ({ name, id: slugify(name) }));

  const [navCats, setNavCats] = useState({
    appetizers: initialNavFromStatic(navbarCategories.appetizers),
    mainCourse: initialNavFromStatic(navbarCategories.mainCourse),
    desserts: initialNavFromStatic(navbarCategories.desserts),
    beverages: initialNavFromStatic(navbarCategories.beverages),
  });

  useEffect(() => {
    // CRITICAL: Wait for user context to finish loading before fetching menu
    if (userLoading) {
      console.log("⏳ Header: Waiting for user context to load...");
      return; // Don't fetch until user data is restored
    }

    let mounted = true;

    async function loadCategories() {
      try {
        // Build URL with restaurantId if user is logged in
        const restaurantId = user?.restaurantId;
        const url = restaurantId
          ? `${API_BASE}${ENDPOINTS.MENU_ITEMS}?restaurantId=${restaurantId}`
          : `${API_BASE}${ENDPOINTS.MENU_ITEMS}`;

        console.log(`📥 Header: Loading categories from ${url}`);

        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const items = await res.json();

        // Group by backend category values used in Menu.jsx
        const categorized = {
          appetizers: items
            .filter((it) => it.category === "appetizer")
            .map((i) => ({ name: i.name, id: i.id || slugify(i.name) })),
          mainCourse: items
            .filter((it) => it.category === "main")
            .map((i) => ({ name: i.name, id: i.id || slugify(i.name) })),
          desserts: items
            .filter((it) => it.category === "dessert")
            .map((i) => ({ name: i.name, id: i.id || slugify(i.name) })),
          beverages: items
            .filter(
              (it) => it.category === "drinks" || it.category === "beverage",
            )
            .map((i) => ({ name: i.name, id: i.id || slugify(i.name) })),
        };

        if (mounted) setNavCats(categorized);
      } catch (e) {
        console.warn(
          "Could not load menu categories, using fallback:",
          e.message,
        );
      }
    }

    loadCategories();

    const handler = () => loadCategories();
    window.addEventListener("menu-updated", handler);

    return () => {
      mounted = false;
      window.removeEventListener("menu-updated", handler);
    };
  }, [userLoading, user?.restaurantId]);

  return (
    <nav className="navbar navbar-expand-lg bg-body-tertiary shadow sticky-top">
      <div className="container-fluid">
        <Link className="navbar-brand d-flex align-items-center" to="/">
          <img
            src="/image/logo.jpeg"
            alt="Logo"
            width="60"
            height="60"
            className="me-2"
          />
          <span className="fw-bold">
            {user?.restaurantName || "Himalayan Feast & Flavours"}
          </span>
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <a className="nav-link active" aria-current="page" href="#home">
                Home
              </a>
            </li>

            {/* Appetizers Dropdown */}
            <li className="nav-item dropdown">
              <a
                className="nav-link dropdown-toggle"
                href="#"
                role="button"
                data-bs-toggle="dropdown"
              >
                Appetizers
              </a>
              <ul className="dropdown-menu">
                {navCats.appetizers.map((item) => (
                  <li key={item.id}>
                    <a
                      className="dropdown-item"
                      href={`#${item.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        const el = document.getElementById(item.id);
                        if (el) {
                          el.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                          });
                          // close navbar on small screens
                          const toggler =
                            document.querySelector(".navbar-toggler");
                          const collapseEl =
                            document.getElementById("navbarNav");
                          if (
                            toggler &&
                            collapseEl &&
                            collapseEl.classList.contains("show")
                          ) {
                            toggler.click();
                          }
                        } else {
                          window.location.hash = item.id;
                        }
                      }}
                    >
                      {item.name}
                    </a>
                  </li>
                ))}
              </ul>
            </li>

            {/* Main Course Dropdown */}
            <li className="nav-item dropdown">
              <a
                className="nav-link dropdown-toggle"
                href="#"
                role="button"
                data-bs-toggle="dropdown"
              >
                Main Course
              </a>
              <ul className="dropdown-menu">
                {navCats.mainCourse.map((item) => (
                  <li key={item.id}>
                    <a
                      className="dropdown-item"
                      href={`#${item.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        const el = document.getElementById(item.id);
                        if (el) {
                          el.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                          });
                          const toggler =
                            document.querySelector(".navbar-toggler");
                          const collapseEl =
                            document.getElementById("navbarNav");
                          if (
                            toggler &&
                            collapseEl &&
                            collapseEl.classList.contains("show")
                          ) {
                            toggler.click();
                          }
                        } else {
                          window.location.hash = item.id;
                        }
                      }}
                    >
                      {item.name}
                    </a>
                  </li>
                ))}
              </ul>
            </li>

            {/* Desserts Dropdown */}
            <li className="nav-item dropdown">
              <a
                className="nav-link dropdown-toggle"
                href="#"
                role="button"
                data-bs-toggle="dropdown"
              >
                Desserts
              </a>
              <ul className="dropdown-menu">
                {navCats.desserts.map((item) => (
                  <li key={item.id}>
                    <a
                      className="dropdown-item"
                      href={`#${item.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        const el = document.getElementById(item.id);
                        if (el) {
                          el.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                          });
                          const toggler =
                            document.querySelector(".navbar-toggler");
                          const collapseEl =
                            document.getElementById("navbarNav");
                          if (
                            toggler &&
                            collapseEl &&
                            collapseEl.classList.contains("show")
                          ) {
                            toggler.click();
                          }
                        } else {
                          window.location.hash = item.id;
                        }
                      }}
                    >
                      {item.name}
                    </a>
                  </li>
                ))}
              </ul>
            </li>

            {/* Beverages Dropdown */}
            <li className="nav-item dropdown">
              <a
                className="nav-link dropdown-toggle"
                href="#"
                role="button"
                data-bs-toggle="dropdown"
              >
                Beverages
              </a>
              <ul className="dropdown-menu">
                {navCats.beverages.map((item) => (
                  <li key={item.id}>
                    <a
                      className="dropdown-item"
                      href={`#${item.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        const el = document.getElementById(item.id);
                        if (el) {
                          el.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                          });
                          const toggler =
                            document.querySelector(".navbar-toggler");
                          const collapseEl =
                            document.getElementById("navbarNav");
                          if (
                            toggler &&
                            collapseEl &&
                            collapseEl.classList.contains("show")
                          ) {
                            toggler.click();
                          }
                        } else {
                          window.location.hash = item.id;
                        }
                      }}
                    >
                      {item.name}
                    </a>
                  </li>
                ))}
              </ul>
            </li>

            <li className="nav-item">
              <CartIcon />
            </li>

            <li className="nav-item">
              {user ? (
                <div className="d-flex align-items-center gap-2">
                  <span className="text-dark">👤 {user.username}</span>
                  <button
                    className="btn btn-outline-danger btn-sm"
                    onClick={() => {
                      logout();
                      navigate("/");
                    }}
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <Link
                  className="nav-link btn btn-outline-primary text-dark ms-2"
                  to="/login"
                >
                  Login
                </Link>
              )}
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Header;
