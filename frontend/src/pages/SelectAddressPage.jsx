import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./PageStyles.css"; // Assuming you have general styles here

const SelectAddressPage = () => {
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const response = await fetch("/api/dash/user/addresses", {
          credentials: "include",
        });
        if (!response.ok) throw new Error("Could not fetch addresses.");
        const data = await response.json();
        setAddresses(data.addresses || []);
      } catch (error) {
        console.error(error);
        navigate("/login");
      }
    };
    fetchAddresses();
  }, [navigate]);

  const handleSelect = () => {
    if (!selectedAddress) {
      alert("Please select an address to change.");
      return;
    }
    // ✅ THIS IS THE CHANGE: Navigate to the new page with the old address in the URL
    navigate(`/change-address?oldAddress=${encodeURIComponent(selectedAddress)}`);
  };

  return (
    <div className="page-container">
      <div className="form-box">
        <h2>Select an Address to Change</h2>
        <div className="address-list">
          {addresses.length > 0 ? (
            addresses.map((addr, index) => (
              <label key={index} className="address-option">
                <input
                  type="radio"
                  name="address"
                  value={addr}
                  checked={selectedAddress === addr}
                  onChange={(e) => setSelectedAddress(e.target.value)}
                />
                {addr}
              </label>
            ))
          ) : (
            <p>No addresses found.</p>
          )}
        </div>
        <button className="btn" onClick={handleSelect} disabled={!selectedAddress}>
          Next
        </button>
      </div>
    </div>
  );
};

export default SelectAddressPage;