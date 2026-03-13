const Product = require('../models/Product');
const Category = require('../models/Category');

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
    const { q, page = 1, limit = 20 } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_QUERY', message: 'Search query is required' },
      });
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    const regex = new RegExp(q.trim(), 'i');
    const filter = {
      $or: [{ name: regex }, { description: regex }],
    };

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

    const regex = new RegExp('^' + q.trim(), 'i');
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

module.exports = { getCategories, getProducts, searchProducts, getSuggestions, getProductById };
