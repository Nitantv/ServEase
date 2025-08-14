import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './PageStyles.css';

const LoginPage = () => {
  const [role, setRole] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!role) {
      alert('Please select a role!');
      return;
    }
    if (!username || !password) {
      alert('Please fill in all fields!');
      return;
    }
  
    try {
      const response = await fetch('http://localhost:5000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password, role }),
      });
  
      const data = await response.json();
      if (response.ok) {
        // ✅ CRITICAL STEP: Save the user's info to localStorage
        // This makes the user's role available to other pages.
        localStorage.setItem('userInfo', JSON.stringify({ username, role }));

        alert('Login successful!');
        navigate('/dashboard');
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error)
    {
      console.error('Login Error:', error);
      alert('An error occurred while logging in.');
    }
  };
  
  // Logout function to clear localStorage
  const handleLogout = () => {
    // This should be called from the dashboard's logout button
    localStorage.removeItem('userInfo');
    fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    }).then(() => {
      navigate('/login');
    });
  };

  return (
    <div className="page-container">
      <div className="form-box">
        <h1 className="title">Select Your Role</h1>
        {!role ? (
          <div className="role-selection">
            <button className="role-btn" onClick={() => setRole('Customer')}>Customer</button>
            <button className="role-btn" onClick={() => setRole('Maid')}>Maid</button>
            <button className="role-btn" onClick={() => setRole('Carpenter')}>Carpenter</button>
            <button className="role-btn" onClick={() => setRole('Laundry Worker')}>Laundry Worker</button>
          </div>
        ) : (
          <>
            <h2 className="title">Login as {role}</h2>
            <div className="form-container">
              <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
              <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
              <button onClick={handleLogin}>Login</button>
              <button className="btn-link" onClick={() => navigate("/forgot-password")}>Forgot Password?</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LoginPage;