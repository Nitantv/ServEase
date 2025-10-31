import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import "./PageStyles.css";

const parseTime = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const match = timeStr.toLowerCase().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/);
  if (!match) return null;
  let [, hours, minutes, modifier] = match;
  hours = parseInt(hours, 10);
  minutes = parseInt(minutes || '0', 10);
  if (hours > 12 || minutes > 59 || hours === 0) return null;
  if (modifier === 'pm' && hours < 12) hours += 12;
  if (modifier === 'am' && hours === 12) hours = 0;
  return hours * 60 + minutes;
};

const UpdateWorkerDetailsPage = () => {
  const navigate = useNavigate();

  const [cost, setCost] = useState('');
  const [serviceSlots, setServiceSlots] = useState([]);
  const [availableAddresses, setAvailableAddresses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isInitialSetup, setIsInitialSetup] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [lockUntil, setLockUntil] = useState(null);

  useEffect(() => {
    const fetchProfileAndAddresses = async () => {
      setIsLoading(true);
      try {
        const [profileRes, addressesRes] = await Promise.all([
          fetch(process.env.REACT_APP_BACKEND_URL+"/dash/worker/my-profile", { credentials: "include" }),
          fetch(process.env.REACT_APP_BACKEND_URL+"/dash/user/addresses", { credentials: "include" })
        ]);
        if (!profileRes.ok || !addressesRes.ok) throw new Error("Could not load initial data.");

        const profileData = await profileRes.json();
        const addressesData = await addressesRes.json();

        if (profileData.pendingServiceSlots && profileData.pendingServiceSlots.length > 0) {
          setServiceSlots(profileData.pendingServiceSlots);
          setCost(profileData.pendingCost !== null ? profileData.pendingCost : profileData.cost);
        } else {
          setServiceSlots(profileData.serviceSlots || []);
          setCost(profileData.cost || '');
        }

        setAvailableAddresses(addressesData.addresses || []);

        if (
          (!profileData.serviceSlots || profileData.serviceSlots.length === 0) &&
          (!profileData.pendingServiceSlots || profileData.pendingServiceSlots.length === 0)
        ) {
          setIsInitialSetup(true);
        }

        if (profileData.slotsEffectiveDate && new Date() < new Date(profileData.slotsEffectiveDate)) {
          setIsLocked(true);
          setLockUntil(new Date(profileData.slotsEffectiveDate));
        }

      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileAndAddresses();
  }, []);

  const handleSlotChange = (index, field, value) => {
    const updatedSlots = [...serviceSlots];
    updatedSlots[index][field] = value;
    setServiceSlots(updatedSlots);
  };

  const addSlot = () => {
    setServiceSlots([...serviceSlots, { address: '', serviceStartTime: '', serviceEndTime: '' }]);
  };

  const removeSlot = (index) => {
    setServiceSlots(serviceSlots.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const parsedSlots = serviceSlots.map((slot, index) => {
        if (!slot.address || !slot.serviceStartTime || !slot.serviceEndTime) {
          throw new Error(`Please fill out all fields for Slot #${index + 1}.`);
        }
        const start = parseTime(slot.serviceStartTime);
        const end = parseTime(slot.serviceEndTime);

        if (start === null || end === null) throw new Error(`Invalid time format in Slot #${index + 1}.`);
        if (end <= start) throw new Error(`In Slot #${index + 1}, the end time must be later than the start time.`);
        if (end - start < 15) throw new Error(`In Slot #${index + 1}, the duration must be at least 15 minutes.`);

        return {
          start,
          end,
          address: slot.address,
          originalStartTime: slot.serviceStartTime,
          originalEndTime: slot.serviceEndTime
        };
      });

      if (parsedSlots.length > 1) {
        const sortedSlots = [...parsedSlots].sort((a, b) => a.start - b.start);
        for (let i = 0; i < sortedSlots.length - 1; i++) {
          const currentSlot = sortedSlots[i];
          const nextSlot = sortedSlots[i + 1];
          const gap = nextSlot.start - currentSlot.end;

          if (gap < 30) {
            throw new Error(
              `Please ensure a minimum 30-minute gap between all slots. Conflict between ${currentSlot.originalEndTime} and ${nextSlot.originalStartTime}.`
            );
          }
        }
      }
    } catch (validationError) {
      setError(validationError.message);
      return;
    }

    try {
      const response = await fetch(process.env.REACT_APP_BACKEND_URL+'/dash/worker/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          cost: cost ? Number(cost) : 0,
          serviceSlots
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "An error occurred while saving.");
      setSuccess(data.message);
      setTimeout(() => navigate('/dashboard'), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  if (isLoading) return <div className="loading-page">Loading Your Profile...</div>;

  return (
    <div className="page-container">
      <div className="form-box" style={{ maxWidth: '700px' }}>
        <h2>Update Your Professional Details</h2>

        {!isInitialSetup && (
          <p style={{ color: '#aaa', marginTop: '-15px', marginBottom: '20px' }}>
            Note: Any changes to your cost or schedule will become effective in 3 days.
          </p>
        )}

        {isLocked && (
          <p style={{ color: 'orange', fontWeight: 'bold', marginBottom: '10px' }}>
            🚫 You cannot make updates until {lockUntil?.toLocaleDateString()}.
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <label>Cost per Hour ($)</label>
          <input type="number" min="0" placeholder="e.g., 25" value={cost} onChange={(e) => setCost(e.target.value)} />

          <h3 className="service-slots-title">Your Service Slots</h3>
          {serviceSlots.map((slot, index) => (
            <div key={index} className="slot-editor-card">
              <label>Address</label>
              <select value={slot.address} onChange={(e) => handleSlotChange(index, 'address', e.target.value)} required>
                <option value="" disabled>-- Select an address --</option>
                {availableAddresses.map((addr, addrIndex) => (
                  <option key={addrIndex} value={addr}>{addr}</option>
                ))}
              </select>

              <label>Service Start Time</label>
              <input type="text" placeholder="e.g., 8am or 2:30pm" value={slot.serviceStartTime} onChange={(e) => handleSlotChange(index, 'serviceStartTime', e.target.value)} required />

              <label>Service End Time</label>
              <input type="text" placeholder="e.g., 12pm or 5:30pm" value={slot.serviceEndTime} onChange={(e) => handleSlotChange(index, 'serviceEndTime', e.target.value)} required />

              <button type="button" className="btn-remove-slot" onClick={() => removeSlot(index)}>Remove This Slot</button>
            </div>
          ))}

          <button type="button" className="btn-add-slot" onClick={addSlot}>+ Add Another Service Slot</button>

          <hr />

          <button type="submit" className="btn-submit-profile" disabled={isLocked}>
            {isLocked
              ? `Locked Until ${lockUntil?.toLocaleDateString()}`
              : "Save All Changes"}
          </button>
        </form>

        {success && <p style={{ color: 'lightgreen', marginTop: '15px' }}>{success}</p>}
        {error && <p style={{ color: 'red', marginTop: '15px' }}>{error}</p>}

        <button className="btn-link" style={{ marginTop: '20px' }} onClick={() => navigate('/dashboard')}>← Back to Dashboard</button>
      </div>
    </div>
  );
};

export default UpdateWorkerDetailsPage;
