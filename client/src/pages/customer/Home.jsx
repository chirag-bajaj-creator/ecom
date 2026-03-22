import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../api/axios';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import ProductCard from '../../components/product/ProductCard';
import SkeletonCard from '../../components/product/SkeletonCard';
import useCatalogUpdates from '../../hooks/useCatalogUpdates';
import AddressBar from '../../components/address/AddressBar';
import './Home.css';

const Home = () => {
  const [categories, setCategories] = useState([]);
  const [productsByCategory, setProductsByCategory] = useState({});
  const [loading, setLoading] = useState(true);
  const [showWand, setShowWand] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowWand(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const fetchData = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useCatalogUpdates(fetchData);

  return (
    <div className="home">
      <Navbar />
      <AddressBar />

      <main className="home-content">
        <div className="container">
          <section className="hero-section">
            <h1>Welcome to ChiragKart</h1>
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
            categories.filter(cat => productsByCategory[cat._id]?.length > 0).map((cat) => (
              <section key={cat._id} className="category-section">
                <h2 className="section-title">{cat.name}</h2>
                <div className="product-row">
                  {productsByCategory[cat._id].map((product) => (
                    <ProductCard
                      key={product._id}
                      product={product}
                    />
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      </main>

      <Footer />

      {showWand && (
        <button className="magic-wand-btn" onClick={scrollToTop} aria-label="Scroll to top">
          <span className="wand-text">TOP</span>
        </button>
      )}
    </div>
  );
};

export default Home;
