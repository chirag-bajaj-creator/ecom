import { useCart } from '../../contexts/CartContext';
import './ProductCard.css';

const ProductCard = ({ product, onProductClick }) => {
  const { addToCart, addToWishlist } = useCart();

  const handleAddToCart = async (e) => {
    e.stopPropagation();
    try {
      await addToCart(product._id, 1, {
        _id: product._id,
        name: product.name,
        price: product.price,
        image: product.image,
        stock: product.stock,
        description: product.description,
      });
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to add to cart');
    }
  };

  const handleWishlist = async (e) => {
    e.stopPropagation();
    try {
      await addToWishlist(product._id, {
        _id: product._id,
        name: product.name,
        price: product.price,
        image: product.image,
        stock: product.stock,
        description: product.description,
      });
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to add to wishlist');
    }
  };

  return (
    <div className="product-card" onClick={() => onProductClick(product._id)}>
      <div className="product-card-image">
        {product.image ? (
          <img src={product.image} alt={product.name} />
        ) : (
          <div className="product-card-placeholder" />
        )}
      </div>
      <div className="product-card-info">
        <h3 className="product-card-name">{product.name}</h3>
        <p className="product-card-price">₹{product.price}</p>
      </div>
      <div className="product-card-actions">
        <button className="btn-add-cart" onClick={handleAddToCart}>
          Add to Cart
        </button>
        <button className="btn-wishlist" onClick={handleWishlist}>
          ♡
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
