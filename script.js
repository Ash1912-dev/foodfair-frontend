const BACKEND_URL = 'https://foodfair-backend.onrender.com/api';
const AUTO_LOGOUT_TIME = 10 * 1000; // 15 minutes
let logoutTimer;


// --------------------- Utility ---------------------
function generateOrderId() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `ORD-${timestamp}-${random}`;
}

function formatDateTime(date) {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

// --------------------- Customer Page ---------------------
const form = document.getElementById('orderForm');
if (form) {
  const menuGrid = document.getElementById('menuGrid');
  const totalDisplay = document.getElementById('totalPrice');
  const selectedItemsDisplay = document.getElementById('selectedItems');
  const selectedItems = [];

  // Load menu from backend
  loadMenu();

  async function loadMenu() {
    try {
      const res = await fetch(`${BACKEND_URL}/menu`);
      const items = await res.json();

      menuGrid.innerHTML = items.map(item => `
        <div class="menu-item" data-name="${item.name}" data-price="${item.price}">
          <div class="menu-item-content">
            <span class="emoji">${item.emoji}</span>
            <h3>${item.name}</h3>
            <p class="description">${item.description}</p>
            <div class="price">₹${item.price}</div>
            <div class="quantity-controls">
              <button type="button" class="btn-minus">➖</button>
              <span class="item-qty">0</span>
              <button type="button" class="btn-plus">➕</button>
            </div>
          </div>
        </div>
      `).join('');

      bindQuantityButtons();
    } catch (err) {
      menuGrid.innerHTML = "<p>❌ Failed to load menu</p>";
    }
  }

  function bindQuantityButtons() {
    const menuItems = document.querySelectorAll('.menu-item');

    menuItems.forEach(item => {
      const itemName = item.dataset.name;
      const itemPrice = parseFloat(item.dataset.price);
      const plusBtn = item.querySelector('.btn-plus');
      const minusBtn = item.querySelector('.btn-minus');
      const qtySpan = item.querySelector('.item-qty');

      plusBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const existing = selectedItems.find(i => i.name === itemName);
        if (existing) {
          existing.quantity += 1;
        } else {
          selectedItems.push({ name: itemName, price: itemPrice, quantity: 1 });
        }
        qtySpan.textContent = getQty(itemName);
        updateCart();
      });

      minusBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const index = selectedItems.findIndex(i => i.name === itemName);
        if (index !== -1) {
          selectedItems[index].quantity -= 1;
          if (selectedItems[index].quantity <= 0) {
            selectedItems.splice(index, 1);
          }
        }
        qtySpan.textContent = getQty(itemName);
        updateCart();
      });
    });
  }

  function getQty(itemName) {
    const item = selectedItems.find(i => i.name === itemName);
    return item ? item.quantity : 0;
  }

  function updateCart() {
    const total = selectedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    totalDisplay.textContent = total.toFixed(2);
    selectedItemsDisplay.innerHTML = selectedItems.map(i =>
      `<li>${i.name} x${i.quantity} - ₹${(i.price * i.quantity).toFixed(2)}</li>`
    ).join('');
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(`${BACKEND_URL}/settings`);
      const data = await res.json();
      if (!data.allowOrdering) {
        alert("🛑 Ordering is currently disabled.");
        return;
      }
    } catch {
      alert("⚠️ Could not verify ordering status.");
      return;
    }

    const name = document.getElementById('name').value.trim();
    if (!name || selectedItems.length === 0) {
      alert("Please enter your name and select items.");
      return;
    }

    const order = {
      orderId: generateOrderId(),
      name,
      items: selectedItems,
      total: selectedItems.reduce((sum, i) => sum + i.price * i.quantity, 0),
      timestamp: new Date()
    };

    try {
      const res = await fetch(`${BACKEND_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order)
      });

      if (res.ok) {
        const resultDiv = document.getElementById('result');
        resultDiv.innerHTML = `
          <h3>🎉 Order Placed!</h3>
          <p><strong>Order ID:</strong> ${order.orderId}</p>
          <p><strong>Amount to Pay:</strong> ₹${order.total}</p>
          <p>Please show this Order ID at the counter.</p>`;
        resultDiv.classList.add('show');

        form.reset();
        selectedItems.length = 0;
        document.querySelectorAll('.item-qty').forEach(span => span.textContent = '0');
        totalDisplay.textContent = '0.00';
        selectedItemsDisplay.innerHTML = '';

        setTimeout(() => {
          resultDiv.classList.remove('show');
          resultDiv.innerHTML = '';
        }, 10000);
      } else {
        alert("Failed to place order.");
      }
    } catch {
      alert("❌ Network error.");
    }
  });
}



// --------------------- Admin Login Page ---------------------
const loginForm = document.getElementById('loginForm');
const loginSection = document.getElementById('loginSection');
const adminPanel = document.getElementById('adminPanel');

if (localStorage.getItem('adminLoggedIn') === 'true') {
  loginSection?.style?.setProperty('display', 'none');
  adminPanel?.style?.setProperty('display', 'block');
  bindAdminActions();
  loadOrders();
  loadOrderingStatus();
}

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('adminUser').value;
    const password = document.getElementById('adminPass').value;

    try {
      const res = await fetch(`${BACKEND_URL}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('adminLoggedIn', 'true');
        loginSection.style.display = 'none';
        adminPanel.style.display = 'block';
        bindAdminActions();
        loadOrders();
        loadOrderingStatus();
        startLogoutTimer();
      } else {
        alert(data.error || "❌ Invalid credentials.");
      }
    } catch {
      alert("❌ Login error");
    }
  });
  loadMenuItems();

}

function logoutAdmin() {
  localStorage.removeItem('adminLoggedIn');
  location.reload();
}

// --------------------- Admin Panel Logic ---------------------
let orders = [];
let currentFilter = 'all';
let editingMenuId = null;



async function loadMenuItems() {
  const res = await fetch(`${BACKEND_URL}/menu`);
  const items = await res.json();
  const container = document.getElementById('menuList');

  container.innerHTML = items.map(item => `
    <div class="menu-admin-item">
      <span>${item.emoji} <strong>${item.name}</strong> - ₹${item.price}</span>
      <div>
        <button onclick="editMenuItem('${item._id}', '${item.name}', '${item.emoji}', '${item.description}', ${item.price})">✏️</button>
        <button onclick="deleteMenuItem('${item._id}')">🗑️</button>
      </div>
    </div>
  `).join('');
}

function editMenuItem(id, name, emoji, description, price) {
  editingMenuId = id;
  document.getElementById('menuName').value = name;
  document.getElementById('menuEmoji').value = emoji;
  document.getElementById('menuDescription').value = description;
  document.getElementById('menuPrice').value = price;
}

async function deleteMenuItem(id) {
  if (!confirm("Delete this item?")) return;
  await fetch(`${BACKEND_URL}/menu/${id}`, { method: 'DELETE' });
  loadMenuItems();
}

document.getElementById('menuForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('menuName').value;
  const emoji = document.getElementById('menuEmoji').value;
  const description = document.getElementById('menuDescription').value;
  const price = parseFloat(document.getElementById('menuPrice').value);

  const payload = { name, emoji, description, price };

  const url = editingMenuId
    ? `${BACKEND_URL}/menu/${editingMenuId}`
    : `${BACKEND_URL}/menu`;
  const method = editingMenuId ? 'PUT' : 'POST';

  await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  editingMenuId = null;
  e.target.reset();
  loadMenuItems();
});


function startLogoutTimer() {
  clearTimeout(logoutTimer);
  logoutTimer = setTimeout(() => {
    alert("⏳ Session expired due to inactivity.");
    logoutAdmin();
  }, AUTO_LOGOUT_TIME);
}


function bindAdminActions() {
  document.getElementById('toggleOrder')?.addEventListener('change', toggleOrdering);
  document.getElementById('clearOrdersBtn')?.addEventListener('click', clearAllOrders);
  document.getElementById('logoutBtn')?.addEventListener('click', logoutAdmin);
  document.getElementById('refreshBtn')?.addEventListener('click', loadOrders);

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      currentFilter = this.dataset.filter;
      renderOrders();
    });
  });
}

async function loadOrders() {
  const ordersContainer = document.getElementById('orders');
  try {
    const res = await fetch(`${BACKEND_URL}/orders`);
    orders = await res.json();
    updateStats();
    renderOrders();
  } catch {
    ordersContainer.innerHTML = '<p>❌ Failed to load orders.</p>';
  }
}

function updateStats() {
  const total = orders.length;
  const pending = orders.filter(o => !o.served || !o.paid || !o.closed).length;
  const completed = orders.filter(o => o.served && o.paid && o.closed).length;

  document.getElementById('totalOrders').textContent = total;
  document.getElementById('pendingOrders').textContent = pending;
  document.getElementById('completedOrders').textContent = completed;
}

function renderOrders() {
  const container = document.getElementById('orders');

  const filtered = orders.filter(order => {
    if (currentFilter === 'pending') return !order.served || !order.paid || !order.closed;
    if (currentFilter === 'served') return order.served;
    if (currentFilter === 'paid') return order.paid;
    if (currentFilter === 'closed') return order.closed;
    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div class="no-orders"><h3>📭 No Orders Found</h3><p>No orders match this filter.</p></div>`;
    return;
  }

  container.innerHTML = filtered.map(order => `
    <div class="order-card-admin">
      <div class="order-header">
        <div class="order-name">${order.name}</div>
        <div class="order-details">
          <div class="order-id">ID: ${order.orderId}</div>
          <div class="order-time">${formatDateTime(new Date(order.timestamp))}</div>
        </div>
      </div>
      <div class="order-items">
        ${order.items.map(i => `
          <div class="order-item">
            <span>${i.name} x${i.quantity}</span>
            <span>₹${(i.price * i.quantity).toFixed(2)}</span>
          </div>
        `).join('')}
      </div>
      <div class="order-total">Total: ₹${order.total.toFixed(2)}</div>
      <div class="status-controls">
        <label><input type="checkbox" ${order.served ? 'checked' : ''} onchange="updateStatus('${order._id}', 'served', this.checked)"> Served</label>
        <label><input type="checkbox" ${order.paid ? 'checked' : ''} onchange="updateStatus('${order._id}', 'paid', this.checked)"> Paid</label>
        <label><input type="checkbox" ${order.closed ? 'checked' : ''} onchange="updateStatus('${order._id}', 'closed', this.checked)"> Closed</label>
      </div>
    </div>
  `).join('');
}

async function updateStatus(id, field, value) {
  try {
    await fetch(`${BACKEND_URL}/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value })
    });

    const order = orders.find(o => o._id === id);
    if (order) order[field] = value;
    updateStats();
    renderOrders();
  } catch {
    alert("❌ Failed to update status");
  }
}

async function clearAllOrders() {
  if (!confirm("⚠️ Delete ALL orders?")) return;

  try {
    const res = await fetch(`${BACKEND_URL}/orders`, { method: 'DELETE' });
    if (res.ok) {
      alert("✅ Orders cleared");
      loadOrders();
    } else {
      alert("❌ Failed to clear");
    }
  } catch {
    alert("❌ Error clearing orders");
  }
}

async function toggleOrdering() {
  const allowOrdering = document.getElementById('toggleOrder').checked;
  try {
    await fetch(`${BACKEND_URL}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ allowOrdering })
    });
    alert(`✅ Ordering is now ${allowOrdering ? 'ENABLED' : 'DISABLED'}`);
  } catch {
    alert("❌ Failed to update ordering status");
  }
}

async function loadOrderingStatus() {
  try {
    const res = await fetch(`${BACKEND_URL}/settings`);
    const data = await res.json();
    document.getElementById('toggleOrder').checked = data.allowOrdering;
  } catch {
    console.error("❌ Could not fetch ordering status");
  }
}

// --------------------- Daily Report Export ---------------------
document.getElementById('exportReportBtn')?.addEventListener('click', exportDailyReport);

async function exportDailyReport() {
  try {
    const res = await fetch(`${BACKEND_URL}/orders`);
    const orders = await res.json();

    if (orders.length === 0) {
      alert("No orders to export.");
      return;
    }

    let csvContent = "Order ID,Customer Name,Item Name,Quantity,Price,Total,Timestamp,Served,Paid,Closed\n";

    orders.forEach(order => {
      order.items.forEach(item => {
        csvContent += `${order.orderId},"${order.name}","${item.name}",${item.quantity},${item.price},${order.total},"${new Date(order.timestamp).toLocaleString()}",${order.served ? 'Yes' : 'No'},${order.paid ? 'Yes' : 'No'},${order.closed ? 'Yes' : 'No'}\n`;
      });
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'daily_report.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('❌ Failed to export report:', error);
    alert("❌ Could not export report.");
  }
}

['click', 'keydown', 'mousemove'].forEach(event => {
  document.addEventListener(event, () => {
    if (localStorage.getItem('adminLoggedIn') === 'true') {
      startLogoutTimer();
    }
  });
});



