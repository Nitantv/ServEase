import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [token, setToken] = useState("");

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const resetToken = urlParams.get("token");
    if (!resetToken) {
      alert("Invalid or expired reset link!");
      navigate("/forgot-password");
    }
    setToken(resetToken);
  }, [navigate]);

  const handleResetPassword = async () => {
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();
      console.log("Server Response:", data);

      if (response.ok) {
        alert("Password reset successful! You can now log in.");
        navigate("/login");
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error("❌ Reset Password Error:", error);
      alert("An error occurred while resetting password.");
    }
  };

  return (
    <div>
      <h2>Reset Password</h2>
      <input
        type="password"
        placeholder="Enter New Password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
      />
      <input
        type="password"
        placeholder="Confirm New Password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />
      <button onClick={handleResetPassword}>Reset Password</button>
    </div>
  );
};

export default ResetPasswordPage;
