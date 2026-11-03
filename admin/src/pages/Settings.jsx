import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';

const Settings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({});
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await adminAPI.getSettings();
        const data = res.data.data.settings;
        setSettings(data);
        setFormData({
          businessName: data.businessName || '',
          address: data.address || '',
          phone: data.phone || '',
          email: data.email || '',
          openingTime: data.openingTime || '09:00',
          closingTime: data.closingTime || '19:00',
          slotDuration: data.slotDuration || 60,
          maxBookingsPerSlot: data.maxBookingsPerSlot || 3,
          maxActiveBookingsPerUser: data.maxActiveBookingsPerUser ?? 1,
          checkInGraceMinutes: data.checkInGraceMinutes ?? 15,
          noShowStrikeLimit: data.noShowStrikeLimit ?? 2,
          noShowBlockDays: data.noShowBlockDays ?? 30,
          minCancelHoursBeforeSlot: data.minCancelHoursBeforeSlot ?? 2,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const payload = {
        ...formData,
        slotDuration: parseInt(formData.slotDuration),
        maxBookingsPerSlot: parseInt(formData.maxBookingsPerSlot),
        maxActiveBookingsPerUser: parseInt(formData.maxActiveBookingsPerUser),
        checkInGraceMinutes: parseInt(formData.checkInGraceMinutes),
        noShowStrikeLimit: parseInt(formData.noShowStrikeLimit),
        noShowBlockDays: parseInt(formData.noShowBlockDays),
        minCancelHoursBeforeSlot: parseInt(formData.minCancelHoursBeforeSlot),
      };
      await adminAPI.updateSettings(payload);
      setMessage('Settings saved successfully');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

  return (
    <div className="page">
      <div className="page-header"><h2>Business Settings</h2></div>

      {message && (
        <div className={`error-message`} style={message.includes('success') ? { background: 'var(--success-light)', color: 'var(--success)' } : {}}>
          {message}
        </div>
      )}

      <div className="card">
        <form onSubmit={handleSubmit}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Business Information</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Business Name</label>
              <input className="form-control" value={formData.businessName} onChange={(e) => setFormData({ ...formData, businessName: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input className="form-control" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" className="form-control" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Address</label>
            <textarea className="form-control" rows="2" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
          </div>

          <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '24px 0 16px' }}>Operating Hours & Slots</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Opening Time</label>
              <input type="time" className="form-control" value={formData.openingTime} onChange={(e) => setFormData({ ...formData, openingTime: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Closing Time</label>
              <input type="time" className="form-control" value={formData.closingTime} onChange={(e) => setFormData({ ...formData, closingTime: e.target.value })} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Slot Duration (minutes)</label>
              <input type="number" className="form-control" value={formData.slotDuration} onChange={(e) => setFormData({ ...formData, slotDuration: e.target.value })} min="15" step="15" />
            </div>
            <div className="form-group">
              <label>Max Bookings Per Slot</label>
              <input type="number" className="form-control" value={formData.maxBookingsPerSlot} onChange={(e) => setFormData({ ...formData, maxBookingsPerSlot: e.target.value })} min="1" />
            </div>
          </div>

          <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '24px 0 16px' }}>Booking Verification & Anti-Abuse</h3>
          <p style={{ fontSize: '12px', color: 'var(--text-light)', marginBottom: '16px' }}>
            Payments are collected at the counter. These limits prevent prank bookings and repeated no-shows.
          </p>
          <div className="form-row">
            <div className="form-group">
              <label>Max Active Bookings Per Customer</label>
              <input type="number" className="form-control" value={formData.maxActiveBookingsPerUser} onChange={(e) => setFormData({ ...formData, maxActiveBookingsPerUser: e.target.value })} min="1" />
            </div>
            <div className="form-group">
              <label>Check-in Grace Period (minutes)</label>
              <input type="number" className="form-control" value={formData.checkInGraceMinutes} onChange={(e) => setFormData({ ...formData, checkInGraceMinutes: e.target.value })} min="0" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>No-show Strikes Before Block</label>
              <input type="number" className="form-control" value={formData.noShowStrikeLimit} onChange={(e) => setFormData({ ...formData, noShowStrikeLimit: e.target.value })} min="1" />
            </div>
            <div className="form-group">
              <label>Block Duration (days)</label>
              <input type="number" className="form-control" value={formData.noShowBlockDays} onChange={(e) => setFormData({ ...formData, noShowBlockDays: e.target.value })} min="1" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Customer Cancel Cut-off (hours before slot)</label>
              <input type="number" className="form-control" value={formData.minCancelHoursBeforeSlot} onChange={(e) => setFormData({ ...formData, minCancelHoursBeforeSlot: e.target.value })} min="0" />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Settings;
