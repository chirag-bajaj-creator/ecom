import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import './RewardProgram.css';

const RewardProgram = () => {
  return (
    <div className="reward-page">
      <Navbar />
      <main className="reward-container">
        <div className="reward-hero">
          <div className="reward-hero-badge">🏆</div>
          <h1>ChiragKart Reward Program</h1>
          <p>Earn points, unlock rewards, save more!</p>
        </div>

        <div className="reward-tiers">
          <div className="reward-tier">
            <div className="tier-icon">🥉</div>
            <h3>Bronze</h3>
            <p>0 - 500 points</p>
            <ul>
              <li>1 point per ₹100 spent</li>
              <li>Birthday bonus 50 points</li>
            </ul>
          </div>
          <div className="reward-tier">
            <div className="tier-icon">🥈</div>
            <h3>Silver</h3>
            <p>500 - 2000 points</p>
            <ul>
              <li>2 points per ₹100 spent</li>
              <li>Free delivery on all orders</li>
              <li>Early access to sales</li>
            </ul>
          </div>
          <div className="reward-tier">
            <div className="tier-icon">🥇</div>
            <h3>Gold</h3>
            <p>2000+ points</p>
            <ul>
              <li>3 points per ₹100 spent</li>
              <li>Exclusive deals</li>
              <li>Priority customer support</li>
              <li>Free returns</li>
            </ul>
          </div>
        </div>

        <div className="reward-how">
          <h2>How It Works</h2>
          <div className="reward-steps">
            <div className="reward-step">
              <span>1</span>
              <p>Shop on ChiragKart</p>
            </div>
            <div className="reward-step">
              <span>2</span>
              <p>Earn points on every purchase</p>
            </div>
            <div className="reward-step">
              <span>3</span>
              <p>Redeem points for discounts</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default RewardProgram;
