import { useState, useEffect } from 'react';
import api from '../../api/axios';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import ProductCard from '../../components/product/ProductCard';
import SkeletonCard from '../../components/product/SkeletonCard';
import ProductModal from '../../components/product/ProductModal';
import './Home.css';

const Home = () => {
  const [categories, setCategories] = useState([]);
  const [productsByCategory, setProductsByCategory] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const catRes = await api.get('/categories');
        const cats = catRes.data.data.categories;
        setCategories(cats);

        const productPromises = cats.map((cat) =>
          api.get(`/products?category=${cat.slug}&limit=10`)
        );
        const productResults = await Promise.all(productPromises);

        const mapped = {};
        cats.forEach((cat, i) => {
          mapped[cat._id] = productResults[i].data.data.products;
        });
        setProductsByCategory(mapped);
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="home">
      <Navbar />

      <main className="home-content">
        <div className="container">
          <section className="hero-section">
            <h1>Welcome to ShopKart</h1>
            <p>Your one-stop marketplace for everything you need</p>
          </section>

          {loading ? (
            <section className="category-section">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i}>
                  <div className="skeleton-text skeleton-title" style={{ width: '150px', height: '20px', marginBottom: '12px' }} />
                  <div className="product-row">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <SkeletonCard key={j} />
                    ))}
                  </div>
                </div>
              ))}
            </section>
          ) : (
            categories.map((cat) => (
              <section key={cat._id} className="category-section">
                <h2 className="section-title">{cat.name}</h2>
                {productsByCategory[cat._id]?.length > 0 ? (
                  <div className="product-row">
                    {productsByCategory[cat._id].map((product) => (
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
              </section>
            ))
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

export default Home;
