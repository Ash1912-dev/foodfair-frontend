import React from 'react';
import { updateOrderStatus } from '../../services/api';
import { formatDateTime } from '../../utils/helpers';
import { io } from "socket.io-client";

function OrdersPanel({ orders, onUpdate }) {
  const handleStatusChange = async (id, field, value) => {
    try {
      await updateOrderStatus(id, field, value);
      onUpdate();
    } catch {
      alert("❌ Failed to update status");
    }
  };

  if (orders.length === 0) {
    return (
      <div className="orders-container">
        <div className="no-orders">
          <h3>📭 No Orders Found</h3>
          <p>No orders match this filter.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-container">
      {orders.map((order) => (
        <div key={order._id} className="order-card-admin">
          <div className="order-header">
            <div className="order-name">{order.name}</div>
            <div className="order-details">
              <div className="order-id">ID: {order.orderId}</div>
              <div className="order-time">{formatDateTime(order.timestamp)}</div>
            </div>
          </div>
          
          <div className="order-items">
            {order.items.map((item, idx) => (
              <div key={idx} className="order-item">
                <span>{item.name} x{item.quantity}</span>
                <span>₹{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          
          <div className="order-total">Total: ₹{order.total.toFixed(2)}</div>
          
          <div className="status-controls">
            <label>
              <input 
                type="checkbox" 
                checked={order.served || false}
                onChange={(e) => handleStatusChange(order._id, 'served', e.target.checked)}
              />
              {' '}Served
            </label>
            <label>
              <input 
                type="checkbox" 
                checked={order.paid || false}
                onChange={(e) => handleStatusChange(order._id, 'paid', e.target.checked)}
              />
              {' '}Paid
            </label>
            <label>
              <input 
                type="checkbox" 
                checked={order.closed || false}
                onChange={(e) => handleStatusChange(order._id, 'closed', e.target.checked)}
              />
              {' '}Closed
            </label>
          </div>
        </div>
      ))}
    </div>
  );
}

export default OrdersPanel;

const socket = io({ reconnection: true });

socket.on('new_order', (order) => {
  const container = document.querySelector('.orders-container');
  if (!container) return;
  
  const noOrders = container.querySelector('.no-orders');
  if (noOrders) noOrders.remove();

  const itemsHtml = order.items.map(item => `
    <div class="order-item">
      <span>${item.name} x${item.quantity}</span>
      <span>₹${(item.price * item.quantity).toFixed(2)}</span>
    </div>
  `).join('');

  const total = order.items.reduce((sum, i) => sum + (i.price * i.quantity), 0).toFixed(2);

  container.insertAdjacentHTML('afterbegin', `
    <div class="order-card-admin">
      <div class="order-header">
        <div class="order-name">${order.customerName}</div>
        <div class="order-details">
          <div class="order-id">ID: ${order.orderId}</div>
          <div class="order-time">${new Date().toLocaleString('en-IN')}</div>
        </div>
      </div>
      <div class="order-items">${itemsHtml}</div>
      <div class="order-total">Total: ₹${total}</div>
      <div class="status-controls">
        <label><input type="checkbox" /> Served</label>
        <label><input type="checkbox" /> Paid</label>
        <label><input type="checkbox" /> Closed</label>
      </div>
    </div>
  `);
});