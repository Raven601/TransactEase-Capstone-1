import { collection, doc, setDoc, getDocs, query, limit } from 'firebase/firestore';
import { db } from './firebase';

const SEED_MENU = [
  // Combo Meals
  { name: 'Chicken Dinner (Combo)', category: 'Combo Meals', price: 175, stock_quantity: 50, is_available: true },
  { name: 'Chicken Dinner (Solo)', category: 'Combo Meals', price: 140, stock_quantity: 50, is_available: true },
  { name: 'Porkchop Dinner (Combo)', category: 'Combo Meals', price: 175, stock_quantity: 50, is_available: true },
  { name: 'Porkchop Dinner (Solo)', category: 'Combo Meals', price: 140, stock_quantity: 50, is_available: true },
  { name: 'Executive Lunch, Chicken', category: 'Combo Meals', price: 160, stock_quantity: 50, is_available: true },
  { name: 'Executive Lunch, Porkchop', category: 'Combo Meals', price: 160, stock_quantity: 50, is_available: true },
  { name: 'Chicken Barbeque', category: 'Combo Meals', price: 160, stock_quantity: 50, is_available: true },
  { name: 'Pork Barbeque', category: 'Combo Meals', price: 155, stock_quantity: 50, is_available: true },
  { name: 'Junior Cheeseburger', category: 'Combo Meals', price: 120, stock_quantity: 50, is_available: true },
  { name: 'Super Cheeseburger', category: 'Combo Meals', price: 145, stock_quantity: 50, is_available: true },
  { name: 'Junior Cheeseburger & Spaghetti', category: 'Combo Meals', price: 155, stock_quantity: 50, is_available: true },
  { name: 'Chicken & Spaghetti', category: 'Combo Meals', price: 165, stock_quantity: 50, is_available: true },
  { name: 'Burger Steak', category: 'Combo Meals', price: 150, stock_quantity: 50, is_available: true },
  { name: 'Junior Burger Steak', category: 'Combo Meals', price: 125, stock_quantity: 50, is_available: true },
  { name: 'Seafood Platter', category: 'Combo Meals', price: 220, stock_quantity: 30, is_available: true },
  { name: 'Green Pepper Steak', category: 'Combo Meals', price: 180, stock_quantity: 30, is_available: true },
  { name: 'Fried Shrimp Platter', category: 'Combo Meals', price: 200, stock_quantity: 30, is_available: true },

  // Upgrade Options
  { name: 'Upgrade: Fried Rice', category: 'Rice & Sides', price: 25, stock_quantity: 100, is_available: true },
  { name: 'Upgrade: Garlic Rice', category: 'Rice & Sides', price: 25, stock_quantity: 100, is_available: true },
  { name: 'Upgrade: Pineapple Juice', category: 'Beverages', price: 30, stock_quantity: 100, is_available: true },
  { name: 'Upgrade: Mango Juice', category: 'Beverages', price: 30, stock_quantity: 100, is_available: true },
  { name: 'Upgrade: Orange Juice', category: 'Beverages', price: 30, stock_quantity: 100, is_available: true },

  // All Beef Burgers
  { name: 'Junior Burger (Regular)', category: 'Burgers', price: 75, stock_quantity: 50, is_available: true },
  { name: 'Junior Burger (With Cheese)', category: 'Burgers', price: 85, stock_quantity: 50, is_available: true },
  { name: 'Super Burger (Regular)', category: 'Burgers', price: 100, stock_quantity: 50, is_available: true },
  { name: 'Super Burger (With Cheese)', category: 'Burgers', price: 115, stock_quantity: 50, is_available: true },
  { name: 'Double Burger (Regular)', category: 'Burgers', price: 130, stock_quantity: 50, is_available: true },
  { name: 'Double Burger (With Cheese)', category: 'Burgers', price: 145, stock_quantity: 50, is_available: true },
  { name: 'Add Fries and Salad', category: 'Burgers', price: 40, stock_quantity: 100, is_available: true },

  // Soups & Salads
  { name: 'Hototay', category: 'Soups & Salads', price: 85, stock_quantity: 30, is_available: true },
  { name: 'Sotanghon Soup', category: 'Soups & Salads', price: 80, stock_quantity: 30, is_available: true },
  { name: 'Chicken Mami', category: 'Soups & Salads', price: 85, stock_quantity: 30, is_available: true },
  { name: 'Beef Mami', category: 'Soups & Salads', price: 90, stock_quantity: 30, is_available: true },
  { name: 'Bihon Soup', category: 'Soups & Salads', price: 80, stock_quantity: 30, is_available: true },
  { name: 'Lomi', category: 'Soups & Salads', price: 90, stock_quantity: 30, is_available: true },
  { name: "Chef's Salad", category: 'Soups & Salads', price: 95, stock_quantity: 30, is_available: true },
  { name: 'Green Salad', category: 'Soups & Salads', price: 80, stock_quantity: 30, is_available: true },

  // Noodles
  { name: 'Spaghetti in Beef Sauce', category: 'Noodles & Pasta', price: 95, stock_quantity: 40, is_available: true },
  { name: 'Spaghetti with Meatballs', category: 'Noodles & Pasta', price: 105, stock_quantity: 40, is_available: true },
  { name: 'Pancit Miki', category: 'Noodles & Pasta', price: 90, stock_quantity: 40, is_available: true },
  { name: 'Pancit Canton', category: 'Noodles & Pasta', price: 90, stock_quantity: 40, is_available: true },
  { name: 'Pancit Bihon', category: 'Noodles & Pasta', price: 90, stock_quantity: 40, is_available: true },
  { name: 'Pancit Palabok', category: 'Noodles & Pasta', price: 95, stock_quantity: 40, is_available: true },
  { name: 'Sotanghon Guisado', category: 'Noodles & Pasta', price: 90, stock_quantity: 40, is_available: true },

  // Deluxe Sandwiches
  { name: 'Clubhouse', category: 'Sandwiches', price: 110, stock_quantity: 30, is_available: true },
  { name: 'Ham & Cheese', category: 'Sandwiches', price: 95, stock_quantity: 30, is_available: true },
  { name: 'Ham & Egg', category: 'Sandwiches', price: 90, stock_quantity: 30, is_available: true },
  { name: 'BLT', category: 'Sandwiches', price: 100, stock_quantity: 30, is_available: true },
  { name: 'Bacon & Egg', category: 'Sandwiches', price: 100, stock_quantity: 30, is_available: true },
  { name: 'Creamy Chicken (Solo)', category: 'Sandwiches', price: 95, stock_quantity: 30, is_available: true },
  { name: 'Creamy Chicken (Double)', category: 'Sandwiches', price: 130, stock_quantity: 30, is_available: true },
  { name: 'Tuna Delight (Solo)', category: 'Sandwiches', price: 90, stock_quantity: 30, is_available: true },
  { name: 'Tuna Delight (Double)', category: 'Sandwiches', price: 125, stock_quantity: 30, is_available: true },

  // Breakfast
  { name: 'American Breakfast - Ham', category: 'Breakfast', price: 130, stock_quantity: 30, is_available: true },
  { name: 'American Breakfast - Bacon', category: 'Breakfast', price: 135, stock_quantity: 30, is_available: true },
  { name: 'Chicken & Pork Adobo', category: 'Breakfast', price: 115, stock_quantity: 30, is_available: true },

  // Short Orders
  { name: 'Fried Chicken (2 Pieces)', category: 'Short Orders', price: 150, stock_quantity: 40, is_available: true },
  { name: 'Fried Chicken (Half)', category: 'Short Orders', price: 200, stock_quantity: 20, is_available: true },
  { name: 'Kalderetang Baka', category: 'Short Orders', price: 160, stock_quantity: 30, is_available: true },
  { name: 'Sweet & Sour Shrimp', category: 'Short Orders', price: 180, stock_quantity: 30, is_available: true },
  { name: 'Camaron (Shrimp)', category: 'Short Orders', price: 175, stock_quantity: 30, is_available: true },
  { name: 'Pork Sisig', category: 'Short Orders', price: 130, stock_quantity: 40, is_available: true },
  { name: 'Shanghai Lumpia', category: 'Short Orders', price: 110, stock_quantity: 40, is_available: true },
  { name: 'Pork Sinigang', category: 'Short Orders', price: 150, stock_quantity: 30, is_available: true },
  { name: 'Lechon Kawali', category: 'Short Orders', price: 160, stock_quantity: 30, is_available: true },
  { name: 'Sweet & Sour Pork', category: 'Short Orders', price: 150, stock_quantity: 30, is_available: true },
  { name: 'Chopsuey', category: 'Short Orders', price: 140, stock_quantity: 30, is_available: true },
  { name: 'Shrimp Fu Yong', category: 'Short Orders', price: 160, stock_quantity: 30, is_available: true },
  { name: 'Chicken Fu Yong', category: 'Short Orders', price: 150, stock_quantity: 30, is_available: true },

  // Rice & Sides
  { name: 'French Fries', category: 'Rice & Sides', price: 65, stock_quantity: 100, is_available: true },
  { name: 'Potato Salad', category: 'Rice & Sides', price: 60, stock_quantity: 50, is_available: true },
  { name: 'Shanghai Fried Rice', category: 'Rice & Sides', price: 80, stock_quantity: 50, is_available: true },
  { name: 'Fried Rice', category: 'Rice & Sides', price: 50, stock_quantity: 100, is_available: true },
  { name: 'Garlic Rice', category: 'Rice & Sides', price: 50, stock_quantity: 100, is_available: true },
  { name: 'Plain Rice (Cup)', category: 'Rice & Sides', price: 25, stock_quantity: 200, is_available: true },
  { name: 'Plain Rice (Whole)', category: 'Rice & Sides', price: 80, stock_quantity: 50, is_available: true },

  // Beverages
  { name: 'Iced Tea', category: 'Beverages', price: 45, stock_quantity: 100, is_available: true },
  { name: 'Softdrinks (Cup)', category: 'Beverages', price: 35, stock_quantity: 100, is_available: true },
  { name: 'Softdrinks (Can)', category: 'Beverages', price: 50, stock_quantity: 100, is_available: true },
  { name: 'Instant Coffee', category: 'Beverages', price: 30, stock_quantity: 100, is_available: true },
  { name: 'Pineapple Juice', category: 'Beverages', price: 45, stock_quantity: 100, is_available: true },
  { name: 'Mango Juice', category: 'Beverages', price: 45, stock_quantity: 100, is_available: true },
  { name: 'Orange Juice', category: 'Beverages', price: 45, stock_quantity: 100, is_available: true },
  { name: 'Hot Milo', category: 'Beverages', price: 40, stock_quantity: 100, is_available: true },
  { name: 'San Miguel Beer', category: 'Beverages', price: 70, stock_quantity: 50, is_available: true },
  { name: 'San Miguel Light', category: 'Beverages', price: 70, stock_quantity: 50, is_available: true },

  // Ice Cream Delights
  { name: 'Banana Split', category: 'Ice Cream Delights', price: 120, stock_quantity: 30, is_available: true },
  { name: 'Chocolate Sundae', category: 'Ice Cream Delights', price: 85, stock_quantity: 40, is_available: true },
  { name: 'Strawberry Sundae', category: 'Ice Cream Delights', price: 85, stock_quantity: 40, is_available: true },
  { name: 'Ice Cream Shake', category: 'Ice Cream Delights', price: 100, stock_quantity: 40, is_available: true },
  { name: 'Ice Cream Scoop', category: 'Ice Cream Delights', price: 55, stock_quantity: 60, is_available: true },
];

export const menuSeedService = {
  isAlreadySeeded: async () => {
    try {
      const snap = await getDocs(query(collection(db, 'products'), limit(1)));
      return !snap.empty;
    } catch {
      return false;
    }
  },

  seedMenu: async () => {
    const now = new Date();
    let seeded = 0;
    for (const item of SEED_MENU) {
      const ref = doc(collection(db, 'products'));
      await setDoc(ref, {
        ...item,
        created_at: now,
        updated_at: now,
      });
      seeded++;
    }
    return seeded;
  },
};
