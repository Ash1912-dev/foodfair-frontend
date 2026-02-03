import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import AdminLogin from './AdminLogin';
import OrdersPanel from './OrdersPanel';
import MenuManagement from './MenuManagement';
import Statistics from './Statistics';
import { getOrders, getSettings, updateSettings, clearAllOrders } from '../../services/api';
import { exportToCSV } from '../../utils/helpers';

const AUTO_LOGOUT_TIME = 10 * 60 * 1000; // 10 minutes

function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [orders, setOrders] = useState([]);
  const [allowOrdering, setAllowOrdering] = useState(true);
  const [currentFilter, setCurrentFilter] = useState('all');
  const [logoutTimer, setLogoutTimer] = useState(null);

  const startLogoutTimer = useCallback(() => {
    if (logoutTimer) clearTimeout(logoutTimer);
    
    const timer = setTimeout(() => {
      alert("⏳ Session expired due to inactivity.");
      handleLogout();
    }, AUTO_LOGOUT_TIME);
    
    setLogoutTimer(timer);
  }, [logoutTimer]);

  useEffect(() => {
    const loggedIn = localStorage.getItem('adminLoggedIn') === 'true';
    if (loggedIn) {
      setIsLoggedIn(true);
      loadOrders();
      loadOrderingStatus();
      startLogoutTimer();
    }
  }, [startLogoutTimer]);

  useEffect(() => {
    if (isLoggedIn) {
      const resetTimer = () => startLogoutTimer();
      ['click', 'keydown', 'mousemove'].forEach(event => {
        document.addEventListener(event, resetTimer);
      });

      return () => {
        ['click', 'keydown', 'mousemove'].forEach(event => {
          document.removeEventListener(event, resetTimer);
        });
      };
    }
  }, [isLoggedIn, startLogoutTimer]);

  const loadOrders = async () => {
    try {
      const data = await getOrders();
      setOrders(data);
    } catch (err) {
      console.error('Failed to load orders', err);
    }
  };

  const loadOrderingStatus = async () => {
    try {
      const data = await getSettings();
      setAllowOrdering(data.allowOrdering);
    } catch (err) {
      console.error('Failed to load settings', err);
    }
  };

  const handleLogin = () => {
    localStorage.setItem('adminLoggedIn', 'true');
    setIsLoggedIn(true);
    loadOrders();
    loadOrderingStatus();
    startLogoutTimer();
  };

  const handleLogout = () => {
    localStorage.removeItem('adminLoggedIn');
    if (logoutTimer) clearTimeout(logoutTimer);
    window.location.reload();
  };

  const handleToggleOrdering = async (checked) => {
    try {
      await updateSettings({ allowOrdering: checked });
      setAllowOrdering(checked);
      alert(`✅ Ordering is now ${checked ? 'ENABLED' : 'DISABLED'}`);
    } catch {
      alert("❌ Failed to update ordering status");
    }
  };

  const handleClearOrders = async () => {
    if (!window.confirm("⚠️ Delete ALL orders?")) return;

    try {
      const success = await clearAllOrders();
      if (success) {
        alert("✅ Orders cleared");
        loadOrders();
      } else {
        alert("❌ Failed to clear");
      }
    } catch {
      alert("❌ Error clearing orders");
    }
  };

  const handleExportReport = () => {
    if (orders.length === 0) {
      alert("No orders to export.");
      return;
    }
    exportToCSV(orders);
  };

  const getFilteredOrders = () => {
    if (currentFilter === 'pending') {
      return orders.filter(o => !o.served || !o.paid || !o.closed);
    }
    if (currentFilter === 'served') return orders.filter(o => o.served);
    if (currentFilter === 'paid') return orders.filter(o => o.paid);
    if (currentFilter === 'closed') return orders.filter(o => o.closed);
    return orders;
  };

  if (!isLoggedIn) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  return (
    <div className="container">
      <header className="header">
        <h1>⚙️ ADMIN CONTROL CENTER</h1>
        <p className="subtitle">MANAGE ALL ORDERS</p>
        <div className="admin-actions">
          <button onClick={loadOrders} className="btn-refresh">
            🔄 REFRESH ORDERS
          </button>
          <label>
            <input 
              type="checkbox" 
              checked={allowOrdering}
              onChange={(e) => handleToggleOrdering(e.target.checked)}
            />
            <span>🛒 Accepting Orders</span>
          </label>
          <button onClick={handleClearOrders} className="btn-clear">
            🗑 CLEAR ALL ORDERS
          </button>
          <button onClick={handleLogout}>🚪 Logout</button>
          <button onClick={handleExportReport}>📄 Export Daily Report</button>

          <Statistics orders={orders} />
        </div>
      </header>

      <div className="filters">
        {['all', 'pending', 'served', 'paid', 'closed'].map(filter => (
          <button 
            key={filter}
            className={`filter-btn ${currentFilter === filter ? 'active' : ''}`}
            onClick={() => setCurrentFilter(filter)}
          >
            {filter.toUpperCase()}
          </button>
        ))}
      </div>

      <OrdersPanel 
        orders={getFilteredOrders()} 
        onUpdate={loadOrders}
      />

      <MenuManagement />

      <footer className="footer">
        <p>© 2025 Aashay Vaidya. All Rights Reserved. | <Link to="/">← BACK TO CUSTOMER PAGE</Link></p>
      </footer>
    </div>
  );
}

export default AdminPage;
