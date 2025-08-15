import React, { useState } from 'react';

const ForgotPasswordPage = () => {
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('');
  const [message, setMessage] = useState('');

  const handleForgotPassword = async (e) => {
    e.preventDefault(); // ✅ Prevent default form submission
    console.log("🔍 Submitting Forgot Password Request:", { username, role });

    if (!username || !role) {
      setMessage("❌ Please fill all fields!");
      return;
    }

    try {
      const response = await fetch(process.env.REACT_APP_BACKEND_URL+"/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, role }),
      });

      const data = await response.json();
      console.log("✅ Server Response:", data);

      if (response.ok) {
        setMessage("✅ Check your email for reset instructions!");
      } else {
        setMessage(`❌ Error: ${data.message}`);
      }
    } catch (error) {
      console.error("❌ Forgot Password Error:", error);
      setMessage("❌ An error occurred.");
    }
  };

  return (
    <div>
      <h1>Forgot Password</h1>
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <select value={role} onChange={(e) => setRole(e.target.value)}>
        <option value="">Select Role</option>
        <option value="Maid">Maid</option>
        <option value="Carpenter">Carpenter</option>
        <option value="Laundry Worker">Laundry Worker</option>
        <option value="Customer">Customer</option>
      </select>
      <button onClick={handleForgotPassword}>Submit</button>
      {message && <p>{message}</p>}
    </div>
  );
};

export default ForgotPasswordPage;
