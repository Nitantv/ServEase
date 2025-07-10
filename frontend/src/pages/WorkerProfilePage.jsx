import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import "./PageStyles.css";

// Helper Functions
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

const formatTime = (minutes) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const hours12 = h % 12 === 0 ? 12 : h % 12;
  const modifier = h < 12 ? 'AM' : 'PM';
  const paddedMinutes = m < 10 ? `0${m}` : m;
  return `${hours12}:${paddedMinutes} ${modifier}`;
};


// ✅✅✅ --- THE ONLY CHANGE IS IN THIS FUNCTION --- ✅✅✅
const generateDateOptions = () => {
  const options = [];
  const today = new Date();
  // Loop only twice to show "tomorrow" and "the day after".
  for (let i = 1; i <= 2; i++) { 
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dateString = date.toISOString().split('T')[0];
    const displayString = date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    options.push({ value: dateString, label: displayString });
  }
  return options;
};


const WorkerProfilePage = () => {
  const { workerId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const customerAddress = searchParams.get('address');

  const [workerProfile, setWorkerProfile] = useState(null);
  const [timeChunks, setTimeChunks] = useState([]);
  const [selectedChunk, setSelectedChunk] = useState(null);
  const [isBooking, setIsBooking] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [dateOptions] = useState(generateDateOptions());
  const [selectedDate, setSelectedDate] = useState(dateOptions[0]?.value || '');
  
  useEffect(() => {
    if (!customerAddress || !selectedDate || !workerId) return;
    
    const fetchAllData = async () => {
      setIsLoading(true);
      setTimeChunks([]);
      setSelectedChunk(null);
      setError('');

      try {
        const [profileRes, bookingsRes] = await Promise.all([
          fetch(`http://localhost:5000/dash/worker/${workerId}`, { credentials: 'include' }),
          fetch(`http://localhost:5000/dash/bookings/${workerId}?date=${selectedDate}`, { credentials: 'include' })
        ]);

        if (!profileRes.ok || !bookingsRes.ok) throw new Error('Failed to load worker data.');
        
        const profileData = await profileRes.json();
        const bookedSlotsData = await bookingsRes.json();
        setWorkerProfile(profileData);

        // This logic correctly defaults to the active schedule, as the viewingDate
        // will now always be before the slotsEffectiveDate.
        let scheduleToDisplay = profileData.serviceSlots || [];
        let costToDisplay = profileData.cost;

        if (profileData.slotsEffectiveDate) {
          const effectiveDate = new Date(profileData.slotsEffectiveDate);
          const viewingDate = new Date(selectedDate);
          viewingDate.setUTCHours(0,0,0,0);

          if (viewingDate >= effectiveDate) {
            scheduleToDisplay = profileData.pendingServiceSlots || profileData.serviceSlots;
            costToDisplay = profileData.pendingCost !== null ? profileData.pendingCost : profileData.cost;
          }
        }
        
        const relevantSlots = scheduleToDisplay.filter(s => s.address.toLowerCase() === customerAddress.toLowerCase());
        const hourlyRate = costToDisplay || 0;
        const allChunks = [];
        
        relevantSlots.forEach(slot => {
          const slotStart = parseTime(slot.serviceStartTime);
          const slotEnd = parseTime(slot.serviceEndTime);
          if (slotStart === null || slotEnd === null || slotEnd <= slotStart) return;
          let currentTime = slotStart;
          while (currentTime < slotEnd) {
              let nextTime = currentTime + 60;
              if (nextTime > slotEnd) nextTime = slotEnd;
              const chunkDuration = nextTime - currentTime;
              if (chunkDuration >= 15) {
                  const isBooked = bookedSlotsData.some(booking => 
                      currentTime < booking.endTimeMinutes && nextTime > booking.startTimeMinutes
                  );
                  allChunks.push({
                      start: currentTime, end: nextTime,
                      cost: (hourlyRate * (chunkDuration / 60)).toFixed(2),
                      isBooked: isBooked
                  });
              }
              currentTime = nextTime;
          }
        });
        setTimeChunks(allChunks);
      } catch (err) { setError(err.message); }
      finally { setIsLoading(false); }
    };
    fetchAllData();
  }, [workerId, customerAddress, navigate, selectedDate]);

  const handleSlotSelect = (chunk) => {
    if (chunk.isBooked) return;
    setSelectedChunk(chunk === selectedChunk ? null : chunk);
  };

  const handleContinue = async () => {
    if (!selectedChunk) return;
    setIsBooking(true);
    setError('');
    try {
      const response = await fetch('http://localhost:5000/dash/book-slot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          workerId,
          bookingDate: selectedDate,
          startTimeMinutes: selectedChunk.start,
          endTimeMinutes: selectedChunk.end,
          cost: Number(selectedChunk.cost),
          address: customerAddress
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Booking failed.');
      }
      navigate('/dashboard');
    } catch (err) {
      alert(`Booking Failed:\n${err.message}`);
      setError(err.message);
      setIsBooking(false);
    }
  };

  if (isLoading) return <div className="loading-page">Loading Worker Profile...</div>;
  if (error) return <div className="page-container"><p style={{ color: 'red' }}>{error}</p></div>;
  if (!workerProfile) return <div className="page-container"><p>No profile data found.</p></div>;

  return (
    <div className="worker-profile-layout">
      <header className="profile-header">
        <h1 className="worker-name">{workerProfile.username}'s Profile</h1>
        <div className="profile-cost">
          <span className="detail-label">Base Rate:</span>
          <span className="detail-value">${workerProfile.cost || 0} / hour</span>
        </div>
      </header>
      
      <main className="profile-main">
        <div className="date-selector">
          <label htmlFor="date-dropdown">Select a Date:</label>
          <select id="date-dropdown" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}>
            {dateOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <h3 className="slots-title">Select an Available Slot</h3>
        <div className="time-chunks-grid">
          {timeChunks.length > 0 ? (
            timeChunks.map((chunk, index) => {
              const isSelected = selectedChunk?.start === chunk.start;
              return (
                <button
                  key={index}
                  className={`time-chunk-btn ${chunk.isBooked ? 'unavailable' : 'available'} ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleSlotSelect(chunk)}
                  disabled={chunk.isBooked}
                >
                  {formatTime(chunk.start)} - {formatTime(chunk.end)}
                </button>
              );
            })
          ) : (
            <p>This worker has no available time slots for this address on this date.</p>
          )}
        </div>
      </main>

      <footer className="profile-footer">
        {selectedChunk && (
          <div className="calculated-cost">
            Selected Slot Cost: <span>${selectedChunk.cost}</span>
          </div>
        )}
        <button 
          className="btn-continue" 
          onClick={handleContinue} 
          disabled={!selectedChunk || isBooking}
        >
          {isBooking ? 'Processing...' : 'Continue'}
        </button>
        <button className="btn-link" style={{marginTop: '20px'}} onClick={() => navigate(-1)}>← Back to Dashboard</button>
      </footer>
    </div>
  );
};

export default WorkerProfilePage;