import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-col">
          <h3 className="footer-brand">ShopKart</h3>
          <p>contact@shopkart.com</p>
          <p>+91 98765 43210</p>
        </div>

        <div className="footer-col">
          <h4>Quick Links</h4>
          <Link to="/add-to-cart">Cart</Link>
          <Link to="/wishlist">Wishlist</Link>
          <Link to="/about-us">About Us</Link>
          <Link to="/help">Help</Link>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; 2026 ShopKart. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
