import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import "./PageStyles.css";

const ChangeEmailPage = () => {
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const storedUserInfo = localStorage.getItem('userInfo');
    if (storedUserInfo) {
      const user = JSON.parse(storedUserInfo);
      setEmail(user.email);
    } else {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    if (!email) {
      setError("Email cannot be empty.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/dash/user/email', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ newEmail: email })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "An error occurred.");
      }
      
      localStorage.setItem('userInfo', JSON.stringify(data.user));
      setSuccess(data.message + " Redirecting...");
      setTimeout(() => navigate('/dashboard'), 2000);

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="form-box">
        <h2>Change Your Email Address</h2>
        <form onSubmit={handleSubmit}>
          <label htmlFor="email">Email Address</label>
          <input 
            type="email" 
            id="email"
            placeholder="Enter your new email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          
          <button type="submit" className="btn-submit-profile" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>

        {success && <p style={{ color: 'lightgreen', marginTop: '15px' }}>{success}</p>}
        {error && <p style={{ color: 'red', marginTop: '15px' }}>{error}</p>}
        
        <button className="btn-link" style={{marginTop: '20px'}} onClick={() => navigate('/dashboard')}>
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );
};

// ✅✅✅ --- CRITICAL CHECK: Ensure this line exists and is correct. --- ✅✅✅
export default ChangeEmailPage;