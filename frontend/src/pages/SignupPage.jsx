import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './PageStyles.css';

const SignupPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    address: ''
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.username || !formData.password || !formData.email || !formData.role || !formData.address) {
      alert("All fields are required!");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      const response = await fetch(process.env.REACT_APP_BACKEND_URL+'/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData
        })
      });

      const data = await response.json();
      console.log("Server Response:", data);

      if (response.ok) {
        alert("Signup successful! Please log in.");
        navigate('/login'); // ✅ Redirects to Role Selection Page
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error("❌ Signup Error:", error);
      alert("An error occurred while signing up.");
    }
  };

  return (
    <div className="page-container">
      <h1 className="title">Sign Up</h1>
      <form className="form-container" onSubmit={handleSubmit}>
        <input type="text" name="username" placeholder="Username" onChange={handleChange} required />
        <input type="email" name="email" placeholder="Email" onChange={handleChange} required />
        <input type="password" name="password" placeholder="Password" onChange={handleChange} required />
        <input type="password" name="confirmPassword" placeholder="Confirm Password" onChange={handleChange} required />
        <select name="role" onChange={handleChange} required>
          <option value="">Select Role</option>
          <option value="Customer">Customer</option>
          <option value="Maid">Maid</option>
          <option value="Carpenter">Carpenter</option>
          <option value="Laundry Worker">Laundry Worker</option>
        </select>
        <input type="text" name="address" placeholder="Address" onChange={handleChange} required />
        <button type="submit">Sign Up</button>
      </form>
    </div>
  );
};

export default SignupPage;
