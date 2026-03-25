/**
 * Match uploaded image files to existing products by filename ~ product name.
 */

function normalize(str) {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function matchImagesToProducts(products, files) {
  // Build a map: normalizedName -> product (with images array ready)
  const productMap = new Map();
  const matchedProducts = new Map(); // _id -> product with image fields

  for (const product of products) {
    const key = normalize(product.name);
    if (!productMap.has(key)) {
      productMap.set(key, product);
    }
  }

  let matched = 0;
  let unmatched = 0;
  const unmatchedFiles = [];

  for (const file of files) {
    // Strip extension from original name to get the product name
    const nameWithoutExt = file.originalname.replace(/\.[^.]+$/, '');
    const key = normalize(nameWithoutExt);
    const servePath = `/uploads/products/${file.filename}`;

    const product = productMap.get(key);
    if (product) {
      matched++;
      const id = product._id.toString();

      if (!matchedProducts.has(id)) {
        matchedProducts.set(id, {
          _id: product._id,
          name: product.name,
          image: servePath,
          images: [servePath],
        });
      } else {
        matchedProducts.get(id).images.push(servePath);
      }
    } else {
      unmatched++;
      unmatchedFiles.push(file.originalname);
    }
  }

  return {
    products: Array.from(matchedProducts.values()),
    summary: {
      totalFiles: files.length,
      matched,
      unmatched,
      unmatchedFiles,
    },
  };
}

module.exports = { matchImagesToProducts };
