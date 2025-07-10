import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import "./PageStyles.css";

const ChangeAddressPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Get the old address from the URL query parameter
  const oldAddress = searchParams.get('oldAddress');
  
  const [newAddress, setNewAddress] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Redirect if no oldAddress is found in the URL
  useEffect(() => {
    if (!oldAddress) {
      navigate('/select-address');
    }
  }, [oldAddress, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!newAddress.trim()) {
      setError('New address cannot be empty.');
      return;
    }

    try {
      const response = await fetch('/api/dash/user/address', {
        method: 'PUT', // Use PUT for updating data
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ oldAddress, newAddress }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update address.');
      }

      setMessage('Address updated successfully! Redirecting...');
      setTimeout(() => navigate('/dashboard'), 2000); // Redirect to dashboard after 2 seconds

    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="page-container">
      <div className="form-box">
        <h2>Change Address</h2>
        <p>Changing address for: <strong>{oldAddress}</strong></p>
        
        <form onSubmit={handleSubmit} className="form-container">
          <input
            type="text"
            placeholder="Enter the new address"
            value={newAddress}
            onChange={(e) => setNewAddress(e.target.value)}
          />
          <button type="submit">Update Address</button>
        </form>
        
        {message && <p style={{ color: 'lightgreen', marginTop: '10px' }}>{message}</p>}
        {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
      </div>
    </div>
  );
};

export default ChangeAddressPage;