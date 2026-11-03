import { useState, useEffect, useRef } from 'react';
import { adminAPI } from '../services/api';
import { FiX, FiCalendar, FiUser, FiTruck, FiTool } from 'react-icons/fi';

const NewBookingPopup = () => {
  const [visible, setVisible] = useState(false);
  const [booking, setBooking] = useState(null);
  const seenIds = useRef(new Set());

  useEffect(() => {
    const check = async () => {
      try {
        const now = new Date();
        const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const res = await adminAPI.getBookings({ date: dateStr, limit: 200 });
        const bookings = res.data.data.bookings || [];

        const currentIds = new Set(bookings.map(b => b._id));

        if (seenIds.current.size > 0) {
          for (const b of bookings) {
            if (!seenIds.current.has(b._id)) {
              setBooking(b);
              setVisible(true);
              try {
                const ctx = new (window.AudioContext || window.webkitAudioContext)();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.value = 800;
                gain.gain.value = 0.3;
                osc.start();
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
                osc.stop(ctx.currentTime + 0.3);
              } catch (e) {}
              break;
            }
          }
        }

        seenIds.current = currentIds;
      } catch (e) {}
    };

    check();
    const i = setInterval(check, 10000);
    return () => clearInterval(i);
  }, []);

  if (!visible || !booking) return null;

  const date = new Date(booking.bookingDate);
  const dateStr = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div style={{
      position: 'fixed', bottom: '16px', right: '16px', zIndex: 9999,
      background: '#fff', borderRadius: '16px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
      width: '380px', maxWidth: 'calc(100vw - 32px)',
      border: '2px solid #1a73e8',
      animation: 'slideIn 0.3s ease',
    }}>
      <div style={{
        padding: '14px 16px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: '#e8f0fe', borderRadius: '14px 14px 0 0',
      }}>
        <span style={{ fontWeight: '700', fontSize: '14px', color: '#1a73e8' }}>New Booking</span>
        <button onClick={() => setVisible(false)} style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
          color: '#666', fontSize: '18px',
        }}><FiX /></button>
      </div>
      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <FiCalendar size={16} color="#1a73e8" />
          <span style={{ fontSize: '13px' }}><strong>{dateStr}</strong> at <strong>{booking.timeSlot}</strong></span>
          {booking.bookingCode && (
            <span style={{ marginLeft: 'auto', fontSize: '13px', fontWeight: '800', fontFamily: 'monospace', color: '#1a73e8', letterSpacing: '1px' }}>
              {booking.bookingCode}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <FiUser size={16} color="#34a853" />
          <span style={{ fontSize: '13px' }}>{booking.user?.fullName} ({booking.user?.mobile})</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <FiTruck size={16} color="#ff9800" />
          <span style={{ fontSize: '13px', fontFamily: 'monospace', fontWeight: '600' }}>{booking.vehicle?.registrationNumber}</span>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{booking.vehicle?.make} {booking.vehicle?.model}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FiTool size={16} color="#9c27b0" />
          <span style={{ fontSize: '13px' }}>{booking.service?.name}</span>
          <span style={{ fontSize: '13px', fontWeight: '700', color: '#1a73e8', marginLeft: 'auto' }}>₹{booking.finalPrice ?? booking.price} · Pay at shop</span>
        </div>
      </div>
    </div>
  );
};

export default NewBookingPopup;
