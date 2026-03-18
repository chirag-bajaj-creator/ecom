import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import ProductCard from '../../components/product/ProductCard';
import './ProductDetail.css';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState(null);
  const [starFilter, setStarFilter] = useState(null);
  const [sortOption, setSortOption] = useState('relevant');
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', comment: '' });
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showOffersPopup, setShowOffersPopup] = useState(false);
  const [expandedSpecs, setExpandedSpecs] = useState(new Set());
  const [reviewError, setReviewError] = useState('');

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/products/${id}`);
        setProduct(data.data.product);
        setSelectedImage(0);
        setQuantity(1);
      } catch (err) {
        console.error('Failed to fetch product:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  useEffect(() => {
    if (user && id) {
      api.post(`/products/${id}/view`).catch(() => {});
    }
  }, [id, user]);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const params = new URLSearchParams({ sort: sortOption, limit: '10' });
        if (starFilter) params.set('star', starFilter);
        const { data } = await api.get(`/products/${id}/reviews?${params}`);
        setReviews(data.data.reviews);
        setReviewStats(data.data.stats);
      } catch (err) {
        console.error('Failed to fetch reviews:', err);
      }
    };
    fetchReviews();
  }, [id, starFilter, sortOption]);

  useEffect(() => {
    if (user) {
      api.get(`/recently-viewed?exclude=${id}`)
        .then(({ data }) => setRecentlyViewed(data.data.products))
        .catch(() => {});
    }
  }, [id, user]);

  const allImages = product
    ? [product.image, ...(product.images || [])].filter(Boolean)
    : [];

  const handleAddToCart = async () => {
    try {
      await addToCart(product._id, quantity, {
        _id: product._id,
        name: product.name,
        price: product.price,
        image: product.image,
        stock: product.stock,
      });
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to add to cart');
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setReviewError('');
    try {
      await api.post(`/products/${id}/reviews`, reviewForm);
      setShowReviewForm(false);
      setReviewForm({ rating: 5, title: '', comment: '' });
      const params = new URLSearchParams({ sort: sortOption, limit: '10' });
      if (starFilter) params.set('star', starFilter);
      const { data } = await api.get(`/products/${id}/reviews?${params}`);
      setReviews(data.data.reviews);
      setReviewStats(data.data.stats);
    } catch (err) {
      setReviewError(err.response?.data?.message || 'Failed to submit review');
    }
  };

  const toggleSpec = (key) => {
    setExpandedSpecs(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const discountPercent = product?.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const specsEntries = product?.specs
    ? Object.entries(product.specs instanceof Map ? Object.fromEntries(product.specs) : product.specs)
    : [];

  const detailItems = product?.details || [];

  if (loading) {
    return (
      <div className="product-detail">
        <Navbar />
        <main className="pd-container">
          <div className="pd-loading-skeleton">
            <div className="pd-skel-image" />
            <div className="pd-skel-info">
              <div className="pd-skel-line pd-skel-title" />
              <div className="pd-skel-line pd-skel-desc" />
              <div className="pd-skel-line pd-skel-price" />
              <div className="pd-skel-line pd-skel-btn" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-detail">
        <Navbar />
        <main className="pd-container"><p className="pd-loading">Product not found.</p></main>
        <Footer />
      </div>
    );
  }

  const offers = [
    '10% off on first order',
    'Free delivery above \u20b9499',
    '5% cashback on UPI',
    'Buy 2 get 10% off',
    'No cost EMI available',
  ];

  return (
    <div className="product-detail">
      <Navbar />
      <main className="pd-container">

        {/* SECTION 1: Product Hero */}
        <section className="pd-glass-card pd-hero">
          <div className="pd-images">
            <div className="pd-main-image" key={selectedImage}>
              <img src={allImages[selectedImage] || '/placeholder.png'} alt={product.name} />
              <button className="pd-popup-btn" onClick={() => setShowPopup(true)}>
                <span className="pd-popup-icon">&#x26F6;</span>
              </button>
            </div>
            {allImages.length > 1 && (
              <div className="pd-thumbnails">
                {allImages.map((img, i) => (
                  <div
                    key={i}
                    className={`pd-thumb ${i === selectedImage ? 'active' : ''}`}
                    onClick={() => setSelectedImage(i)}
                  >
                    <img src={img} alt={`${product.name} ${i + 1}`} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pd-info">
            <h1 className="pd-name">{product.name}</h1>
            {product.description && (
              <p className="pd-desc">{product.description}</p>
            )}
            {reviewStats && reviewStats.total > 0 && (
              <div className="pd-rating-summary">
                <span className="pd-stars-display">
                  {'★'.repeat(Math.round(reviewStats.avgRating))}{'☆'.repeat(5 - Math.round(reviewStats.avgRating))}
                </span>
                <span className="pd-rating-text">{reviewStats.avgRating.toFixed(1)} ({reviewStats.total} reviews)</span>
              </div>
            )}

            <div className="pd-price-divider" />
            <div className="pd-price">
              <span className="pd-discount-price">₹{product.price}</span>
              {product.originalPrice && (
                <span className="pd-original-price">₹{product.originalPrice}</span>
              )}
              {discountPercent > 0 && (
                <span className="pd-discount-badge">{discountPercent}% OFF</span>
              )}
            </div>

            <p className={`pd-stock ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}`}>
              <span className="pd-stock-dot" />
              {product.stock > 0 ? `In Stock (${product.stock})` : 'Out of Stock'}
            </p>

            <div className="pd-quantity">
              <button onClick={() => setQuantity(q => Math.max(1, q - 1))}>-</button>
              <span>{quantity}</span>
              <button onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}>+</button>
            </div>

            <button className="pd-add-cart" onClick={handleAddToCart} disabled={product.stock === 0}>
              Add to Cart
            </button>

            <button className="pd-view-offers" onClick={() => setShowOffersPopup(true)}>
              <span className="pd-offer-tag-icon">&#x1F3F7;&#xFE0F;</span> View Offers
            </button>
          </div>
        </section>

        {/* SECTION 2: Product Details */}
        <section className="pd-glass-card pd-details">
          <h2>Product Details</h2>
          <div className="pd-detail-image">
            <img src={product.detailImage || product.image} alt={product.name} />
          </div>

          {(detailItems.length > 0 || specsEntries.length > 0 || product.description) && (
            <div className="pd-accordion">
              {/* Admin-created detail dropdowns */}
              {detailItems.map((item, i) => (
                <div key={`detail-${i}`} className={`pd-accordion-item ${expandedSpecs.has(`detail-${i}`) ? 'open' : ''}`}>
                  <button className="pd-accordion-header" onClick={() => toggleSpec(`detail-${i}`)}>
                    <span>{item.title}</span>
                    <span className="pd-accordion-chevron">{expandedSpecs.has(`detail-${i}`) ? '▾' : '▸'}</span>
                  </button>
                  <div className="pd-accordion-body">
                    <p>{item.content}</p>
                  </div>
                </div>
              ))}

              {/* Specs from Map field */}
              {specsEntries.map(([key, val]) => (
                <div key={key} className={`pd-accordion-item ${expandedSpecs.has(key) ? 'open' : ''}`}>
                  <button className="pd-accordion-header" onClick={() => toggleSpec(key)}>
                    <span>{key}</span>
                    <span className="pd-accordion-chevron">{expandedSpecs.has(key) ? '▾' : '▸'}</span>
                  </button>
                  <div className="pd-accordion-body">
                    <p>{val}</p>
                  </div>
                </div>
              ))}

              {/* Fallback: description as dropdown if no details or specs */}
              {detailItems.length === 0 && specsEntries.length === 0 && product.description && (
                <div className={`pd-accordion-item ${expandedSpecs.has('desc') ? 'open' : ''}`}>
                  <button className="pd-accordion-header" onClick={() => toggleSpec('desc')}>
                    <span>Description</span>
                    <span className="pd-accordion-chevron">{expandedSpecs.has('desc') ? '▾' : '▸'}</span>
                  </button>
                  <div className="pd-accordion-body">
                    <p>{product.description}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* SECTION 3: Reviews — Frosted Glass Card */}
        <section className="pd-glass-card pd-reviews">
          <div className="pd-reviews-header">
            <h2>Customer Reviews</h2>
            {reviewStats && reviewStats.total > 0 && (
              <div className="pd-reviews-avg">
                <span className="pd-reviews-avg-num">{reviewStats.avgRating.toFixed(1)}</span>
                <span className="pd-reviews-avg-stars">{'★'.repeat(Math.round(reviewStats.avgRating))}{'☆'.repeat(5 - Math.round(reviewStats.avgRating))}</span>
                <span className="pd-reviews-avg-count">({reviewStats.total})</span>
              </div>
            )}
          </div>

          <div className="pd-review-filters">
            <div className="pd-star-filters">
              {[5, 4, 3, 2, 1].map((star) => (
                <button
                  key={star}
                  className={`pd-star-btn ${starFilter === star ? 'active' : ''}`}
                  onClick={() => setStarFilter(starFilter === star ? null : star)}
                >
                  ★{star} {reviewStats && `(${reviewStats[`star${star}`] || 0})`}
                </button>
              ))}
            </div>
            <div className="pd-sort-options">
              {['relevant', 'best', 'worst'].map((opt) => (
                <button
                  key={opt}
                  className={`pd-sort-btn ${sortOption === opt ? 'active' : ''}`}
                  onClick={() => setSortOption(opt)}
                >
                  {opt === 'relevant' ? 'Most Relevant' : opt === 'best' ? 'Best' : 'Worst'}
                </button>
              ))}
            </div>
          </div>

          {reviews.length > 0 ? (
            <div className="pd-review-list">
              {reviews.map((review) => (
                <div key={review._id} className="pd-review-card">
                  <div className="pd-review-header">
                    <span className="pd-review-stars">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                    <span className="pd-review-author">{review.userId?.name || 'Customer'}</span>
                    <span className="pd-review-date">{new Date(review.createdAt).toLocaleDateString()}</span>
                  </div>
                  {review.title && <h4>{review.title}</h4>}
                  <p>{review.comment}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="pd-no-reviews">No reviews yet.</p>
          )}

          {user && !showReviewForm && (
            <button className="pd-write-review" onClick={() => { setShowReviewForm(true); setReviewError(''); }}>
              Write a Review
            </button>
          )}

          {showReviewForm && (
            <form className="pd-review-form" onSubmit={handleSubmitReview}>
              {reviewError && <p className="pd-review-error">{reviewError}</p>}
              <div className="pd-form-rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={`pd-form-star ${reviewForm.rating >= star ? 'filled' : ''}`}
                    onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                  >★</span>
                ))}
              </div>
              <input
                type="text"
                placeholder="Review title (optional)"
                value={reviewForm.title}
                onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
              />
              <textarea
                placeholder="Write your review..."
                value={reviewForm.comment}
                onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                required
              />
              <div className="pd-form-actions">
                <button type="submit">Submit Review</button>
                <button type="button" onClick={() => setShowReviewForm(false)}>Cancel</button>
              </div>
            </form>
          )}
        </section>

        {/* SECTION 4: Reward Program */}
        <section className="pd-reward" onClick={() => navigate('/rewards')}>
          <div className="pd-reward-badge">&#x1F3C6;</div>
          <div className="pd-reward-text">
            <h2>Reward Program</h2>
            <p>Earn points on every purchase. Click to learn more!</p>
          </div>
        </section>

        {/* SECTION 5: Recently Viewed */}
        {recentlyViewed.length > 0 && (
          <section className="pd-glass-card pd-recently-viewed">
            <h2>Recently Viewed</h2>
            <div className="product-row">
              {recentlyViewed.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          </section>
        )}

      </main>

      {/* Offers Popup Modal */}
      {showOffersPopup && (
        <div className="pd-offers-overlay" onClick={() => setShowOffersPopup(false)}>
          <div className="pd-offers-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pd-offers-modal-bar" />
            <button className="pd-offers-modal-close" onClick={() => setShowOffersPopup(false)}>✕</button>
            <h3>Available Offers</h3>
            <div className="pd-offers-list">
              {offers.map((offer, i) => (
                <div key={i} className="pd-offer-item">
                  <span className="pd-offer-bullet" />
                  {offer}
                </div>
              ))}
            </div>
            <button className="pd-offers-see-all">See All Offers</button>
          </div>
        </div>
      )}

      {/* Fullscreen Image Popup */}
      {showPopup && (
        <div className="pd-fullscreen" onClick={() => setShowPopup(false)}>
          <img src={allImages[selectedImage]} alt={product.name} onClick={(e) => e.stopPropagation()} />
          <button className="pd-fullscreen-close" onClick={() => setShowPopup(false)}>✕</button>
          {allImages.length > 1 && (
            <>
              <button className="pd-fs-prev" onClick={(e) => { e.stopPropagation(); setSelectedImage((s) => (s - 1 + allImages.length) % allImages.length); }}>‹</button>
              <button className="pd-fs-next" onClick={(e) => { e.stopPropagation(); setSelectedImage((s) => (s + 1) % allImages.length); }}>›</button>
            </>
          )}
        </div>
      )}

      <Footer />
    </div>
  );
};

export default ProductDetail;
