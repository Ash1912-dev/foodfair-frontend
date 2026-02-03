import React, { useState, useEffect } from 'react';
import { getMenu, addMenuItem, updateMenuItem, deleteMenuItem } from '../../services/api';

function MenuManagement() {
  const [menuItems, setMenuItems] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    emoji: '',
    description: '',
    price: ''
  });

  useEffect(() => {
    loadMenuItems();
  }, []);

  const loadMenuItems = async () => {
    try {
      const items = await getMenu();
      setMenuItems(items);
    } catch (err) {
      console.error('Failed to load menu items', err);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    setFormData({
      name: item.name,
      emoji: item.emoji,
      description: item.description,
      price: item.price
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this item?")) return;
    
    try {
      await deleteMenuItem(id);
      loadMenuItems();
    } catch (err) {
      alert("❌ Failed to delete item");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      name: formData.name,
      emoji: formData.emoji,
      description: formData.description,
      price: parseFloat(formData.price)
    };

    try {
      if (editingId) {
        await updateMenuItem(editingId, payload);
      } else {
        await addMenuItem(payload);
      }
      
      setEditingId(null);
      setFormData({ name: '', emoji: '', description: '', price: '' });
      loadMenuItems();
    } catch (err) {
      alert("❌ Failed to save menu item");
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="menu-admin-panel">
      <h2>🍽️ Manage Menu</h2>
      <form id="menuForm" onSubmit={handleSubmit}>
        <input 
          type="text" 
          name="name"
          placeholder="Item Name" 
          value={formData.name}
          onChange={handleChange}
          required 
        />
        <input 
          type="text" 
          name="emoji"
          placeholder="Pic" 
          value={formData.emoji}
          onChange={handleChange}
          required 
        />
        <input 
          type="text" 
          name="description"
          placeholder="Description" 
          value={formData.description}
          onChange={handleChange}
        />
        <input 
          type="number" 
          name="price"
          placeholder="Price" 
          value={formData.price}
          onChange={handleChange}
          required 
        />
        <button type="submit">
          {editingId ? 'Update Item' : 'Add Item'}
        </button>
      </form>

      <div id="menuList" className="menu-list">
        {menuItems.map((item) => (
          <div key={item._id} className="menu-admin-item">
            <span>
              {item.emoji} <strong>{item.name}</strong> - ₹{item.price}
            </span>
            <div>
              <button onClick={() => handleEdit(item)}>✏️</button>
              <button onClick={() => handleDelete(item._id)}>🗑️</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MenuManagement;