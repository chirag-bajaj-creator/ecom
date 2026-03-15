import './ProductCard.css';

const SkeletonCard = () => {
  return (
    <div className="product-card skeleton">
      <div className="skeleton-image" />
      <div className="skeleton-text skeleton-title" />
      <div className="skeleton-text skeleton-price" />
      <div className="skeleton-text skeleton-btn" />
    </div>
  );
};

export default SkeletonCard;
