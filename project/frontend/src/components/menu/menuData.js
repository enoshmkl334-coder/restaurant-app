// src/components/menu/menuData.js
export const menuData = {
  appetizers: [
    {
      id: "steamed-momo",
      name: "Steamed Momo",
      description:
        "Soft steamed dumplings filled with minced chicken, served with achar.",
      image: "/image/stem momo.jpeg",
      options: [
        { label: "Veg", price: 70 },
        { label: "Chicken", price: 140 },
        { label: "Pork", price: 200 },
        { label: "Buffalo", price: 120 },
      ],
    },
    {
      id: "jhol-momo",
      name: "Jhol Momo",
      description: "Steamed momo served in spicy, tangy tomato-based soup.",
      image: "/image/jhol momo.jpeg",
      options: [
        { label: "Veg", price: 70 },
        { label: "Chicken", price: 140 },
        { label: "Pork", price: 200 },
        { label: "Buffalo", price: 120 },
      ],
    },
    {
      id: "fried-momo",
      name: "Fried Momo",
      description: "Crispy deep-fried dumplings with a crunchy exterior.",
      image: "/image/f momo.jpeg",
      options: [
        { label: "Veg", price: 80 },
        { label: "Chicken", price: 150 },
        { label: "Pork", price: 210 },
        { label: "Buffalo", price: 130 },
      ],
    },
    {
      id: "chili-momo",
      name: "C-Momo",
      description: "Fried or steamed momo tossed in spicy chili sauce.",
      image: "/image/c momo.jpeg",
      options: [
        { label: "Veg", price: 100 },
        { label: "Chicken", price: 200 },
        { label: "Pork", price: 300 },
        { label: "Buffalo", price: 180 },
      ],
    },
    {
      id: "sekuwa",
      name: "Sekuwa",
      description: "Grilled meat skewers marinated in spices.",
      image: "/image/sekuwa.jpeg",
      options: [
        { label: "Chicken", price: 150 },
        { label: "Pork", price: 200 },
        { label: "Buffalo", price: 120 },
      ],
    },
    {
      id: "chhoyela",
      name: "Chhoyela",
      description: "Spicy grilled buffalo meat tossed in mustard oil.",
      image: "/image/choila.jpg",
      price: 150,
    },
    {
      id: "vegetable-pakora",
      name: "Vegetable Pakora",
      description: "Deep-fried veggie fritters, crispy and golden.",
      image: "/image/pakoda.jpeg",
      price: 50,
    },
  ],

  mains: [
    {
      id: "dal-bhat",
      name: "Dal Bhat",
      description:
        "Traditional Nepali steamed rice served with lentil soup and vegetable curry.",
      image: "/image/dal bhat.jpeg",
      options: [
        { label: "Regular", price: 150 },
        { label: "With Chicken", price: 250 },
        { label: "With Pork", price: 350 },
        { label: "With Buffalo", price: 200 },
      ],
    },
    {
      id: "thukpa",
      name: "Thukpa",
      description: "Hot noodle soup with vegetables and your choice of meat.",
      image: "/image/thukpa.jpeg",
      options: [
        { label: "Veg", price: 80 },
        { label: "Chicken", price: 150 },
        { label: "Pork", price: 200 },
        { label: "Buffalo", price: 120 },
      ],
    },
    {
      id: "dhedo",
      name: "Dhedo",
      description:
        "Traditional buckwheat or millet porridge, served with gundruk, meat, or vegetable curry.",
      image: "/image/dhedo.jpg",
      options: [
        { label: "With Dal", price: 250 },
        { label: "With Bhat", price: 250 },
        { label: "With Meat Curry", price: 350 },
        { label: "With Vegetable Curry", price: 300 },
      ],
    },
  ],

  desserts: [
    {
      id: "yomari",
      name: "Yomari",
      description: "Sweet rice flour dumplings filled with jaggery and sesame.",
      image: "/image/yomari.jpg",
      price: 50,
    },
    {
      id: "kheer",
      name: "Kheer",
      description: "Sweet rice pudding made with milk, sugar, and nuts.",
      image: "/image/kheer.jpeg",
      price: 80,
    },
    {
      id: "juju-dhau",
      name: "Juju Dhau",
      description: "Rich and creamy yogurt from Bhaktapur.",
      image: "/image/juju dhau.jpg",
      price: 80,
    },
    {
      id: "lal-mohan",
      name: "Lal Mohan",
      description: "Fried sweet balls soaked in sugar syrup.",
      image: "/image/lal mohan.jpg",
      price: 50,
    },
  ],

  beverages: [
    {
      id: "masala-chiya",
      name: "Masala Chiya",
      description: "Spiced Nepali milk tea.",
      image: "/image/masala chiya.jpg",
      price: 50,
    },
    {
      id: "tongba",
      name: "Tongba",
      description: "Millet-based alcoholic drink, traditional and served warm.",
      image: "/image/tongba.jpg",
      price: 500,
    },
    {
      id: "lassi",
      name: "Lassi",
      description: "Sweet or salty yogurt drink.",
      image: "/image/lassi.jpg",
      price: 100,
    },
  ],
};

// For navbar dropdowns
export const navbarCategories = {
  appetizers: [
    "Steamed Momo",
    "Jhol Momo",
    "Fried Momo",
    "Chili Momo",
    "Sekuwa",
    "Chhoyela",
    "Vegetable Pakora",
  ],
  mainCourse: ["Dal Bhat", "Thukpa", "Dhedo"],
  desserts: ["Yomari", "Kheer", "Juju Dhau", "Lal Mohan"],
  beverages: ["Masala Chiya", "Tongba", "Lassi"],
};
