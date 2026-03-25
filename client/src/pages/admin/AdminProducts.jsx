import { useState, useEffect } from 'react';
import api from '../../api/axios';
import AdminSidebar from '../../components/layout/AdminSidebar';
import CategorySelect from '../../components/common/CategorySelect';
import ProductNameSelect from '../../components/common/ProductNameSelect';
import './AdminProducts.css';

const SIZE_UNITS = ['ML', 'L', 'g', 'KG', 'oz', 'lb', 'pieces', 'pack', 'cm', 'inch', 'mm', 'm'];

const emptyProduct = () => ({ name: '', description: '', price: '', stock: '', image: '', details: [], modelName: '', sizes: [] });

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
    categoryName: '',
    details: [],
    modelName: '',
    sizes: []
  });
  const [showSizeHint, setShowSizeHint] = useState(false);
  const [bulkCategory, setBulkCategory] = useState('');
  const [bulkCount, setBulkCount] = useState('');
  const [bulkProducts, setBulkProducts] = useState([]);
  const [bulkGenerated, setBulkGenerated] = useState(false);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
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
    setCurrentStep(0);
    setShowBulkModal(true);
  };

  // When count changes, resize the bulkProducts array to show name/model fields
  const handleCountChange = (val) => {
    setBulkCount(val);
    const count = parseInt(val);
    if (!count || count < 1 || count > 50) {
      setBulkProducts([]);
      return;
    }
    setBulkProducts(prev => {
      const newArr = Array.from({ length: count }, (_, i) => prev[i] || emptyProduct());
      return newArr;
    });
  };

  const handleGenerateFields = () => {
    if (!bulkCategory.trim()) {
      alert('Enter category name');
      return;
    }
    if (bulkProducts.length === 0) {
      alert('Enter number of products');
      return;
    }
    for (let i = 0; i < bulkProducts.length; i++) {
      if (!bulkProducts[i].name) {
        alert(`Product #${i + 1}: Name is required`);
        return;
      }
    }
    setBulkGenerated(true);
    setCurrentStep(0);
  };

  const handleNextStep = () => {
    const p = bulkProducts[currentStep];
    if (!p.price) {
      alert(`Product #${currentStep + 1}: Price is required`);
      return;
    }
    setCurrentStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => prev - 1);
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
          stock: p.stock ? Number(p.stock) : 0,
          modelName: p.modelName || '',
          sizes: (p.sizes || []).filter(s => s.value && s.unit && s.price)
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
      categoryName: product.categoryId?.name || '',
      details: product.details || [],
      modelName: product.modelName || '',
      sizes: product.sizes || []
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
        categoryName: form.categoryName,
        details: form.details.filter(d => d.title.trim() && d.content.trim()),
        modelName: form.modelName,
        sizes: form.sizes.filter(s => s.value && s.unit && s.price)
      };

      if (editingProduct) {
        await api.put(`/products/${editingProduct._id}`, payload);
        alert('Product details updated successfully');
      } else {
        await api.post('/products', payload);
        alert('Product added successfully');
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
                  <ProductNameSelect
                    value={form.name}
                    onChange={(val) => setForm({ ...form, name: val })}
                    required
                  />
                </div>
                <div className="modal-field">
                  <label>Model Name</label>
                  <input
                    type="text"
                    value={form.modelName}
                    onChange={e => setForm({ ...form, modelName: e.target.value })}
                    placeholder="e.g. Samsung MW73AD, Nike Air Max 90..."
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
                  <CategorySelect
                    value={form.categoryName}
                    onChange={(val) => setForm({ ...form, categoryName: val })}
                    required
                  />
                </div>

                {/* Sizes — optional */}
                <div className="modal-field">
                  <label>Sizes / Variants (Optional)</label>
                  {form.sizes.map((size, i) => (
                    <div key={i} className="size-entry">
                      <input
                        type="number"
                        placeholder="Value (e.g. 500)"
                        value={size.value}
                        onChange={e => {
                          const updated = [...form.sizes];
                          updated[i] = { ...updated[i], value: e.target.value };
                          setForm({ ...form, sizes: updated });
                        }}
                        min="0"
                        className="size-value-input"
                      />
                      <select
                        value={size.unit}
                        onChange={e => {
                          const updated = [...form.sizes];
                          updated[i] = { ...updated[i], unit: e.target.value };
                          setForm({ ...form, sizes: updated });
                        }}
                        className="size-unit-select"
                      >
                        <option value="">Unit</option>
                        {SIZE_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                      <input
                        type="number"
                        placeholder="Price (₹)"
                        value={size.price}
                        onChange={e => {
                          const updated = [...form.sizes];
                          updated[i] = { ...updated[i], price: e.target.value };
                          setForm({ ...form, sizes: updated });
                        }}
                        min="0"
                        className="size-price-input"
                      />
                      <button
                        type="button"
                        className="detail-remove-btn"
                        onClick={() => setForm({ ...form, sizes: form.sizes.filter((_, j) => j !== i) })}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="detail-add-btn"
                    onClick={() => {
                      if (form.sizes.length === 0 && !showSizeHint) {
                        setShowSizeHint(true);
                        setTimeout(() => setShowSizeHint(false), 4000);
                      }
                      setForm({ ...form, sizes: [...form.sizes, { value: '', unit: '', price: '' }] });
                    }}
                  >
                    + Add Size
                  </button>
                  {showSizeHint && (
                    <div className="size-hint-popup">
                      Sellers who add sizes have more chance of getting early customers!
                    </div>
                  )}
                </div>

                {/* Product Details Dropdowns — admin adds as many as needed */}
                <div className="modal-field">
                  <label>Product Details (Dropdowns)</label>
                  <p className="details-hint">Add dropdown sections that customers can expand on the product page.</p>
                  {form.details.map((detail, i) => (
                    <div key={i} className="detail-entry">
                      <input
                        type="text"
                        placeholder="Dropdown title (e.g. Dimensions, Material, Care Instructions)"
                        value={detail.title}
                        onChange={e => {
                          const updated = [...form.details];
                          updated[i] = { ...updated[i], title: e.target.value };
                          setForm({ ...form, details: updated });
                        }}
                      />
                      <textarea
                        placeholder="Content shown when expanded"
                        value={detail.content}
                        onChange={e => {
                          const updated = [...form.details];
                          updated[i] = { ...updated[i], content: e.target.value };
                          setForm({ ...form, details: updated });
                        }}
                        rows={2}
                      />
                      <button
                        type="button"
                        className="detail-remove-btn"
                        onClick={() => {
                          setForm({ ...form, details: form.details.filter((_, j) => j !== i) });
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="detail-add-btn"
                    onClick={() => setForm({ ...form, details: [...form.details, { title: '', content: '' }] })}
                  >
                    + Add Dropdown
                  </button>
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
                    <CategorySelect
                      value={bulkCategory}
                      onChange={(val) => setBulkCategory(val)}
                    />
                  </div>
                  <div className="modal-field">
                    <label>Number of Products</label>
                    <input
                      type="number"
                      value={bulkCount}
                      onChange={e => handleCountChange(e.target.value)}
                      min="1"
                      max="50"
                      placeholder="How many products under this category?"
                    />
                  </div>

                  {/* Name + Model Name fields appear automatically */}
                  {bulkProducts.length > 0 && (
                    <div className="bulk-products-list">
                      {bulkProducts.map((p, i) => (
                        <div key={i} className="bulk-product-block">
                          <h4>Product #{i + 1}</h4>
                          <div className="modal-field">
                            <label>Product Name</label>
                            <ProductNameSelect
                              value={p.name}
                              onChange={(val) => updateBulkProduct(i, 'name', val)}
                              required
                            />
                          </div>
                          <div className="modal-field">
                            <label>Model Name</label>
                            <input
                              type="text"
                              value={p.modelName || ''}
                              onChange={e => updateBulkProduct(i, 'modelName', e.target.value)}
                              placeholder="e.g. Samsung MW73AD..."
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="modal-actions">
                    <button type="button" className="modal-cancel-btn" onClick={() => setShowBulkModal(false)}>
                      Cancel
                    </button>
                    <button type="button" className="modal-save-btn" onClick={handleGenerateFields} disabled={bulkProducts.length === 0}>
                      Generate Fields
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleBulkSubmit}>
                  <div className="bulk-category-header">
                    Category: <strong>{bulkCategory}</strong> — {bulkProducts.length} product(s)
                  </div>
                  <div className="wizard-progress">
                    <span>Product {currentStep + 1} of {bulkProducts.length} — {bulkProducts[currentStep].name}</span>
                    <div className="wizard-progress-bar">
                      <div
                        className="wizard-progress-fill"
                        style={{ width: `${((currentStep + 1) / bulkProducts.length) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="bulk-product-block">
                    <h4>{bulkProducts[currentStep].name} {bulkProducts[currentStep].modelName && `— ${bulkProducts[currentStep].modelName}`}</h4>
                    <div className="modal-field">
                      <label>Description</label>
                      <textarea
                        value={bulkProducts[currentStep].description}
                        onChange={e => updateBulkProduct(currentStep, 'description', e.target.value)}
                        rows={2}
                      />
                    </div>
                    <div className="modal-row">
                      <div className="modal-field">
                        <label>Price (₹)</label>
                        <input
                          type="number"
                          value={bulkProducts[currentStep].price}
                          onChange={e => updateBulkProduct(currentStep, 'price', e.target.value)}
                          required
                          min="0"
                        />
                      </div>
                      <div className="modal-field">
                        <label>Stock</label>
                        <input
                          type="number"
                          value={bulkProducts[currentStep].stock}
                          onChange={e => updateBulkProduct(currentStep, 'stock', e.target.value)}
                          min="0"
                        />
                      </div>
                    </div>
                    <div className="modal-field">
                      <label>Image URL</label>
                      <input
                        type="text"
                        value={bulkProducts[currentStep].image}
                        onChange={e => updateBulkProduct(currentStep, 'image', e.target.value)}
                      />
                    </div>
                    <div className="modal-field">
                      <label>Sizes / Variants (Optional)</label>
                      {(bulkProducts[currentStep].sizes || []).map((size, si) => (
                        <div key={si} className="size-entry">
                          <input
                            type="number"
                            placeholder="Value"
                            value={size.value}
                            onChange={e => {
                              const updated = [...(bulkProducts[currentStep].sizes || [])];
                              updated[si] = { ...updated[si], value: e.target.value };
                              updateBulkProduct(currentStep, 'sizes', updated);
                            }}
                            min="0"
                            className="size-value-input"
                          />
                          <select
                            value={size.unit}
                            onChange={e => {
                              const updated = [...(bulkProducts[currentStep].sizes || [])];
                              updated[si] = { ...updated[si], unit: e.target.value };
                              updateBulkProduct(currentStep, 'sizes', updated);
                            }}
                            className="size-unit-select"
                          >
                            <option value="">Unit</option>
                            {SIZE_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                          </select>
                          <input
                            type="number"
                            placeholder="Price (₹)"
                            value={size.price}
                            onChange={e => {
                              const updated = [...(bulkProducts[currentStep].sizes || [])];
                              updated[si] = { ...updated[si], price: e.target.value };
                              updateBulkProduct(currentStep, 'sizes', updated);
                            }}
                            min="0"
                            className="size-price-input"
                          />
                          <button
                            type="button"
                            className="detail-remove-btn"
                            onClick={() => {
                              const updated = (bulkProducts[currentStep].sizes || []).filter((_, j) => j !== si);
                              updateBulkProduct(currentStep, 'sizes', updated);
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        className="detail-add-btn"
                        onClick={() => updateBulkProduct(currentStep, 'sizes', [...(bulkProducts[currentStep].sizes || []), { value: '', unit: '', price: '' }])}
                      >
                        + Add Size
                      </button>
                    </div>
                    <div className="modal-field">
                      <label>Product Details (Dropdowns)</label>
                      {(bulkProducts[currentStep].details || []).map((detail, di) => (
                        <div key={di} className="detail-entry">
                          <input
                            type="text"
                            placeholder="Dropdown title"
                            value={detail.title}
                            onChange={e => {
                              const updated = [...(bulkProducts[currentStep].details || [])];
                              updated[di] = { ...updated[di], title: e.target.value };
                              updateBulkProduct(currentStep, 'details', updated);
                            }}
                          />
                          <textarea
                            placeholder="Content"
                            value={detail.content}
                            onChange={e => {
                              const updated = [...(bulkProducts[currentStep].details || [])];
                              updated[di] = { ...updated[di], content: e.target.value };
                              updateBulkProduct(currentStep, 'details', updated);
                            }}
                            rows={2}
                          />
                          <button
                            type="button"
                            className="detail-remove-btn"
                            onClick={() => {
                              const updated = (bulkProducts[currentStep].details || []).filter((_, j) => j !== di);
                              updateBulkProduct(currentStep, 'details', updated);
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        className="detail-add-btn"
                        onClick={() => updateBulkProduct(currentStep, 'details', [...(bulkProducts[currentStep].details || []), { title: '', content: '' }])}
                      >
                        + Add Dropdown
                      </button>
                    </div>
                  </div>
                  <div className="modal-actions">
                    <button type="button" className="modal-cancel-btn" onClick={() => setShowBulkModal(false)}>
                      Cancel
                    </button>
                    {currentStep === 0 ? (
                      <button type="button" className="modal-back-btn" onClick={() => setBulkGenerated(false)}>
                        Back
                      </button>
                    ) : (
                      <button type="button" className="modal-back-btn" onClick={handlePrevStep}>
                        Previous
                      </button>
                    )}
                    {currentStep < bulkProducts.length - 1 ? (
                      <button type="button" className="modal-save-btn" onClick={handleNextStep}>
                        Next
                      </button>
                    ) : (
                      <button type="submit" className="modal-save-btn" disabled={bulkSubmitting}>
                        {bulkSubmitting ? 'Creating...' : `Submit All ${bulkProducts.length} Products`}
                      </button>
                    )}
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
