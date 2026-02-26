// src/components/HomeSection.jsx
import React from "react";
import { useUser } from "../contexts/UserContext";

const HomeSection = () => {
  const { user } = useUser();
  const categories = [
    {
      name: "Appetizers",
      image: "/image/appetizer.jpeg",
      link: "#appetizers",
    },
    {
      name: "Main Course",
      image: "/image/main.jpeg",
      link: "#main-course",
    },
    {
      name: "Desserts",
      image: "/image/dessert.jpeg",
      link: "#desserts",
    },
    {
      name: "Beverages",
      image: "/image/beverage.jpeg",
      link: "#beverages",
    },
  ];

  return (
    <section id="home" className="home-section text-white">
      <div className="container text-center py-5">
        <h1 className="display-4 fw-bold">
          {user?.restaurantName || "Himalayan Feast & Flavors"}
        </h1>
        <p className="lead">
          {user?.restaurantId === 2
            ? "The Taste of Heaven • Traditional Recipes with a Modern Twist"
            : "A Taste of the Himalayas • Traditional Recipes with a Modern Twist"}
        </p>

        <div className="row mt-5 g-4">
          {categories.map((category) => (
            <div key={category.name} className="col-6 col-sm-6 col-md-3">
              <a
                href={category.link}
                className="home-card text-decoration-none text-white"
              >
                <div className="card bg-dark text-white">
                  <img
                    src={category.image}
                    className="card-img"
                    alt={category.name}
                    height="190"
                  />
                  <div className="card-img-overlay d-flex align-items-center justify-content-center">
                    <h5 className="card-title">{category.name}</h5>
                  </div>
                </div>
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HomeSection;
