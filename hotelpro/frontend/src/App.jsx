import React, { useState, useEffect } from 'react';
import './App.css';

const API_BASE_URL = 'https://hotelpro-fullstack.onrender.com';

function App() {
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [tierFilter, setTierFilter] = useState('All');
  const [view, setView] = useState('guest');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');

  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;

  const [inDay, setInDay] = useState('1');
  const [inMonth, setInMonth] = useState('Jan');
  const [inYear, setInYear] = useState(currentYear);

  const [outDay, setOutDay] = useState('2');
  const [outMonth, setOutMonth] = useState('Jan');
  const [outYear, setOutYear] = useState(currentYear);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  const getMonthIndex = (m) => months.indexOf(m);

  const syncOutYear = (selectedInMonth, selectedInYear, selectedOutMonth) => {
    const inIdx = getMonthIndex(selectedInMonth);
    const outIdx = getMonthIndex(selectedOutMonth);

    if (outIdx < inIdx) {
      setOutYear(selectedInYear + 1);
    } else {
      setOutYear(selectedInYear);
    }
  };

  const handleInMonthChange = (e) => {
    const m = e.target.value;
    setInMonth(m);
    syncOutYear(m, inYear, outMonth);
  };

  const handleInYearChange = (e) => {
    const y = Number(e.target.value);
    setInYear(y);
    syncOutYear(inMonth, y, outMonth);
  };

  const handleOutMonthChange = (e) => {
    const m = e.target.value;
    setOutMonth(m);
    syncOutYear(inMonth, inYear, m);
  };

  const handleEmailChange = (e) => {
    let val = e.target.value;
    if (val.includes('@@')) {
      val = val.replace('@@', '@');
    }
    if (val.endsWith('@') && !val.includes('gmail.com')) {
      setGuestEmail(val + 'gmail.com');
    } else {
      setGuestEmail(val);
    }
  };

  const formatPrice = (price) => {
    let inrPrice = price;
    if (price === 280) inrPrice = 22500;
    else if (price === 195) inrPrice = 15000;
    else if (price === 150) inrPrice = 11000;
    else if (price === 95) inrPrice = 9500;
    return Number(inrPrice).toLocaleString('en-IN');
  };

  const getFormattedDateTime = () => {
    const now = new Date();
    return now.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const loadData = () => {
    fetch(`${API_BASE_URL}/api/rooms`)
      .then(res => res.json())
      .then(data => setRooms(data))
      .catch(err => console.error(err));

    fetch(`${API_BASE_URL}/api/bookings`)
      .then(res => res.json())
      .then(data => setBookings(data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleBookingSubmit = (e) => {
    e.preventDefault();
    if (!guestName) {
      alert('Please enter guest name');
      return;
    }

    const inDateObj = new Date(inYear, getMonthIndex(inMonth), Number(inDay));
    const outDateObj = new Date(outYear, getMonthIndex(outMonth), Number(outDay));

    if (outDateObj <= inDateObj) {
      alert('Check-Out date must be after Check-In date!');
      return;
    }

    const diffTime = Math.abs(outDateObj - inDateObj);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
    const computedAmount = diffDays * (selectedRoom.pricePerNight || 0);

    const checkInDateDisplay = `${inDay} ${inMonth} ${inYear}`;
    const checkOutDateDisplay = `${outDay} ${outMonth} ${outYear}`;

    const payload = {
      roomId: selectedRoom._id,
      guestName,
      guestEmail: guestEmail || 'guest@example.com',
      guestPhone: '9999999999',
      checkIn: inDateObj.toISOString(),
      checkOut: outDateObj.toISOString(),
      checkInDate: checkInDateDisplay,
      checkOutDate: checkOutDateDisplay,
      totalNights: diffDays,
      totalAmount: computedAmount
    };

    fetch(`${API_BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(res => {
        if (!res.ok) {
          return res.json().then(data => { throw new Error(data.error || 'Booking failed'); });
        }
        return res.json();
      })
      .then(() => {
        alert(`Success! Suite #${selectedRoom.roomNumber} reserved for ${guestName} (${checkInDateDisplay} to ${checkOutDateDisplay}).`);
        setSelectedRoom(null);
        setGuestName('');
        setGuestEmail('');
        loadData();
      })
      .catch(err => {
        alert(err.message);
        console.error(err);
      });
  };

  const updateBookingStatus = (bookingId, newStatus) => {
    const currentStamp = getFormattedDateTime();
    const updatePayload = { bookingStatus: newStatus };

    if (newStatus === 'Checked-In') {
      updatePayload.actualCheckInTime = currentStamp;
    } else if (newStatus === 'Checked-Out') {
      updatePayload.actualCheckOutTime = currentStamp;
    }

    fetch(`${API_BASE_URL}/api/bookings/${bookingId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatePayload)
    })
      .then(res => res.json())
      .then(() => loadData())
      .catch(err => console.error(err));
  };

  const filteredRooms = tierFilter === 'All' 
    ? rooms 
    : rooms.filter(room => room.type.toLowerCase() === tierFilter.toLowerCase());

  const isCheckOutNextYearRequired = getMonthIndex(outMonth) < getMonthIndex(inMonth);

  return (
    <div className="hotel-app">
      <nav className="premium-navbar">
        <div className="brand-title">
          <span>❖</span> HOTEL<span>PRO</span>
        </div>
        <div className="nav-buttons">
          <button 
            className={`btn-nav ${view === 'guest' ? 'active' : 'inactive'}`} 
            onClick={() => setView('guest')}
          >
            Guest Booking View
          </button>
          <button 
            className={`btn-nav ${view === 'admin' ? 'active' : 'inactive'}`} 
            onClick={() => setView('admin')}
          >
            Front Desk & Admin PMS
          </button>
        </div>
      </nav>

      {view === 'guest' ? (
        <>
          <header className="hero-banner">
            <p className="hero-sub">The Art of Fine Hospitality</p>
            <h1>Curated Luxury Suites & Residencies</h1>
            <p>Experience timeless elegance, refined interior craftsmanship, and world-class concierge service.</p>
          </header>

          <div className="filter-container">
            <span className="filter-label">✧ Filter by Collection</span>
            <select 
              className="filter-select" 
              value={tierFilter} 
              onChange={(e) => setTierFilter(e.target.value)}
            >
              <option value="All">All Exclusive Collections</option>
              <option value="Suite">Presidential Suites</option>
              <option value="Executive">Executive Deluxes</option>
              <option value="Deluxe">Garden Villas</option>
              <option value="Standard">Comfort Singles</option>
            </select>
          </div>

          <main className="rooms-grid">
            {filteredRooms.map(room => (
              <div key={room._id} className="room-card">
                <div className="room-image-wrap">
                  <span className="badge-tier">{room.type}</span>
                  <img src={room.image} alt={room.title} />
                </div>
                <div className="room-body">
                  <h3>{room.title}</h3>
                  <p className="room-meta">Suite #{room.roomNumber} • Accommodates {room.capacity} Guests</p>
                  <div className="room-footer">
                    <div className="room-price">
                      ₹{formatPrice(room.pricePerNight)} <span>/ night</span>
                    </div>
                    <button 
                      className="btn-reserve" 
                      onClick={() => setSelectedRoom(room)}
                    >
                      Reserve Suite
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </main>
        </>
      ) : (
        <div style={{ maxWidth: '1300px', margin: '2rem auto', padding: '0 1.5rem' }}>
          <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: '1.8rem', marginBottom: '1.5rem', color: '#0f172a' }}>
            Front Desk Operations & Guest PMS
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.2rem', marginBottom: '2rem' }}>
            <div style={{ background: '#fff', padding: '1.2rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Total Rooms</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#0f172a' }}>{rooms.length}</div>
            </div>
            <div style={{ background: '#fff', padding: '1.2rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Active Reservations</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#c5a880' }}>{bookings.length}</div>
            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.04)' }}>
            <h3 style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid #e2e8f0', margin: 0, fontSize: '1.1rem', color: '#0f172a' }}>
              Live Guest Folio & Reservations
            </h3>
            {bookings.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                No reservations yet. Switch to "Guest Booking View" to make a reservation!
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                    <th style={{ padding: '1rem' }}>Guest Name</th>
                    <th style={{ padding: '1rem' }}>Suite</th>
                    <th style={{ padding: '1rem' }}>Booked Dates</th>
                    <th style={{ padding: '1rem' }}>Actual Check-In Log</th>
                    <th style={{ padding: '1rem' }}>Actual Check-Out Log</th>
                    <th style={{ padding: '1rem' }}>Status</th>
                    <th style={{ padding: '1rem' }}>Front Desk Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(b => (
                    <tr key={b._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '1rem', fontWeight: 600 }}>{b.guestName}</td>
                      <td style={{ padding: '1rem' }}>#{b.roomId?.roomNumber || '101'} - {b.roomId?.title || 'Suite'}</td>
                      <td style={{ padding: '1rem' }}>
                        <div><strong>In:</strong> {b.checkIn ? new Date(b.checkIn).toLocaleDateString("en-IN") : b.checkInDate}</div>
                        <div><strong>Out:</strong> {b.checkOut ? new Date(b.checkOut).toLocaleDateString("en-IN") : b.checkOutDate}</div>
                      </td>
                      <td style={{ padding: '1rem', color: b.actualCheckInTime ? '#166534' : '#94a3b8', fontWeight: b.actualCheckInTime ? 600 : 400 }}>
                        {b.actualCheckInTime ? `🕒 ${b.actualCheckInTime}` : '—'}
                      </td>
                      <td style={{ padding: '1rem', color: b.actualCheckOutTime ? '#1e40af' : '#94a3b8', fontWeight: b.actualCheckOutTime ? 600 : 400 }}>
                        {b.actualCheckOutTime ? `🕒 ${b.actualCheckOutTime}` : '—'}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ 
                          padding: '0.3rem 0.7rem', 
                          borderRadius: '20px', 
                          fontSize: '0.75rem', 
                          fontWeight: 600,
                          background: b.bookingStatus === 'Checked-In' ? '#dcfce7' : b.bookingStatus === 'Checked-Out' ? '#f1f5f9' : '#fef3c7',
                          color: b.bookingStatus === 'Checked-In' ? '#166534' : b.bookingStatus === 'Checked-Out' ? '#475569' : '#854d0e'
                        }}>
                          {b.bookingStatus}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', display: 'flex', gap: '8px' }}>
                        {b.bookingStatus === 'Confirmed' && (
                          <button 
                            onClick={() => updateBookingStatus(b._id, 'Checked-In')}
                            style={{ padding: '0.4rem 0.8rem', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}
                          >
                            Check-In
                          </button>
                        )}
                        {b.bookingStatus === 'Checked-In' && (
                          <button 
                            onClick={() => updateBookingStatus(b._id, 'Checked-Out')}
                            style={{ padding: '0.4rem 0.8rem', background: '#c5a880', color: '#0f172a', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}
                          >
                            Check-Out
                          </button>
                        )}
                        {b.bookingStatus !== 'Checked-Out' && (
                          <button 
                            onClick={() => updateBookingStatus(b._id, 'Cancelled')}
                            style={{ padding: '0.4rem 0.8rem', background: 'transparent', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {selectedRoom && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '2rem', width: '92%', maxWidth: '480px', boxShadow: '0 20px 25px rgba(0,0,0,0.15)' }}>
            <h3 style={{ fontFamily: 'Cinzel, serif', fontSize: '1.3rem', color: '#0f172a', marginBottom: '0.3rem' }}>
              Reserve: {selectedRoom.title}
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1.2rem' }}>
              Suite #{selectedRoom.roomNumber} • ₹{formatPrice(selectedRoom.pricePerNight)} per night
            </p>

            <form onSubmit={handleBookingSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Guest Full Name</label>
                <input 
                  type="text" 
                  required 
                  value={guestName} 
                  onChange={e => setGuestName(e.target.value)} 
                  placeholder="e.g. Rahul Sharma" 
                  style={{ width: '100%', padding: '0.65rem 0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Email Address</label>
                <input 
                  type="text" 
                  value={guestEmail} 
                  onChange={handleEmailChange} 
                  placeholder="Type name & press @ to auto-fill" 
                  style={{ width: '100%', padding: '0.65rem 0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Check-In Date
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr', gap: '8px' }}>
                  <select 
                    value={inDay} 
                    onChange={e => setInDay(e.target.value)} 
                    style={{ padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '0.85rem' }}
                  >
                    {days.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <select 
                    value={inMonth} 
                    onChange={handleInMonthChange} 
                    style={{ padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '0.85rem' }}
                  >
                    {months.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  {inMonth === 'Nov' || inMonth === 'Dec' ? (
                    <select
                      value={inYear}
                      onChange={handleInYearChange}
                      style={{ padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '0.85rem', fontWeight: 600 }}
                    >
                      <option value={currentYear}>{currentYear}</option>
                      <option value={nextYear}>{nextYear}</option>
                    </select>
                  ) : (
                    <input 
                      type="text" 
                      readOnly 
                      value={inYear} 
                      style={{ padding: '0.6rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#64748b', textAlign: 'center', fontWeight: 600, fontSize: '0.85rem' }}
                    />
                  )}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Check-Out Date
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr', gap: '8px' }}>
                  <select 
                    value={outDay} 
                    onChange={e => setOutDay(e.target.value)} 
                    style={{ padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '0.85rem' }}
                  >
                    {days.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <select 
                    value={outMonth} 
                    onChange={handleOutMonthChange} 
                    style={{ padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '0.85rem' }}
                  >
                    {months.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  {isCheckOutNextYearRequired ? (
                    <input 
                      type="text" 
                      readOnly 
                      value={outYear} 
                      style={{ padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#eff6ff', color: '#1e40af', textAlign: 'center', fontWeight: 700, fontSize: '0.85rem' }}
                    />
                  ) : (outMonth === 'Nov' || outMonth === 'Dec') ? (
                    <select
                      value={outYear}
                      onChange={e => setOutYear(Number(e.target.value))}
                      style={{ padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '0.85rem', fontWeight: 600 }}
                    >
                      <option value={inYear}>{inYear}</option>
                      <option value={inYear + 1}>{inYear + 1}</option>
                    </select>
                  ) : (
                    <input 
                      type="text" 
                      readOnly 
                      value={outYear} 
                      style={{ padding: '0.6rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#64748b', textAlign: 'center', fontWeight: 600, fontSize: '0.85rem' }}
                    />
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
                <button 
                  type="button" 
                  onClick={() => setSelectedRoom(null)} 
                  style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer', fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: 'none', background: '#0f172a', color: '#c5a880', fontWeight: 700, cursor: 'pointer' }}
                >
                  Confirm Stay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;