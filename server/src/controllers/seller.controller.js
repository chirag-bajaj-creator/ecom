const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const env = require('../config/env');
const { broadcastCatalogUpdate } = require('../websocket/deliverySocket');
const { matchImagesToProducts } = require('../utils/imageMapper');

// GET /api/v1/seller/products
const getSellerProducts = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
    const skip = (pageNum - 1) * limitNum;

    const filter = { sellerId: req.user._id };

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('categoryId', 'name slug')
        .sort({ createdAt: -1 })
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

// POST /api/v1/seller/products
const createSellerProduct = async (req, res, next) => {
  try {
    const { name, description, price, stock, image, categoryName, details, modelName, sizes } = req.body;

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
      categoryId: category._id,
      details: details || [],
      modelName: modelName || '',
      sizes: sizes || [],
      sellerId: req.user._id,
    });

    broadcastCatalogUpdate();
    res.status(201).json({ success: true, data: { product } });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/seller/products/bulk-json
const createSellerBulkJsonProducts = async (req, res, next) => {
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
        sellerId: req.user._id,
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

// PUT /api/v1/seller/products/:id
const updateSellerProduct = async (req, res, next) => {
  try {
    const { name, description, price, stock, image, categoryName, details, modelName, sizes } = req.body;

    const product = await Product.findOne({ _id: req.params.id, sellerId: req.user._id });
    if (!product) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Product not found or not owned by you' },
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
    if (details !== undefined) product.details = details;
    if (modelName !== undefined) product.modelName = modelName;
    if (sizes !== undefined) product.sizes = sizes;

    await product.save();
    broadcastCatalogUpdate();

    res.json({ success: true, data: { product }, message: 'Product updated successfully' });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/v1/seller/products/:id
const deleteSellerProduct = async (req, res, next) => {
  try {
    const product = await Product.findOneAndDelete({ _id: req.params.id, sellerId: req.user._id });
    if (!product) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Product not found or not owned by you' },
      });
    }

    broadcastCatalogUpdate();
    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/v1/seller/products (delete all seller's products)
const deleteAllSellerProducts = async (req, res, next) => {
  try {
    const result = await Product.deleteMany({ sellerId: req.user._id });
    broadcastCatalogUpdate();
    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} products`,
      productsDeleted: result.deletedCount,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/seller/orders
const getSellerOrders = async (req, res, next) => {
  try {
    const sellerProductIds = await Product.find({ sellerId: req.user._id }).distinct('_id');

    const orders = await Order.find({
      'items.productId': { $in: sellerProductIds },
    })
      .sort({ createdAt: -1 })
      .populate('userId', 'name email')
      .populate('deliveryBoyId', 'name');

    res.json({ success: true, data: { orders } });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/seller/admin-contact
const getAdminContact = async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: {
        email: env.ADMIN_CONTACT_EMAIL,
        phone: env.ADMIN_CONTACT_PHONE,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/seller/products/bulk-images
const sellerBulkMatchImages = async (req, res, next) => {
  try {
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_IMAGES', message: 'No image files uploaded' },
      });
    }

    // Get only this seller's products
    const products = await Product.find({ sellerId: req.user._id }).lean();

    if (products.length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_PRODUCTS', message: 'You have no products to match images against' },
      });
    }

    const result = matchImagesToProducts(products, files);

    const updatePromises = result.products
      .filter((p) => p.image && p.images && p.images.length > 0)
      .map((p) =>
        Product.findOneAndUpdate(
          { _id: p._id, sellerId: req.user._id },
          { image: p.image, images: p.images },
          { new: true }
        )
      );

    await Promise.all(updatePromises);

    if (updatePromises.length > 0) {
      broadcastCatalogUpdate();
    }

    res.json({
      success: true,
      data: {
        summary: result.summary,
        updatedProducts: updatePromises.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSellerProducts,
  createSellerProduct,
  createSellerBulkJsonProducts,
  updateSellerProduct,
  deleteSellerProduct,
  deleteAllSellerProducts,
  getSellerOrders,
  getAdminContact,
  sellerBulkMatchImages,
};
