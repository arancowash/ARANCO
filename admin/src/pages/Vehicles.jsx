import { useState, useEffect } from 'react';
import { adminAPI, bookingAPI } from '../services/api';
import { FiSearch } from 'react-icons/fi';

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

const statusBadgeClass = {
  CONFIRMED: 'badge-info',
  IN_PROGRESS: 'badge-warning',
  VEHICLE_RECEIVED: 'badge-warning',
  WASHING: 'badge-info',
  CLEANING: 'badge-info',
  READY: 'badge-success',
  COMPLETED: 'badge-success',
  CANCELLED: 'badge-danger',
  NO_SHOW: 'badge-danger',
};

const Vehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const fetchVehicles = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await adminAPI.getVehiclesWithBookings();
      setVehicles(res.data.data.vehicles || []);
    } catch (err) {
      console.error(err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => { fetchVehicles(); }, []);
  useEffect(() => { const i = setInterval(() => fetchVehicles(true), 10000); return () => clearInterval(i); }, []);

  const handleStatusUpdate = async (bookingId, newStatus) => {
    setUpdatingId(bookingId);
    try {
      await bookingAPI.updateStatus(bookingId, newStatus);
      await fetchVehicles();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleNoShow = async (bookingId) => {
    if (!window.confirm('Mark this booking as a no-show? The slot is released and the customer gets a strike.')) return;
    setUpdatingId(bookingId);
    try {
      const res = await bookingAPI.markNoShow(bookingId);
      const { noShowCount, blockedUntil } = res.data.data || {};
      if (blockedUntil) {
        alert(`Marked no-show. Customer now has ${noShowCount} strike(s) and is blocked until ${new Date(blockedUntil).toLocaleDateString('en-IN')}.`);
      }
      await fetchVehicles();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to mark no-show');
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = vehicles.filter(v => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      v.registrationNumber?.toLowerCase().includes(s) ||
      v.make?.toLowerCase().includes(s) ||
      v.model?.toLowerCase().includes(s) ||
      v.user?.fullName?.toLowerCase().includes(s)
    );
  });

  const activeVehicles = filtered.filter(v => v.activeBookings.length > 0);
  const idleVehicles = filtered.filter(v => v.activeBookings.length === 0);

  return (
    <div className="page">
      <div className="page-header"><h2>Workshop</h2></div>

      <div className="filter-bar">
        <div className="search-input" style={{ flex: 1 }}>
          <FiSearch />
          <input placeholder="Search vehicles..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner"></div></div>
      ) : filtered.length === 0 ? (
        <div className="card empty-state"><h3>No vehicles found</h3></div>
      ) : (
        <>
          {activeVehicles.length > 0 && (
            <>
              <h3 style={{ margin: '16px 0 10px', fontSize: '14px' }}>Active Work ({activeVehicles.length})</h3>

              {/* MOBILE CARDS */}
              {activeVehicles.map(v =>
                v.activeBookings.map(b => {
                  const sc = statusColors[b.status] || statusColors.CONFIRMED;
                  const next = nextStatusMap[b.status];
                  return (
                    <div key={b._id} className="mobile-card">
                      <div className="mobile-card-header">
                        <div>
                          <div className="mobile-card-title" style={{ fontFamily: 'monospace' }}>{v.registrationNumber}</div>
                          <div className="mobile-card-subtitle">{v.make} {v.model} · {v.vehicleType}</div>
                        </div>
                        <span className="badge" style={{ background: sc.bg, color: sc.color }}>{statusLabels[b.status]}</span>
                      </div>
                      <div className="mobile-card-row">
                        <span className="mobile-card-label">Customer</span>
                        <span className="mobile-card-value">{v.user?.fullName} · {v.user?.mobile}</span>
                      </div>
                      <div className="mobile-card-row">
                        <span className="mobile-card-label">Service</span>
                        <span className="mobile-card-value">{b.service?.name}</span>
                      </div>
                      <div className="mobile-card-row">
                        <span className="mobile-card-label">Date & Time</span>
                        <span className="mobile-card-value">{new Date(b.bookingDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} · {b.timeSlot}</span>
                      </div>
                      <div className="mobile-card-row">
                        <span className="mobile-card-label">Amount</span>
                        <span className="mobile-card-value" style={{ fontWeight: '700', color: '#1a73e8' }}>₹{b.finalPrice ?? b.price}</span>
                      </div>
                      <div className="mobile-card-actions">
                        {next && (
                          <button className="btn btn-sm btn-success" onClick={() => handleStatusUpdate(b._id, next)} disabled={updatingId === b._id} style={{ flex: 1 }}>
                            → {statusLabels[next]}
                          </button>
                        )}
                        {b.status === 'CONFIRMED' && (
                          <button className="btn btn-sm btn-danger" onClick={() => handleNoShow(b._id)} disabled={updatingId === b._id} style={{ flex: 1 }}>
                            No-show
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}

              {/* DESKTOP TABLE */}
              <div className="card">
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Registration</th>
                        <th>Vehicle</th>
                        <th>Customer</th>
                        <th>Service</th>
                        <th>Scheduled</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeVehicles.map(v =>
                        v.activeBookings.map(b => (
                          <tr key={b._id}>
                            <td style={{ fontFamily: 'monospace', fontWeight: '600' }}>{v.registrationNumber}</td>
                            <td>{v.make} {v.model}<br /><small style={{ color: 'var(--text-light)' }}>{v.vehicleType} · {v.year}</small></td>
                            <td>{v.user?.fullName}<br /><small style={{ color: 'var(--text-light)' }}>{v.user?.mobile}</small></td>
                            <td>{b.service?.name}</td>
                            <td>{new Date(b.bookingDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}<br /><small style={{ color: 'var(--text-light)' }}>{b.timeSlot}</small></td>
                            <td style={{ fontWeight: '600' }}>₹{b.finalPrice ?? b.price}</td>
                            <td><span className={`badge ${statusBadgeClass[b.status] || 'badge-info'}`}>{statusLabels[b.status]}</span></td>
                            <td>
                              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                              {nextStatusMap[b.status] && (
                                <button className="btn btn-sm btn-success" onClick={() => handleStatusUpdate(b._id, nextStatusMap[b.status])} disabled={updatingId === b._id}>
                                  → {statusLabels[nextStatusMap[b.status]]}
                                </button>
                              )}
                              {b.status === 'CONFIRMED' && (
                                <button className="btn btn-sm btn-danger" onClick={() => handleNoShow(b._id)} disabled={updatingId === b._id}>
                                  No-show
                                </button>
                              )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {idleVehicles.length > 0 && (
            <>
              <h3 style={{ margin: '16px 0 10px', fontSize: '14px', color: 'var(--text-secondary)' }}>No Active Work ({idleVehicles.length})</h3>

              {/* MOBILE CARDS */}
              {idleVehicles.map(v => (
                <div key={v._id} className="mobile-card">
                  <div className="mobile-card-header">
                    <div>
                      <div className="mobile-card-title" style={{ fontFamily: 'monospace' }}>{v.registrationNumber}</div>
                      <div className="mobile-card-subtitle">{v.make} {v.model}</div>
                    </div>
                    <span className="badge badge-info">{v.vehicleType}</span>
                  </div>
                  <div className="mobile-card-row">
                    <span className="mobile-card-label">Customer</span>
                    <span className="mobile-card-value">{v.user?.fullName} · {v.user?.mobile}</span>
                  </div>
                  <div className="mobile-card-row">
                    <span className="mobile-card-label">Year</span>
                    <span className="mobile-card-value">{v.year}</span>
                  </div>
                </div>
              ))}

              {/* DESKTOP TABLE */}
              <div className="card">
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Registration</th>
                        <th>Vehicle</th>
                        <th>Customer</th>
                        <th>Type</th>
                        <th>Year</th>
                      </tr>
                    </thead>
                    <tbody>
                      {idleVehicles.map(v => (
                        <tr key={v._id}>
                          <td style={{ fontFamily: 'monospace', fontWeight: '600' }}>{v.registrationNumber}</td>
                          <td>{v.make} {v.model}</td>
                          <td>{v.user?.fullName}<br /><small style={{ color: 'var(--text-light)' }}>{v.user?.mobile}</small></td>
                          <td><span className="badge badge-info">{v.vehicleType}</span></td>
                          <td>{v.year}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Vehicles;
