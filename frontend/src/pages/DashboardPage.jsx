import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiSettings } from "react-icons/fi";
import "./PageStyles.css";

// Helper function to format time from minutes to a readable AM/PM format
const formatTime = (minutes) => {
  if (typeof minutes !== 'number') return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const hours12 = h % 12 === 0 ? 12 : h % 12;
  const modifier = h < 12 ? 'AM' : 'PM';
  const paddedMinutes = m < 10 ? `0${m}` : m;
  return `${hours12}:${paddedMinutes} ${modifier}`;
};

const DashboardPage = () => {
  // --- State Management ---
  const [userInfo, setUserInfo] = useState(null);
  const [showOptions, setShowOptions] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Maid'); // Default search tab for customers
  const [workers, setWorkers] = useState([]);
  const [workerProfile, setWorkerProfile] = useState(null);
  const [upcomingBookings, setUpcomingBookings] = useState([]); // Single source of truth for bookings

  const navigate = useNavigate();

  // --- Effects ---

  // Effect 1: Get user info from localStorage on initial component load
  useEffect(() => {
    const storedUserInfo = localStorage.getItem('userInfo');
    if (storedUserInfo) {
      setUserInfo(JSON.parse(storedUserInfo));
    } else {
      navigate('/login'); // If no user info, redirect to login
    }
  }, [navigate]);
  
  // Effect 2: Main data-fetching logic, runs once userInfo is available
  useEffect(() => {
    if (!userInfo) return; // Don't run if user info isn't loaded yet

    const fetchAllData = async () => {
      setIsLoading(true);
      // Reset states to prevent showing stale data from a previous user
      setWorkerProfile(null);
      setUpcomingBookings([]);
      
      try {
        // Fetch addresses (relevant for all users)
        const addressesRes = await fetch("/api/dash/user/addresses", { credentials: "include" });
        if (addressesRes.ok) {
          setAddresses((await addressesRes.json()).addresses || []);
        }
        
        // Fetch data specific to the user's role
        if (userInfo.role === 'Customer') {
          const bookingsRes = await fetch("/api/dash/customer/my-bookings", { credentials: "include" });
          if (bookingsRes.ok) {
            setUpcomingBookings(await bookingsRes.json());
          }
        } else { // User is a Worker
          // Fetch the worker's professional profile
          const profileRes = await fetch("/api/dash/worker/my-profile", { credentials: "include" });
          if (profileRes.ok) {
            setWorkerProfile(await profileRes.json());
          }
          // Fetch the worker's upcoming bookings
          const bookingsRes = await fetch("/api/dash/worker/my-bookings", { credentials: "include" });
          console.log(bookingsRes);
          if (bookingsRes.ok) {
            setUpcomingBookings(await bookingsRes.json());
          }
        }
      } catch (error) {
        console.error("An error occurred during data fetching:", error);
      } finally {
        setIsLoading(false); // Ensure loading is turned off even if an error occurs
      }
    };
    
    fetchAllData();
  }, [userInfo, navigate]);

  // Effect 3: Fetch workers for the customer search view
  useEffect(() => {
    if (userInfo?.role !== 'Customer' || !selectedAddress || !activeTab) {
      setWorkers([]);
      return;
    }
    const fetchWorkers = async () => {
      setIsLoading(true);
      setWorkers([]);
      const apiUrl = `/api/dash/workers?role=${activeTab}&address=${encodeURIComponent(selectedAddress)}`;
      try {
        const response = await fetch(apiUrl, { credentials: "include" });
        if (!response.ok) throw new Error('Failed to fetch workers');
        setWorkers(await response.json());
      } catch (error) {
        console.error("Error fetching workers:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchWorkers();
  }, [activeTab, selectedAddress, userInfo]);


  // --- Action Handlers ---

  const handleAddressChange = (event) => {
    const value = event.target.value;
    if (value === "add_new") navigate("/add-address");
    else setSelectedAddress(value);
  };

  const handleLogout = async () => {
    try {
      // 1. Tell the backend to clear the secure authentication cookie.
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      // 2. Clear all local session information.
      localStorage.removeItem('userInfo');
      localStorage.removeItem('pendingBooking'); // Clean up old deprecated data

      // 3. Redirect to the login page.
      navigate('/login');
    } catch (error) {
      console.error("Logout failed:", error);
      // Force a local logout even if the backend call fails
      localStorage.removeItem('userInfo');
      localStorage.removeItem('pendingBooking');
      navigate('/login');
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;
    try {
      const response = await fetch(`/api/dash/booking/${bookingId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to cancel booking.');
      }
      // Optimistic UI update: remove the booking from the list immediately.
      setUpcomingBookings(currentBookings => 
        currentBookings.filter(booking => booking._id !== bookingId)
      );
      alert("Booking cancelled successfully!");
    } catch (error) {
      console.error("Cancellation Error:", error);
      alert(`Could not cancel booking: ${error.message}`);
    }
  };

  // ===================================================================
  // RENDER COMPONENTS (Sub-components for clean JSX)
  // ===================================================================

  const UpcomingBookingCard = ({ booking, role }) => (
    <div className="booking-info-card">
      {role === 'Customer' && <p><strong>Worker:</strong> {booking.workerId?.username || 'N/A'}</p>}
      {role !== 'Customer' && <p><strong>Customer:</strong> {booking.customerId?.username || 'N/A'}</p>}
      <p><strong>Date:</strong> {new Date(booking.bookingDate).toLocaleDateString(undefined, { timeZone: 'UTC', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      <p><strong>Time:</strong> {formatTime(booking.startTimeMinutes)} - {formatTime(booking.endTimeMinutes)}</p>
      <p><strong>Location:</strong> {booking.address}</p>
      <p><strong>Cost:</strong> ${booking.cost ? Number(booking.cost).toFixed(2) : '0.00'}</p>
      <button className="btn-cancel-booking-small" onClick={() => handleCancelBooking(booking._id)}>Cancel</button>
    </div>
  );

  const CustomerDashboard = () => (
    <>
      <div className="worker-bookings-section">
        <h2>Your Upcoming Bookings</h2>
        <div className="bookings-list">
          {upcomingBookings.length > 0 ? (
            upcomingBookings.map(booking => (
              <UpcomingBookingCard key={booking._id} booking={booking} role="Customer" />
            ))
          ) : (
            <p>{isLoading ? 'Loading bookings...' : 'You have no upcoming bookings.'}</p>
          )}
        </div>
      </div>
      <div className="customer-section">
        <h2>Book a New Service</h2>
        <div className="worker-tabs">
          <button className={activeTab === 'Maid' ? 'active' : ''} onClick={() => setActiveTab('Maid')}>Maids</button>
          <button className={activeTab === 'Carpenter' ? 'active' : ''} onClick={() => setActiveTab('Carpenter')}>Carpenters</button>
          <button className={activeTab === 'Laundry Worker' ? 'active' : ''} onClick={() => setActiveTab('Laundry Worker')}>Laundry</button>
        </div>
        <div className="workers-list">
          {isLoading && activeTab && <p>Loading workers...</p>}
          {!selectedAddress && activeTab && <p>Please select your address to see available workers.</p>}
          {!isLoading && workers.length === 0 && activeTab && selectedAddress && <p>No {activeTab.toLowerCase()}s found for this address.</p>}
          {workers.map(worker => (
            <div key={worker._id} className="worker-card">
              <h3>{worker.username}</h3>
              <button
                onClick={() => navigate(`/worker-profile/${worker._id}?address=${encodeURIComponent(selectedAddress)}`)}
                disabled={!selectedAddress}
              >
                View Profile & Slots
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
  
  // ✅✅✅ --- THE LOGIC IS UPDATED HERE --- ✅✅✅
  const WorkerDashboard = () => {
    // This is the new, more specific condition for locking the button.
    const isUpdateButtonLocked = 
      // Condition 1: Is there a pending change scheduled for the future?
      (workerProfile?.slotsEffectiveDate && new Date(workerProfile.slotsEffectiveDate) > new Date()) &&
      // Condition 2: AND does an active schedule already exist?
      (workerProfile?.serviceSlots?.length > 0);
    
    // Format the date for the helper message.
    const effectiveDateString = isUpdateButtonLocked
      ? new Date(workerProfile.slotsEffectiveDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })
      : '';

    return (
      <>
        <div className="worker-profile-section">
          <h2>Your Professional Details</h2>
          <div className="profile-details-grid">
            <div className="detail-item">
              <span className="detail-label">Cost per Hour:</span>
              <span className="detail-value">${workerProfile?.cost || 'Not Set'}</span>
            </div>
          </div>
          <h3 className="service-slots-title">Your Service Slots per Address</h3>
          <div className="service-slots-list">
            {workerProfile?.serviceSlots && workerProfile.serviceSlots.length > 0 ? (
              workerProfile.serviceSlots.map((slot, index) => (
                <div key={index} className="slot-card">
                  <p><strong>Address:</strong> {slot.address}</p>
                  <p><strong>Time:</strong> {slot.serviceStartTime} - {slot.serviceEndTime}</p>
                </div>
              ))
            ) : (
              <p>You have not set any specific service slots. Please add your details.</p>
            )}
          </div>
          
          {/* Show the helper message only when the button is actually locked */}
          {isUpdateButtonLocked && (
            <p className="pending-change-notice">
              You have a pending schedule change that will become active on {effectiveDateString}. 
              You can make new updates after this date.
            </p>
          )}

          <button 
            className="btn-update-details" 
            onClick={() => navigate('/update-worker-details')}
            disabled={isUpdateButtonLocked} // Use the new, more specific condition
          >
            Add / Update Details
          </button>
        </div>
        
        <div className="worker-bookings-section">
          <h2>Your Upcoming Bookings</h2>
          <div className="bookings-list">
            {upcomingBookings && upcomingBookings.length > 0 ? (
              upcomingBookings.map(booking => (
                <UpcomingBookingCard key={booking._id} booking={booking} role="Worker" />
              ))
            ) : (
              <p>{isLoading ? 'Loading...' : 'You have no upcoming bookings.'}</p>
            )}
          </div>
        </div>
      </>
    );
  };

  // --- Main Render ---

  if (!userInfo) return <div className="loading-page">Loading...</div>;

  return (
    <div className="dashboard-layout">
      <header className="dashboard-header">
         <div className="address-section">
          <label htmlFor="addressDropdown">Select Address:</label>
          <select id="addressDropdown" value={selectedAddress} onChange={handleAddressChange} className="address-dropdown">
            <option value="">Select...</option>
            {addresses.map((addr, index) => <option key={index} value={addr}>{addr}</option>)}
            {addresses.length < 3 && <option value="add_new">➕ Add New Address</option>}
          </select>
        </div>
        <div className="settings-section">
          <button className="settings-btn" onClick={() => setShowOptions(!showOptions)}><FiSettings size={24} /></button>
          {showOptions && (
            <div className="dropdown">
              <button className="option" onClick={() => navigate("/change-email")}>Change Email</button>
              <button className="option" onClick={() => navigate("/select-address")}>Change Address</button>
              <button className="option" onClick={handleLogout}>Logout</button>
            </div>
          )}
        </div>
      </header>

      <main className="dashboard-main">
        {isLoading ? (
          <p>Loading dashboard...</p>
        ) : (
          userInfo.role === 'Customer' ? <CustomerDashboard /> : <WorkerDashboard />
        )}
      </main>
    </div>
  );
};

export default DashboardPage;