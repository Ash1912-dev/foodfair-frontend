import React, { useState } from 'react';
import { adminLogin } from '../../services/api';

function AdminLogin({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await adminLogin(username, password);
      const data = await res.json();

      if (res.ok) {
        onLogin();
      } else {
        alert(data.error || "❌ Invalid credentials.");
      }
    } catch {
      alert("❌ Login error");
    }
  };

  return (
    <div className="container">
      <div id="loginSection">
        <h2>🔐 Admin Login</h2>
        <form id="loginForm" onSubmit={handleSubmit}>
          <input 
            type="text" 
            placeholder="Username" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required 
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required 
          />
          <button type="submit">Login</button>
        </form>
      </div>
    </div>
  );
}

export default AdminLogin;