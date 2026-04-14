export interface Product {
  id: number;
  name: string;
  category: string;
  description: string;
  price: string;
  image: string;
  rating: number;
  reviews: number;
}

export const products: Product[] = [
  {
    id: 1,
    name: 'Vital Food',
    category: 'Nutrition',
    description: 'A complete nutritional powerhouse designed to boost your immune system and provide sustained daily energy.',
    price: 'Contact for Price',
    image: 'https://i.imgur.com/yeyqixt.jpeg',
    rating: 4.9,
    reviews: 128
  },
  {
    id: 2,
    name: 'Vital Fufu',
    category: 'Nutrition',
    description: 'A healthy, low-glycemic alternative to traditional fufu, perfect for maintaining balanced blood sugar levels.',
    price: 'Contact for Price',
    image: 'https://i.imgur.com/JG15JRL.jpeg',
    rating: 4.8,
    reviews: 95
  },
  {
    id: 3,
    name: 'Vital Buccal Care',
    category: 'Wellness',
    description: 'Natural oral care solution formulated to promote healthy gums, fresh breath, and overall dental hygiene.',
    price: 'Contact for Price',
    image: 'https://i.imgur.com/8vHvI92.jpeg',
    rating: 4.7,
    reviews: 64
  },
  {
    id: 4,
    name: 'Exotic Natural Drink',
    category: 'Beverage',
    description: 'A refreshing, antioxidant-rich beverage made from exotic fruits and herbs to revitalize your body.',
    price: 'Contact for Price',
    image: 'https://i.imgur.com/ZSc6wP5.jpeg',
    rating: 4.9,
    reviews: 210
  },
  {
    id: 5,
    name: 'Living Food',
    category: 'Nutrition',
    description: 'Raw, enzyme-rich superfoods carefully selected to support digestion and cellular regeneration.',
    price: 'Contact for Price',
    image: 'https://i.imgur.com/vRZYc2e.jpeg',
    rating: 5.0,
    reviews: 156
  },
  {
    id: 6,
    name: 'Vital Cacao Butter',
    category: 'Skincare',
    description: '100% pure, unrefined cacao butter that deeply moisturizes and nourishes your skin naturally.',
    price: 'Contact for Price',
    image: 'https://i.imgur.com/tEZ9NxT.jpeg',
    rating: 4.8,
    reviews: 112
  },
  {
    id: 7,
    name: 'Vital Coco Oil',
    category: 'Skincare & Nutrition',
    description: 'Premium cold-pressed coconut oil, versatile for both culinary use and natural skin/hair care routines.',
    price: 'Contact for Price',
    image: 'https://i.imgur.com/vFgg5G4.jpeg',
    rating: 4.9,
    reviews: 184
  }
];
