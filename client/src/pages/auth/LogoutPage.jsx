import { Link } from 'react-router-dom';
import './LogoutPage.css';

const LogoutPage = () => {
  return (
    <div className="logout-page">
      <div className="logout-card">
        <span className="logout-icon">👋</span>
        <h1>See You Soon!</h1>
        <p className="logout-message">
          Thank you for being with us. We hope you had a great experience!
        </p>
        <p className="logout-submessage">
          We're always here when you're ready to come back. Happy shopping awaits!
        </p>
        <Link to="/" className="logout-home-btn">
          Back to Home
        </Link>
      </div>
    </div>
  );
};

export default LogoutPage;
