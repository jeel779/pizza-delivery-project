const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');
const Inventory = require('../models/Inventory');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const items = [
  // Pizza Bases (5 options)
  { name: 'Thin Crust', category: 'base', stock: 50, price: 60, threshold: 20 },
  { name: 'Thick Crust', category: 'base', stock: 50, price: 70, threshold: 20 },
  { name: 'Cheese Burst Crust', category: 'base', stock: 50, price: 100, threshold: 20 },
  { name: 'Wheat Crust', category: 'base', stock: 50, price: 80, threshold: 20 },
  { name: 'Gluten-Free Crust', category: 'base', stock: 50, price: 90, threshold: 20 },

  // Sauces (5 options)
  { name: 'Classic Marinara', category: 'sauce', stock: 100, price: 20, threshold: 25 },
  { name: 'Basil Pesto', category: 'sauce', stock: 100, price: 30, threshold: 25 },
  { name: 'Garlic Parmesan Sauce', category: 'sauce', stock: 100, price: 35, threshold: 25 },
  { name: 'Spicy BBQ Sauce', category: 'sauce', stock: 100, price: 25, threshold: 25 },
  { name: 'Tangy Buffalo Sauce', category: 'sauce', stock: 100, price: 25, threshold: 25 },

  // Cheese types
  { name: 'Shredded Mozzarella', category: 'cheese', stock: 80, price: 50, threshold: 20 },
  { name: 'Sharp Cheddar', category: 'cheese', stock: 80, price: 55, threshold: 20 },
  { name: 'Aged Parmesan', category: 'cheese', stock: 80, price: 60, threshold: 20 },
  { name: 'Crumbled Feta', category: 'cheese', stock: 80, price: 65, threshold: 20 },
  { name: 'Daiya Vegan Cheese', category: 'cheese', stock: 80, price: 75, threshold: 20 },

  // Vegetables
  { name: 'Roma Tomatoes', category: 'vegetable', stock: 150, price: 15, threshold: 30 },
  { name: 'Red Onions', category: 'vegetable', stock: 150, price: 10, threshold: 30 },
  { name: 'Green Bell Peppers', category: 'vegetable', stock: 150, price: 15, threshold: 30 },
  { name: 'Sliced Mushrooms', category: 'vegetable', stock: 120, price: 25, threshold: 30 },
  { name: 'Black Olives', category: 'vegetable', stock: 120, price: 20, threshold: 30 },
  { name: 'Pickled Jalapenos', category: 'vegetable', stock: 120, price: 20, threshold: 30 },
  { name: 'Baby Spinach', category: 'vegetable', stock: 150, price: 15, threshold: 30 },
];

const seedDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/pizza-delivery';
    console.log(`Connecting to MongoDB at: ${mongoUri}`);
    
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected for seeding.');

    // Seed Inventory
    console.log('Clearing existing inventory items...');
    await Inventory.deleteMany({});
    
    console.log(`Seeding ${items.length} inventory items...`);
    await Inventory.insertMany(items);
    console.log('Inventory successfully seeded!');

    // Seed Admin Account
    console.log('Checking for Admin account...');
    const adminEmail = 'admin@pizza.com';
    const adminExists = await User.findOne({ email: adminEmail });

    if (!adminExists) {
      console.log('Creating admin account: admin@pizza.com...');
      await User.create({
        name: 'Pizza Store Admin',
        email: adminEmail,
        password: 'AdminPassword123',
        role: 'admin',
        isVerified: true,
      });
      console.log('Admin account created successfully! Password: AdminPassword123');
    } else {
      console.log('Admin account already exists.');
    }

    console.log('Database seeding process complete.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedDB();
