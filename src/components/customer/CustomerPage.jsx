import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMenu, createOrder, getSettings } from '../../services/api';
import { generateOrderId } from '../../utils/helpers';

function CustomerPage() {
  const [menu, setMenu] = useState([]);
  const [name, setName] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadMenu();
  }, []);

  const loadMenu = async () => {
    try {
      const items = await getMenu();
      setMenu(items);
    } catch (err) {
      console.error('Failed to load menu', err);
    }
  };

  const getQty = (itemName) => {
    const item = selectedItems.find(i => i.name === itemName);
    return item ? item.quantity : 0;
  };

  const handlePlus = (item) => {
    const existing = selectedItems.find(i => i.name === item.name);
    if (existing) {
      setSelectedItems(selectedItems.map(i => 
        i.name === item.name ? { ...i, quantity: i.quantity + 1 } : i
      ));
    } else {
      setSelectedItems([...selectedItems, { 
        name: item.name, 
        price: item.price, 
        quantity: 1 
      }]);
    }
  };

  const handleMinus = (itemName) => {
    const existing = selectedItems.find(i => i.name === itemName);
    if (existing) {
      if (existing.quantity === 1) {
        setSelectedItems(selectedItems.filter(i => i.name !== itemName));
      } else {
        setSelectedItems(selectedItems.map(i => 
          i.name === itemName ? { ...i, quantity: i.quantity - 1 } : i
        ));
      }
    }
  };

  const calculateTotal = () => {
    return selectedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const settings = await getSettings();
      if (!settings.allowOrdering) {
        alert("🛑 Ordering is currently disabled.");
        return;
      }
    } catch {
      alert("⚠️ Could not verify ordering status.");
      return;
    }

    if (!name.trim() || selectedItems.length === 0) {
      alert("Please enter your name and select items.");
      return;
    }

    setLoading(true);

    const order = {
      orderId: generateOrderId(),
      name: name.trim(),
      items: selectedItems,
      total: calculateTotal(),
      timestamp: new Date()
    };

    try {
      const res = await createOrder(order);
      if (res.ok) {
        setResult({
          orderId: order.orderId,
          total: order.total
        });
        setName('');
        setSelectedItems([]);

        setTimeout(() => setResult(null), 10000);
      } else {
        alert("Failed to place order.");
      }
    } catch {
      alert("❌ Network error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <header className="header">
        <h1>🎪 FoodFair Snacks</h1>
        <p className="subtitle">Order your favorite snacks and enjoy the funfair!</p>
      </header>

      <div className="order-card">
        <form id="orderForm" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">👤 Your Name</label>
            <input 
              type="text" 
              id="name" 
              placeholder="Enter your name" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required 
            />
          </div>

          <div className="form-group">
            <label>🍽️ Choose Your Snacks</label>
            <div className="menu-grid">
              {menu.map((item) => (
                <div key={item._id} className="menu-item">
                  <div className="menu-item-content">
                    <span className="emoji">{item.emoji}</span>
                    <h3>{item.name}</h3>
                    <p className="description">{item.description}</p>
                    <div className="price">₹{item.price}</div>
                    <div className="quantity-controls">
                      <button 
                        type="button" 
                        className="btn-minus"
                        onClick={() => handleMinus(item.name)}
                      >
                        ➖
                      </button>
                      <span className="item-qty">{getQty(item.name)}</span>
                      <button 
                        type="button" 
                        className="btn-plus"
                        onClick={() => handlePlus(item)}
                      >
                        ➕
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="total-section">
            <div id="totalPrice">Total: ₹{calculateTotal()}</div>
            <div className="selected-items">
              <ul>
                {selectedItems.map((item, idx) => (
                  <li key={idx}>
                    {item.name} x{item.quantity} - ₹{(item.price * item.quantity).toFixed(2)}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <button type="submit" className={`btn-order ${loading ? 'loading' : ''}`}>
            <span className="btn-text">🎉 Place Order</span>
            <div className="btn-loading">
              <div className="spinner"></div>
              Processing...
            </div>
          </button>
        </form>

        {result && (
          <div className="result show">
            <h3>🎉 Order Placed!</h3>
            <p><strong>Order ID:</strong> {result.orderId}</p>
            <p><strong>Amount to Pay:</strong> ₹{result.total}</p>
            <p>Please show this Order ID at the counter.</p>
          </div>
        )}
      </div>

      <footer className="footer">
        <p>© 2025 Aashay Vaidya. All Rights Reserved.</p>
        <p style={{ fontSize: '0.7rem', textAlign: 'center' }}>
          <Link to="/admin" style={{ color: 'gray', textDecoration: 'none' }}>
            System Login
          </Link>
        </p>
      </footer>
    </div>
  );
}

export default CustomerPage;