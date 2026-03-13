const mongoose = require('mongoose');
const env = require('./src/config/env');
const Category = require('./src/models/Category');
const Product = require('./src/models/Product');

const categories = [
  { name: 'Fruits & Vegetables', slug: 'fruits-vegetables' },
  { name: 'Dairy Products', slug: 'dairy-products' },
  { name: 'Healthcare', slug: 'healthcare' },
  { name: 'Easy Care', slug: 'easy-care' },
  { name: 'Beverages', slug: 'beverages' },
];

const img = (name) => `https://placehold.co/400x300/ff6b00/white?text=${encodeURIComponent(name)}`;

const productsByCategory = {
  'Fruits & Vegetables': [
    { name: 'Fresh Apples', description: 'Red apples, 1kg pack', price: 150, stock: 50, image: img('Fresh Apples') },
    { name: 'Banana', description: 'Yellow bananas, 1 dozen', price: 40, stock: 100, image: img('Banana') },
    { name: 'Tomato', description: 'Fresh red tomatoes, 500g', price: 30, stock: 80, image: img('Tomato') },
    { name: 'Onion', description: 'White onions, 1kg', price: 35, stock: 90, image: img('Onion') },
    { name: 'Potato', description: 'Fresh potatoes, 1kg', price: 25, stock: 120, image: img('Potato') },
  ],
  'Dairy Products': [
    { name: 'Amul Milk', description: 'Full cream milk, 1 litre', price: 65, stock: 60, image: img('Amul Milk') },
    { name: 'Curd', description: 'Fresh curd, 400g', price: 35, stock: 45, image: img('Curd') },
    { name: 'Paneer', description: 'Fresh paneer, 200g', price: 80, stock: 30, image: img('Paneer') },
    { name: 'Butter', description: 'Amul butter, 100g', price: 55, stock: 70, image: img('Butter') },
    { name: 'Cheese Slices', description: 'Cheese slices, 10 pack', price: 120, stock: 40, image: img('Cheese Slices') },
  ],
  'Healthcare': [
    { name: 'Hand Sanitizer', description: '200ml sanitizer', price: 99, stock: 100, image: img('Hand Sanitizer') },
    { name: 'Face Mask', description: 'Pack of 50 masks', price: 199, stock: 60, image: img('Face Mask') },
    { name: 'Vitamin C Tablets', description: '60 tablets', price: 250, stock: 35, image: img('Vitamin C') },
    { name: 'Band Aid', description: 'Box of 100', price: 85, stock: 50, image: img('Band Aid') },
    { name: 'Dettol Soap', description: 'Antibacterial soap, 75g', price: 45, stock: 80, image: img('Dettol Soap') },
  ],
  'Easy Care': [
    { name: 'Dish Wash Liquid', description: 'Vim liquid, 500ml', price: 99, stock: 55, image: img('Dish Wash') },
    { name: 'Floor Cleaner', description: 'Lizol, 1 litre', price: 160, stock: 40, image: img('Floor Cleaner') },
    { name: 'Detergent Powder', description: 'Surf Excel, 1kg', price: 180, stock: 45, image: img('Detergent') },
    { name: 'Toilet Cleaner', description: 'Harpic, 500ml', price: 110, stock: 50, image: img('Toilet Cleaner') },
    { name: 'Sponge Pack', description: 'Scrub sponge, 3 pack', price: 60, stock: 70, image: img('Sponge Pack') },
  ],
  'Beverages': [
    { name: 'Green Tea', description: 'Lipton green tea, 25 bags', price: 140, stock: 65, image: img('Green Tea') },
    { name: 'Coca Cola', description: '750ml bottle', price: 40, stock: 100, image: img('Coca Cola') },
    { name: 'Mango Juice', description: 'Maaza, 1 litre', price: 55, stock: 80, image: img('Mango Juice') },
    { name: 'Coffee Powder', description: 'Nescafe, 200g', price: 350, stock: 30, image: img('Coffee') },
    { name: 'Mineral Water', description: 'Bisleri, 1 litre', price: 20, stock: 150, image: img('Water') },
  ],
};

const seed = async () => {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('Connected to MongoDB');

    await Category.deleteMany({});
    await Product.deleteMany({});
    console.log('Cleared old data');

    const createdCategories = await Category.insertMany(categories);
    console.log(`Inserted ${createdCategories.length} categories`);

    const categoryMap = {};
    createdCategories.forEach((cat) => {
      categoryMap[cat.name] = cat._id;
    });

    const allProducts = [];
    for (const [catName, products] of Object.entries(productsByCategory)) {
      products.forEach((p) => {
        allProducts.push({
          ...p,
          slug: p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
          categoryId: categoryMap[catName],
        });
      });
    }

    const createdProducts = await Product.insertMany(allProducts);
    console.log(`Inserted ${createdProducts.length} products`);

    console.log('Seed complete!');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  }
};

seed();
