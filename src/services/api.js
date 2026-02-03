const BACKEND_URL = 'https://foodfair-backend.onrender.com/api';

// Menu APIs
export const getMenu = async () => {
  const res = await fetch(`${BACKEND_URL}/menu`);
  return res.json();
};

export const addMenuItem = async (item) => {
  const res = await fetch(`${BACKEND_URL}/menu`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item)
  });
  return res.json();
};

export const updateMenuItem = async (id, item) => {
  const res = await fetch(`${BACKEND_URL}/menu/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item)
  });
  return res.json();
};

export const deleteMenuItem = async (id) => {
  const res = await fetch(`${BACKEND_URL}/menu/${id}`, {
    method: 'DELETE'
  });
  return res.ok;
};

// Order APIs
export const getOrders = async () => {
  const res = await fetch(`${BACKEND_URL}/orders`);
  return res.json();
};

export const createOrder = async (order) => {
  const res = await fetch(`${BACKEND_URL}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order)
  });
  return res;
};

export const updateOrderStatus = async (id, field, value) => {
  const res = await fetch(`${BACKEND_URL}/orders/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ [field]: value })
  });
  return res.ok;
};

export const clearAllOrders = async () => {
  const res = await fetch(`${BACKEND_URL}/orders`, {
    method: 'DELETE'
  });
  return res.ok;
};

// Settings APIs
export const getSettings = async () => {
  const res = await fetch(`${BACKEND_URL}/settings`);
  return res.json();
};

export const updateSettings = async (settings) => {
  const res = await fetch(`${BACKEND_URL}/settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings)
  });
  return res.ok;
};

// Admin Auth
export const adminLogin = async (username, password) => {
  const res = await fetch(`${BACKEND_URL}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  return res;
};