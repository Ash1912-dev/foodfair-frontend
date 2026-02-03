import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CustomerPage from './components/customer/CustomerPage';
import AdminPage from './components/admin/AdminPage';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<CustomerPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </Router>
  );
}

export default App;