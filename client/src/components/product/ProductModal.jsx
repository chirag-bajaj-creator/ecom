import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useCart } from '../../contexts/CartContext';
import './ProductModal.css';

const ProductModal = ({ productId, onClose }) => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await api.get(`/products/${productId}`);
        setProduct(res.data.data.product);
      } catch (err) {
        console.error('Failed to fetch product:', err);
      } finally {
        setLoading(false);
      }
    };

    if (productId) fetchProduct();
  }, [productId]);

  const handleAddToCart = async () => {
    try {
      await addToCart(product._id, quantity, {
        _id: product._id,
        name: product.name,
        price: product.price,
        image: product.image,
        stock: product.stock,
        description: product.description,
      });
      onClose();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to add to cart');
    }
  };

  if (!productId) return null;

  return (
    <div className="product-modal-overlay" onClick={onClose}>
      <div className="product-modal" onClick={(e) => e.stopPropagation()}>
        <button className="product-modal-close" onClick={onClose}>✕</button>

        {loading ? (
          <div className="product-modal-loading">Loading...</div>
        ) : !product ? (
          <div className="product-modal-loading">Product not found</div>
        ) : (
          <>
            <div className="product-modal-image">
              {product.image ? (
                <img src={product.image} alt={product.name} />
              ) : (
                <div className="product-modal-placeholder" />
              )}
            </div>
            <div className="product-modal-details">
              <h2>{product.name}</h2>
              <p className="product-modal-price">₹{product.price}</p>
              <p className="product-modal-desc">{product.description}</p>
              <p className={`product-modal-stock ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}`}>
                {product.stock > 0 ? `In Stock (${product.stock})` : 'Out of Stock'}
              </p>

              <div className="product-modal-quantity">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                >
                  −
                </button>
                <span>{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                  disabled={quantity >= product.stock}
                >
                  +
                </button>
              </div>

              <button
                className="product-modal-add-cart"
                disabled={product.stock === 0}
                onClick={handleAddToCart}
              >
                {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProductModal;
