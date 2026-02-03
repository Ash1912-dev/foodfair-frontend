import React from 'react';

function Statistics({ orders }) {
  const total = orders.length;
  const pending = orders.filter(o => !o.served || !o.paid || !o.closed).length;
  const completed = orders.filter(o => o.served && o.paid && o.closed).length;

  return (
    <div className="stats">
      <div className="stat-item">
        <span className="stat-number">{total}</span>
        <span className="stat-label">TOTAL ORDERS</span>
      </div>
      <div className="stat-item">
        <span className="stat-number">{pending}</span>
        <span className="stat-label">PENDING</span>
      </div>
      <div className="stat-item">
        <span className="stat-number">{completed}</span>
        <span className="stat-label">COMPLETED</span>
      </div>
    </div>
  );
}

export default Statistics;