const Product = require('../models/Product');
const Category = require('../models/Category');
const { broadcastCatalogUpdate } = require('../websocket/deliverySocket');

// GET /api/v1/categories
const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json({ success: true, data: { categories } });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/products?category=&page=&limit=&sort=
const getProducts = async (req, res, next) => {
  try {
    const { category, page = 1, limit = 20, sort } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    const filter = {};
    if (category) {
      const cat = await Category.findOne({ slug: category });
      if (cat) filter.categoryId = cat._id;
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'price_asc') sortOption = { price: 1 };
    else if (sort === 'price_desc') sortOption = { price: -1 };

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('categoryId', 'name slug')
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum),
      Product.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/products/search?q=&page=&limit=
const searchProducts = async (req, res, next) => {
  try {
    const { q, _escapedQ, page = 1, limit = 20 } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_QUERY', message: 'Search query is required' },
      });
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    const regex = new RegExp(_escapedQ || q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const filter = { name: regex };

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('categoryId', 'name slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Product.countDocuments(filter),
    ]);

    // Save search history if user is authenticated
    if (req.user) {
      const SearchHistory = require('../models/SearchHistory');
      await SearchHistory.findOneAndUpdate(
        { userId: req.user._id, query: q.trim().toLowerCase() },
        { searchedAt: new Date() },
        { upsert: true }
      );
    }

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/products/suggestions?q=&limit=
const getSuggestions = async (req, res, next) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || q.trim().length === 0) {
      return res.json({ success: true, data: { suggestions: [] } });
    }

    const escaped = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp('^' + escaped, 'i');
    const limitNum = Math.min(10, Math.max(1, parseInt(limit) || 10));

    const products = await Product.find({ name: regex })
      .select('name slug')
      .limit(limitNum);

    const suggestions = products.map((p) => ({ name: p.name, slug: p.slug }));

    res.json({ success: true, data: { suggestions } });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/products/:id
const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate('categoryId', 'name slug');

    if (!product) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Product not found' },
      });
    }

    res.json({ success: true, data: { product } });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/products/bulk (admin)
const createBulkProducts = async (req, res, next) => {
  try {
    const { categoryName, products } = req.body;

    if (!categoryName || !products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_FIELDS', message: 'Category name and at least one product are required' },
      });
    }

    if (products.length > 50) {
      return res.status(400).json({
        success: false,
        error: { code: 'TOO_MANY', message: 'Maximum 50 products per batch' },
      });
    }

    for (let i = 0; i < products.length; i++) {
      if (!products[i].name || products[i].price === undefined || products[i].price === null) {
        return res.status(400).json({
          success: false,
          error: { code: 'MISSING_FIELDS', message: `Product #${i + 1}: name and price are required` },
        });
      }
    }

    const categorySlug = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    let category = await Category.findOne({ slug: categorySlug });
    if (!category) {
      category = await Category.create({ name: categoryName, slug: categorySlug });
    }

    const productDocs = products.map((p) => ({
      name: p.name,
      slug: p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      description: p.description || '',
      price: Number(p.price),
      stock: p.stock ? Number(p.stock) : 0,
      image: p.image || null,
      categoryId: category._id,
    }));

    const created = await Product.insertMany(productDocs);
    broadcastCatalogUpdate();

    res.status(201).json({
      success: true,
      data: { category, products: created, count: created.length },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/products (admin)
const createProduct = async (req, res, next) => {
  try {
    const { name, description, price, stock, image, categoryName } = req.body;

    if (!name || price === undefined || price === null || !categoryName) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_FIELDS', message: 'Name, price, and category are required' },
      });
    }

    const categorySlug = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    let category = await Category.findOne({ slug: categorySlug });
    if (!category) {
      category = await Category.create({ name: categoryName, slug: categorySlug });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const product = await Product.create({
      name,
      slug,
      description: description || '',
      price: Number(price),
      stock: stock ? Number(stock) : 0,
      image: image || null,
      categoryId: category._id
    });

    broadcastCatalogUpdate();
    res.status(201).json({ success: true, data: { product } });
  } catch (error) {
    next(error);
  }
};

// PUT /api/v1/products/:id (admin)
const updateProduct = async (req, res, next) => {
  try {
    const { name, description, price, stock, image, categoryName } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Product not found' },
      });
    }

    if (categoryName) {
      const categorySlug = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      let category = await Category.findOne({ slug: categorySlug });
      if (!category) {
        category = await Category.create({ name: categoryName, slug: categorySlug });
      }
      product.categoryId = category._id;
    }

    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = price;
    if (stock !== undefined) product.stock = stock;
    if (image !== undefined) product.image = image;

    await product.save();
    broadcastCatalogUpdate();

    res.json({ success: true, data: { product } });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/v1/products/:id (admin)
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Product not found' },
      });
    }

    broadcastCatalogUpdate();
    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/products/bulk-json (admin)
const createBulkJsonProducts = async (req, res, next) => {
  try {
    const { categories } = req.body;

    if (!Array.isArray(categories) || categories.length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_FORMAT', message: 'Expected an array of categories with products' },
      });
    }

    let totalCreated = 0;
    const results = [];

    for (let c = 0; c < categories.length; c++) {
      const entry = categories[c];

      if (!entry.category || !Array.isArray(entry.productsList) || entry.productsList.length === 0) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_FORMAT', message: `Category entry #${c + 1}: 'category' and 'productsList' are required` },
        });
      }

      if (entry.productsList.length > 50) {
        return res.status(400).json({
          success: false,
          error: { code: 'TOO_MANY', message: `Category "${entry.category}": maximum 50 products per category` },
        });
      }

      for (let i = 0; i < entry.productsList.length; i++) {
        const p = entry.productsList[i];
        if (!p.name || p.price === undefined || p.price === null) {
          return res.status(400).json({
            success: false,
            error: { code: 'MISSING_FIELDS', message: `Category "${entry.category}", Product #${i + 1}: name and price are required` },
          });
        }
      }

      const categorySlug = entry.category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      let category = await Category.findOne({ slug: categorySlug });
      if (!category) {
        category = await Category.create({ name: entry.category, slug: categorySlug });
      }

      const productDocs = entry.productsList.map((p) => ({
        name: p.name,
        slug: p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        description: p.description || '',
        price: Number(p.price),
        stock: p.stock ? Number(p.stock) : 0,
        image: p.imageUrl || p.image || null,
        categoryId: category._id,
      }));

      const created = await Product.insertMany(productDocs);
      totalCreated += created.length;
      results.push({ category: entry.category, productsCreated: created.length });
    }

    broadcastCatalogUpdate();
    res.status(201).json({
      success: true,
      data: { totalCreated, categories: results },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getCategories, getProducts, searchProducts, getSuggestions, getProductById, createProduct, createBulkProducts, createBulkJsonProducts, updateProduct, deleteProduct };
