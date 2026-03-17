import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api/axios';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import ProductCard from '../../components/product/ProductCard';
import SkeletonCard from '../../components/product/SkeletonCard';
import ProductModal from '../../components/product/ProductModal';
import useCatalogUpdates from '../../hooks/useCatalogUpdates';
import './CategoryPage.css';

const CategoryPage = () => {
  const { slug } = useParams();
  const [products, setProducts] = useState([]);
  const [categoryName, setCategoryName] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedProductId, setSelectedProductId] = useState(null);

  useEffect(() => {
    setPage(1);
  }, [slug]);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/products?category=${slug}&page=${page}&limit=20`);
      const productData = data.data?.products || data.products || [];
      const pages = data.data?.pagination?.pages || data.totalPages || 1;
      setProducts(Array.isArray(productData) ? productData : []);
      setTotalPages(pages);

      if (productData.length > 0 && productData[0].categoryId?.name) {
        setCategoryName(productData[0].categoryId.name);
      } else {
        setCategoryName(slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()));
      }
    } catch (err) {
      console.error('Failed to fetch category products:', err);
    } finally {
      setLoading(false);
    }
  }, [slug, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useCatalogUpdates(fetchProducts);

  return (
    <div className="home">
      <Navbar />

      <main className="home-content">
        <div className="container">
          <section className="category-page-header">
            <h1 className="category-page-title">{categoryName}</h1>
            <p className="category-page-subtitle">
              {!loading && `${products.length} product${products.length !== 1 ? 's' : ''} found`}
            </p>
          </section>

          {loading ? (
            <div className="product-row">
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="product-row">
              {products.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  onProductClick={setSelectedProductId}
                />
              ))}
            </div>
          ) : (
            <p className="empty-message">No products in this category yet.</p>
          )}

          {totalPages > 1 && (
            <div className="pagination">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
              <span>Page {page} of {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
            </div>
          )}
        </div>
      </main>

      {selectedProductId && (
        <ProductModal
          productId={selectedProductId}
          onClose={() => setSelectedProductId(null)}
        />
      )}

      <Footer />
    </div>
  );
};

export default CategoryPage;
