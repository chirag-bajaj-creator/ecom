import { useState, useEffect } from 'react';
import api from '../../api/axios';
import AdminSidebar from '../../components/layout/AdminSidebar';
import './AdminProducts.css';

const emptyProduct = () => ({ name: '', description: '', price: '', stock: '', image: '' });

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    image: '',
    categoryName: ''
  });
  const [bulkCategory, setBulkCategory] = useState('');
  const [bulkCount, setBulkCount] = useState('');
  const [bulkProducts, setBulkProducts] = useState([]);
  const [bulkGenerated, setBulkGenerated] = useState(false);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [jsonFile, setJsonFile] = useState(null);
  const [jsonPreview, setJsonPreview] = useState(null);
  const [jsonError, setJsonError] = useState('');
  const [jsonSubmitting, setJsonSubmitting] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [page]);

  const fetchProducts = async () => {
    try {
      const { data } = await api.get(`/products?page=${page}&limit=10`);
      const productData = data.data?.products || data.products || data;
      const pages = data.data?.pagination?.pages || data.totalPages || 1;
      setProducts(Array.isArray(productData) ? productData : []);
      setTotalPages(pages);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data } = await api.get('/categories');
      setCategories(data.data?.categories || data.categories || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const openAddModal = () => {
    setBulkCategory('');
    setBulkCount('');
    setBulkProducts([]);
    setBulkGenerated(false);
    setShowBulkModal(true);
  };

  const handleGenerateFields = () => {
    const count = parseInt(bulkCount);
    if (!bulkCategory.trim() || !count || count < 1) {
      alert('Enter category name and number of products');
      return;
    }
    if (count > 50) {
      alert('Maximum 50 products per batch');
      return;
    }
    setBulkProducts(Array.from({ length: count }, () => emptyProduct()));
    setBulkGenerated(true);
  };

  const updateBulkProduct = (index, field, value) => {
    setBulkProducts(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    for (let i = 0; i < bulkProducts.length; i++) {
      if (!bulkProducts[i].name || !bulkProducts[i].price) {
        alert(`Product #${i + 1}: Name and Price are required`);
        return;
      }
    }
    setBulkSubmitting(true);
    try {
      await api.post('/products/bulk', {
        categoryName: bulkCategory,
        products: bulkProducts.map(p => ({
          ...p,
          price: Number(p.price),
          stock: p.stock ? Number(p.stock) : 0
        }))
      });
      setShowBulkModal(false);
      fetchProducts();
      fetchCategories();
    } catch (error) {
      console.error('Failed to bulk create:', error.response?.data);
      alert(error.response?.data?.error?.message || 'Failed to create products');
    } finally {
      setBulkSubmitting(false);
    }
  };

  const openJsonModal = () => {
    setJsonFile(null);
    setJsonPreview(null);
    setJsonError('');
    setShowJsonModal(true);
  };

  const handleJsonFileChange = (e) => {
    const file = e.target.files[0];
    setJsonError('');
    setJsonPreview(null);

    if (!file) {
      setJsonFile(null);
      return;
    }

    if (!file.name.endsWith('.json')) {
      setJsonError('Please upload a .json file');
      setJsonFile(null);
      return;
    }

    setJsonFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        const data = Array.isArray(parsed) ? parsed : [parsed];

        for (let i = 0; i < data.length; i++) {
          const entry = data[i];
          if (!entry.category || !Array.isArray(entry.productsList) || entry.productsList.length === 0) {
            setJsonError(`Entry #${i + 1}: must have "category" and "productsList" fields`);
            setJsonPreview(null);
            return;
          }
          for (let j = 0; j < entry.productsList.length; j++) {
            if (!entry.productsList[j].name || entry.productsList[j].price === undefined) {
              setJsonError(`Entry #${i + 1}, Product #${j + 1}: "name" and "price" are required`);
              setJsonPreview(null);
              return;
            }
          }
        }

        setJsonPreview(data);
      } catch {
        setJsonError('Invalid JSON format');
        setJsonPreview(null);
      }
    };
    reader.readAsText(file);
  };

  const handleJsonSubmit = async () => {
    if (!jsonPreview) return;
    setJsonSubmitting(true);
    try {
      const res = await api.post('/products/bulk-json', { categories: jsonPreview });
      alert(`Successfully created ${res.data.data.totalCreated} products across ${res.data.data.categories.length} categories`);
      setShowJsonModal(false);
      fetchProducts();
      fetchCategories();
    } catch (error) {
      console.error('Failed to upload JSON products:', error.response?.data);
      alert(error.response?.data?.error?.message || 'Failed to upload products');
    } finally {
      setJsonSubmitting(false);
    }
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      image: product.image || '',
      categoryName: product.categoryId?.name || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: form.name,
        description: form.description,
        price: Number(form.price),
        stock: Number(form.stock),
        image: form.image,
        categoryName: form.categoryName
      };

      if (editingProduct) {
        await api.put(`/products/${editingProduct._id}`, payload);
      } else {
        await api.post('/products', payload);
      }
      setShowModal(false);
      fetchProducts();
    } catch (error) {
      console.error('Failed to save product:', error.response?.data);
      alert(error.response?.data?.error?.message || error.response?.data?.message || 'Failed to save product');
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('Are you sure you want to delete ALL products and categories? This cannot be undone.')) return;
    try {
      const { data } = await api.delete('/admin/cleanup-products');
      alert(`Deleted ${data.productsDeleted} products and ${data.categoriesDeleted} categories`);
      fetchProducts();
      fetchCategories();
    } catch (error) {
      console.error('Failed to delete all products:', error);
      alert(error.response?.data?.message || 'Failed to delete all products');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      fetchProducts();
    } catch (error) {
      console.error('Failed to delete product:', error);
      alert(error.response?.data?.message || 'Failed to delete product');
    }
  };

  if (loading) {
    return (
      <div className="admin-layout">
        <AdminSidebar />
        <main className="admin-content">
          <div className="admin-loading">Loading products...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-content">
        <div className="admin-page-header">
          <h1 className="admin-page-title">Products</h1>
          <div className="admin-header-actions">
            <button className="admin-add-btn" onClick={openAddModal}>+ Add Products</button>
            <button className="admin-add-btn json-upload-btn" onClick={openJsonModal}>Add by JSON</button>
            <button className="admin-add-btn bulk-delete-btn" onClick={handleDeleteAll}>Delete All</button>
          </div>
        </div>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length > 0 ? products.map(product => (
                <tr key={product._id}>
                  <td>
                    <img
                      src={product.image || 'https://via.placeholder.com/40'}
                      alt={product.name}
                      className="product-thumb"
                    />
                  </td>
                  <td className="product-name-cell">
                    <div className="product-name">{product.name}</div>
                    <div className="product-desc">{product.description?.slice(0, 50)}...</div>
                  </td>
                  <td>
                    <span className="category-tag">
                      {product.categoryId?.name || 'Uncategorized'}
                    </span>
                  </td>
                  <td className="price-cell">₹{product.price?.toLocaleString()}</td>
                  <td>
                    <span className={`stock-badge ${product.stock <= 5 ? 'low-stock' : ''}`}>
                      {product.stock}
                    </span>
                  </td>
                  <td>
                    <div className="action-btns">
                      <button className="edit-btn" onClick={() => openEditModal(product)}>Edit</button>
                      <button className="delete-btn" onClick={() => handleDelete(product._id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="6" className="no-data">No products found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="admin-pagination">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
            <span>Page {page} of {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        )}

        {/* Edit single product modal */}
        {showModal && (
          <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
            <div className="admin-modal" onClick={e => e.stopPropagation()}>
              <h2>Edit Product</h2>
              <form onSubmit={handleSubmit}>
                <div className="modal-field">
                  <label>Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div className="modal-field">
                  <label>Description</label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    required
                    rows={3}
                  />
                </div>
                <div className="modal-row">
                  <div className="modal-field">
                    <label>Price (₹)</label>
                    <input
                      type="number"
                      value={form.price}
                      onChange={e => setForm({ ...form, price: e.target.value })}
                      required
                      min="0"
                    />
                  </div>
                  <div className="modal-field">
                    <label>Stock</label>
                    <input
                      type="number"
                      value={form.stock}
                      onChange={e => setForm({ ...form, stock: e.target.value })}
                      required
                      min="0"
                    />
                  </div>
                </div>
                <div className="modal-field">
                  <label>Image URL</label>
                  <input
                    type="text"
                    value={form.image}
                    onChange={e => setForm({ ...form, image: e.target.value })}
                  />
                </div>
                <div className="modal-field">
                  <label>Category</label>
                  <input type="text" value={form.categoryName} onChange={e => setForm({ ...form, categoryName: e.target.value })} required />
                </div>
                <div className="modal-actions">
                  <button type="button" className="modal-cancel-btn" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="modal-save-btn">Update</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Bulk add products modal */}
        {showBulkModal && (
          <div className="admin-modal-overlay" onClick={() => setShowBulkModal(false)}>
            <div className="admin-modal bulk-modal" onClick={e => e.stopPropagation()}>
              <h2>Add Products</h2>

              {!bulkGenerated ? (
                <div className="bulk-setup">
                  <div className="modal-field">
                    <label>Category Name</label>
                    <input
                      type="text"
                      value={bulkCategory}
                      onChange={e => setBulkCategory(e.target.value)}
                      placeholder="e.g. Electronics, Clothing..."
                    />
                  </div>
                  <div className="modal-field">
                    <label>Number of Products</label>
                    <input
                      type="number"
                      value={bulkCount}
                      onChange={e => setBulkCount(e.target.value)}
                      min="1"
                      max="50"
                      placeholder="How many products under this category?"
                    />
                  </div>
                  <div className="modal-actions">
                    <button type="button" className="modal-cancel-btn" onClick={() => setShowBulkModal(false)}>
                      Cancel
                    </button>
                    <button type="button" className="modal-save-btn" onClick={handleGenerateFields}>
                      Generate Fields
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleBulkSubmit}>
                  <div className="bulk-category-header">
                    Category: <strong>{bulkCategory}</strong> — {bulkProducts.length} product(s)
                  </div>
                  <div className="bulk-products-list">
                    {bulkProducts.map((p, i) => (
                      <div key={i} className="bulk-product-block">
                        <h4>Product #{i + 1}</h4>
                        <div className="modal-field">
                          <label>Name</label>
                          <input
                            type="text"
                            value={p.name}
                            onChange={e => updateBulkProduct(i, 'name', e.target.value)}
                            required
                          />
                        </div>
                        <div className="modal-field">
                          <label>Description</label>
                          <textarea
                            value={p.description}
                            onChange={e => updateBulkProduct(i, 'description', e.target.value)}
                            rows={2}
                          />
                        </div>
                        <div className="modal-row">
                          <div className="modal-field">
                            <label>Price (₹)</label>
                            <input
                              type="number"
                              value={p.price}
                              onChange={e => updateBulkProduct(i, 'price', e.target.value)}
                              required
                              min="0"
                            />
                          </div>
                          <div className="modal-field">
                            <label>Stock</label>
                            <input
                              type="number"
                              value={p.stock}
                              onChange={e => updateBulkProduct(i, 'stock', e.target.value)}
                              min="0"
                            />
                          </div>
                        </div>
                        <div className="modal-field">
                          <label>Image URL</label>
                          <input
                            type="text"
                            value={p.image}
                            onChange={e => updateBulkProduct(i, 'image', e.target.value)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="modal-actions">
                    <button type="button" className="modal-cancel-btn" onClick={() => setShowBulkModal(false)}>
                      Cancel
                    </button>
                    <button type="button" className="modal-back-btn" onClick={() => setBulkGenerated(false)}>
                      Back
                    </button>
                    <button type="submit" className="modal-save-btn" disabled={bulkSubmitting}>
                      {bulkSubmitting ? 'Creating...' : `Create All ${bulkProducts.length} Products`}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
        {/* JSON upload modal */}
        {showJsonModal && (
          <div className="admin-modal-overlay" onClick={() => setShowJsonModal(false)}>
            <div className="admin-modal bulk-modal" onClick={e => e.stopPropagation()}>
              <h2>Add Products by JSON</h2>

              <div className="json-format-hint">
                <strong>Expected format:</strong>
                <pre>{`[
  {
    "category": "Category Name",
    "products": 2,
    "productsList": [
      { "name": "...", "description": "...", "price": 999, "stock": 50, "imageUrl": "..." },
      { "name": "...", "description": "...", "price": 499, "stock": 30, "imageUrl": "..." }
    ]
  }
]`}</pre>
              </div>

              <div className="modal-field">
                <label>Upload JSON File</label>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleJsonFileChange}
                  className="json-file-input"
                />
              </div>

              {jsonError && <div className="json-error">{jsonError}</div>}

              {jsonPreview && (
                <div className="json-preview">
                  <h3>Preview</h3>
                  <div className="json-preview-list">
                    {jsonPreview.map((entry, i) => (
                      <div key={i} className="json-preview-category">
                        <div className="json-preview-category-header">
                          <span className="category-tag">{entry.category}</span>
                          <span className="json-product-count">{entry.productsList.length} product(s)</span>
                        </div>
                        <table className="json-preview-table">
                          <thead>
                            <tr>
                              <th>#</th>
                              <th>Name</th>
                              <th>Price</th>
                              <th>Stock</th>
                            </tr>
                          </thead>
                          <tbody>
                            {entry.productsList.map((p, j) => (
                              <tr key={j}>
                                <td>{j + 1}</td>
                                <td>{p.name}</td>
                                <td>₹{Number(p.price).toLocaleString()}</td>
                                <td>{p.stock || 0}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="modal-cancel-btn" onClick={() => setShowJsonModal(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="modal-save-btn"
                  disabled={!jsonPreview || jsonSubmitting}
                  onClick={handleJsonSubmit}
                >
                  {jsonSubmitting ? 'Uploading...' : 'Upload All Products'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminProducts;
