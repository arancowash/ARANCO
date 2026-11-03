import { useState, useEffect, useCallback, useRef } from 'react';
import { adminAPI, bookingAPI } from '../services/api';
import { FiSearch, FiEye, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const statusLabels = {
  CONFIRMED: 'Confirmed',
  IN_PROGRESS: 'In Progress',
  VEHICLE_RECEIVED: 'Vehicle Received',
  WASHING: 'Washing',
  CLEANING: 'Cleaning',
  READY: 'Ready',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  NO_SHOW: 'No Show',
};

const statusColors = {
  CONFIRMED: { color: '#1a73e8', bg: '#e8f0fe' },
  IN_PROGRESS: { color: '#ff9800', bg: '#fff3e0' },
  VEHICLE_RECEIVED: { color: '#ff9800', bg: '#fff3e0' },
  WASHING: { color: '#2196f3', bg: '#e3f2fd' },
  CLEANING: { color: '#9c27b0', bg: '#f3e5f5' },
  READY: { color: '#4caf50', bg: '#e8f5e9' },
  COMPLETED: { color: '#2e7d32', bg: '#e8f5e9' },
  CANCELLED: { color: '#ea4335', bg: '#fce8e6' },
  NO_SHOW: { color: '#b91c1c', bg: '#fee2e2' },
};

const nextStatusMap = {
  CONFIRMED: 'VEHICLE_RECEIVED',
  VEHICLE_RECEIVED: 'WASHING',
  WASHING: 'CLEANING',
  CLEANING: 'READY',
  READY: 'COMPLETED',
};

const activeStatuses = ['CONFIRMED', 'IN_PROGRESS', 'VEHICLE_RECEIVED', 'WASHING', 'CLEANING', 'READY'];

const bookingPrice = (b) => b?.finalPrice ?? b?.price ?? 0;
const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function generateDates(count = 14) {
  const dates = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    dates.push(d);
  }
  return dates;
}

const Bookings = () => {
  const [dates] = useState(() => generateDates(14));
  const [selectedDate, setSelectedDate] = useState(() => formatDateKey(new Date()));
  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [search, setSearch] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const dateScrollRef = useRef(null);

  const fetchBookings = useCallback(async (dateStr, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await adminAPI.getBookings({ date: dateStr, limit: 200 });
      const data = res.data.data.bookings || [];
      setAllBookings(data);
    } catch (err) {
      console.error(err);
      if (!silent) setAllBookings([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBookings(selectedDate); }, [selectedDate, fetchBookings]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchBookings(selectedDate, true);
    }, 10000);
    return () => clearInterval(interval);
  }, [selectedDate, fetchBookings]);

  const handleStatusUpdate = async (bookingId, newStatus) => {
    setUpdatingId(bookingId);
    try {
      await bookingAPI.updateStatus(bookingId, newStatus);
      setSelectedBooking(null);
      fetchBookings(selectedDate);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleNoShow = async (bookingId) => {    if (!window.confirm('Mark this customer as a no-show? The slot is released and a strike is added to their account.')) return;
    setUpdatingId(bookingId);
    try {
      const res = await bookingAPI.markNoShow(bookingId);
      const count = res.data?.data?.noShowCount;
      const blockedUntil = res.data?.data?.blockedUntil;
      alert(
        blockedUntil
          ? `Marked no-show. Customer now has ${count} strike(s) and is blocked from booking until ${new Date(blockedUntil).toLocaleDateString('en-IN')}.`
          : `Marked no-show. Customer now has ${count} strike(s).`
      );
      setSelectedBooking(null);
      fetchBookings(selectedDate);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to mark no-show');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleVerifyCode = async () => {
    const code = codeInput.trim().toUpperCase();
    if (!code) return;
    setVerifying(true);
    try {
      const res = await bookingAPI.verifyCode(code);
      setSelectedBooking(res.data.data.booking);
      setCodeInput('');
    } catch (err) {
      alert(err.response?.data?.message || 'No booking found for this code');
    } finally {
      setVerifying(false);
    }
  };

  const filteredBookings = search
    ? allBookings.filter((b) => {
        const q = search.toLowerCase();
        return (
          b.user?.fullName?.toLowerCase().includes(q) ||
          b.user?.mobile?.includes(q) ||
          b.bookingCode?.toLowerCase().includes(q) ||
          b.vehicle?.registrationNumber?.toLowerCase().includes(q) ||
          b.vehicle?.make?.toLowerCase().includes(q) ||
          b.vehicle?.model?.toLowerCase().includes(q)
        );
      })
    : allBookings;

  const slotGroups = {};
  filteredBookings.forEach((b) => {
    const slot = b.timeSlot || 'Unknown';
    if (!slotGroups[slot]) slotGroups[slot] = [];
    slotGroups[slot].push(b);
  });

  const sortedSlots = Object.keys(slotGroups).sort((a, b) => a.localeCompare(b));
  const selectedBookings = selectedSlot ? slotGroups[selectedSlot] || [] : [];

  const selectedDateObj = dates.find((d) => formatDateKey(d) === selectedDate);
  const scrollDates = (dir) => {
    if (dateScrollRef.current) {
      dateScrollRef.current.scrollBy({ left: dir * 200, behavior: 'smooth' });
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2>Bookings</h2>
      </div>

      {/* Date Tabs */}
      <div style={{ position: 'relative', marginBottom: '16px' }}>
        <button
          onClick={() => scrollDates(-1)}
          style={{
            position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', zIndex: 2,
            width: 32, height: 32, borderRadius: '50%', border: '1px solid var(--border)',
            background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--shadow-sm)', cursor: 'pointer',
          }}
        >
          <FiChevronLeft />
        </button>
        <div
          ref={dateScrollRef}
          style={{
            display: 'flex', gap: '8px', overflowX: 'auto', padding: '4px 40px',
            scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch',
          }}
        >
          {dates.map((d) => {
            const key = formatDateKey(d);
            const isSelected = key === selectedDate;
            const isToday = key === formatDateKey(new Date());
            const count = allBookings.filter((b) => {
              const bDate = formatDateKey(new Date(b.bookingDate));
              return bDate === key;
            }).length;
            return (
              <button
                key={key}
                onClick={() => setSelectedDate(key)}
                style={{
                  flexShrink: 0, padding: '10px 14px', borderRadius: '12px', border: isSelected ? '2px solid #1a73e8' : '1px solid var(--border)',
                  background: isSelected ? '#e8f0fe' : isToday ? '#f0f7ff' : '#fff',
                  cursor: 'pointer', textAlign: 'center', minWidth: '72px',
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: '600', color: isSelected ? '#1a73e8' : 'var(--text-secondary)' }}>{weekdays[d.getDay()]}</div>
                <div style={{ fontSize: '18px', fontWeight: '700', color: isSelected ? '#1a73e8' : 'var(--text-primary)' }}>{d.getDate()}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-light)' }}>{months[d.getMonth()]}</div>
                {count > 0 && (
                  <div style={{
                    marginTop: '4px', fontSize: '10px', fontWeight: '700', color: isSelected ? '#1a73e8' : '#fff',
                    background: isSelected ? '#c5dcfa' : 'var(--primary)', borderRadius: '10px', padding: '1px 6px', display: 'inline-block',
                  }}>
                    {count}
                  </div>
                )}
              </button>
            );
          })}
        </div>
        <button
          onClick={() => scrollDates(1)}
          style={{
            position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', zIndex: 2,
            width: 32, height: 32, borderRadius: '50%', border: '1px solid var(--border)',
            background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--shadow-sm)', cursor: 'pointer',
          }}
        >
          <FiChevronRight />
        </button>
      </div>

      {/* Search */}
      <div className="filter-bar">
        <div className="search-input" style={{ flex: 1 }}>
          <FiSearch />
          <input
            placeholder="Search by name, phone, booking code, vehicle..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            className="form-control"
            style={{ width: '170px', textTransform: 'uppercase', fontFamily: 'monospace', letterSpacing: '1px' }}
            placeholder="CW-XXXX"
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
            onKeyDown={(e) => { if (e.key === 'Enter') handleVerifyCode(); }}
          />
          <button className="btn btn-primary" onClick={handleVerifyCode} disabled={verifying || !codeInput.trim()}>
            {verifying ? 'Verifying...' : 'Verify Code'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner"></div></div>
      ) : !selectedSlot ? (
        /* Time Slot Grid */
        sortedSlots.length === 0 ? (
          <div className="card empty-state">
            <h3>No bookings on this date</h3>
            <p>Select another date from the tabs above</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
            {sortedSlots.map((slot) => {
              const bookings = slotGroups[slot];
              const activeCount = bookings.filter((b) => activeStatuses.includes(b.status)).length;
              const completedCount = bookings.filter((b) => b.status === 'COMPLETED').length;
              return (
                <button
                  key={slot}
                  onClick={() => setSelectedSlot(slot)}
                  style={{
                    padding: '16px', borderRadius: '14px', border: '1px solid var(--border)',
                    background: '#fff', cursor: 'pointer', textAlign: 'left',
                    boxShadow: 'var(--shadow-sm)', transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow)'; e.currentTarget.style.borderColor = '#1a73e8'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                >
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#1a73e8', marginBottom: '6px' }}>{slot}</div>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)' }}>{bookings.length}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '8px' }}>booking{bookings.length !== 1 ? 's' : ''}</div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {activeCount > 0 && (
                      <span style={{ fontSize: '10px', fontWeight: '600', padding: '2px 6px', borderRadius: '8px', background: '#e8f0fe', color: '#1a73e8' }}>
                        {activeCount} active
                      </span>
                    )}
                    {completedCount > 0 && (
                      <span style={{ fontSize: '10px', fontWeight: '600', padding: '2px 6px', borderRadius: '8px', background: '#e6f4ea', color: '#2e7d32' }}>
                        {completedCount} done
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )
      ) : (
        /* Slot Detail View */
        <div>
          <button
            onClick={() => setSelectedSlot(null)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px',
              padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--border)',
              background: '#fff', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
              color: 'var(--text-secondary)',
            }}
          >
            <FiChevronLeft /> Back to time slots
          </button>

          <div style={{
            padding: '12px 16px', background: '#e8f0fe', borderRadius: '10px', marginBottom: '16px',
            fontSize: '14px', fontWeight: '600', color: '#1a73e8',
          }}>
            {selectedSlot} — {selectedBookings.length} booking{selectedBookings.length !== 1 ? 's' : ''}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {selectedBookings.map((b) => {
              const sc = statusColors[b.status] || statusColors.CONFIRMED;
              const next = nextStatusMap[b.status];
              return (
                <div
                  key={b._id}
                  style={{
                    background: '#fff', border: '1px solid var(--border)', borderRadius: '14px',
                    padding: '16px', boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>{b.user?.fullName}</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{b.user?.mobile}</div>
                    </div>
                    <span style={{
                      padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600',
                      background: sc.bg, color: sc.color,
                    }}>
                      {statusLabels[b.status]}
                    </span>
                  </div>

                  <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px',
                    padding: '12px', background: 'var(--bg)', borderRadius: '10px', marginBottom: '12px',
                  }}>
                    <div>
                      <div style={{ fontSize: '10px', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Booking Code</div>
                      <div style={{ fontSize: '14px', fontWeight: '800', fontFamily: 'monospace', color: '#1a73e8', letterSpacing: '1px' }}>{b.bookingCode || '—'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Vehicle</div>
                      <div style={{ fontSize: '13px', fontWeight: '600', fontFamily: 'monospace' }}>{b.vehicle?.registrationNumber}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{b.vehicle?.make} {b.vehicle?.model}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Service</div>
                      <div style={{ fontSize: '13px', fontWeight: '600' }}>{b.service?.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>₹{bookingPrice(b)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Collection</div>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: ['CANCELLED', 'NO_SHOW'].includes(b.status) ? 'var(--text-light)' : '#e37400' }}>
                        {['CANCELLED', 'NO_SHOW'].includes(b.status) ? 'Nothing due' : `₹${bookingPrice(b)} at counter`}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => setSelectedBooking(b)}
                    >
                      <FiEye /> View
                    </button>
                    {next && (
                      <button
                        className="btn btn-sm btn-success"
                        onClick={() => handleStatusUpdate(b._id, next)}
                        disabled={updatingId === b._id}
                      >
                        → {statusLabels[next]}
                      </button>
                    )}
                    {b.status === 'CONFIRMED' && (
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleNoShow(b._id)}
                        disabled={updatingId === b._id}
                      >
                        No-show
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Full Detail Modal */}
      {selectedBooking && (
        <div className="modal-overlay" onClick={() => setSelectedBooking(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Booking Details</h3>
              <button className="btn btn-sm btn-secondary" onClick={() => setSelectedBooking(null)}>Close</button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item"><label>Customer</label><span>{selectedBooking.user?.fullName}</span></div>
                <div className="detail-item"><label>Phone</label><span>{selectedBooking.user?.mobile}</span></div>
                <div className="detail-item"><label>Email</label><span>{selectedBooking.user?.email || '—'}</span></div>
                <div className="detail-item"><label>Vehicle No.</label><span style={{ fontFamily: 'monospace' }}>{selectedBooking.vehicle?.registrationNumber}</span></div>
                <div className="detail-item"><label>Car</label><span>{selectedBooking.vehicle?.make} {selectedBooking.vehicle?.model}</span></div>
                <div className="detail-item"><label>Vehicle Type</label><span>{selectedBooking.vehicle?.vehicleType}</span></div>
                <div className="detail-item"><label>Service</label><span>{selectedBooking.service?.name}</span></div>
                <div className="detail-item"><label>Date</label><span>{new Date(selectedBooking.bookingDate).toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</span></div>
                <div className="detail-item"><label>Time Slot</label><span>{selectedBooking.timeSlot}</span></div>
                <div className="detail-item"><label>Booking Code</label><span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#1a73e8', letterSpacing: '1px' }}>{selectedBooking.bookingCode || '—'}</span></div>
                <div className="detail-item"><label>Amount</label><span>₹{bookingPrice(selectedBooking)}</span></div>
                <div className="detail-item">
                  <label>Collection</label>
                  <span className={`badge ${['CANCELLED', 'NO_SHOW'].includes(selectedBooking.status) ? 'badge-secondary' : 'badge-warning'}`}>
                    {['CANCELLED', 'NO_SHOW'].includes(selectedBooking.status) ? 'NOTHING DUE' : 'PAY AT COUNTER'}
                  </span>
                </div>
                <div className="detail-item">
                  <label>Status</label>
                  <span className="badge badge-info">{statusLabels[selectedBooking.status]}</span>
                </div>
                {selectedBooking.assignedStaff && (
                  <div className="detail-item"><label>Staff</label><span>{selectedBooking.assignedStaff?.employeeId}</span></div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
                {Object.entries(statusLabels)
                  .filter(([key]) => key !== selectedBooking.status)
                  .filter(([key]) => {
                    if (['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(selectedBooking.status)) return false;
                    const allowed = nextStatusMap[selectedBooking.status];
                    if (allowed) return key === allowed || key === 'CANCELLED';
                    return false;
                  })
                  .map(([key, label]) => (
                    <button
                      key={key}
                      className={`btn btn-sm ${key === 'CANCELLED' ? 'btn-danger' : 'btn-success'}`}
                      onClick={() => handleStatusUpdate(selectedBooking._id, key)}
                      disabled={updatingId === selectedBooking._id}
                      style={{ fontSize: '11px' }}
                    >
                      {label}
                    </button>
                  ))
                }
                {selectedBooking.status === 'CONFIRMED' && (
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => handleNoShow(selectedBooking._id)}
                    disabled={updatingId === selectedBooking._id}
                    style={{ fontSize: '11px' }}
                  >
                    Mark No-show
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bookings;
