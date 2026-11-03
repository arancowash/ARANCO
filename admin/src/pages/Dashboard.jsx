import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { FiCalendar, FiClock, FiCheckCircle, FiAlertTriangle } from 'react-icons/fi';

const statusColors = {
  CONFIRMED: 'badge-info',
  VEHICLE_RECEIVED: 'badge-warning',
  WASHING: 'badge-warning',
  CLEANING: 'badge-warning',
  READY: 'badge-success',
  COMPLETED: 'badge-success',
  CANCELLED: 'badge-danger',
  NO_SHOW: 'badge-danger',
};

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await adminAPI.getDashboard();
        setData(res.data.data);
      } catch (err) {
        console.error('Failed to load dashboard', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
    const i = setInterval(fetchDashboard, 15000);
    return () => clearInterval(i);
  }, []);

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;
  if (!data) return <div className="page"><p>Failed to load dashboard data</p></div>;

  return (
    <div className="page">
      <div className="page-header"><h2>Dashboard</h2></div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}><FiCalendar /></div>
          <div className="stat-info">
            <div className="stat-value">{data.todayBookings}</div>
            <div className="stat-label">Today's Bookings</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--warning-light)', color: '#e37400' }}><FiClock /></div>
          <div className="stat-info">
            <div className="stat-value">{data.pendingBookings}</div>
            <div className="stat-label">Pending</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--success-light)', color: 'var(--success)' }}><FiCheckCircle /></div>
          <div className="stat-info">
            <div className="stat-value">{data.completedToday}</div>
            <div className="stat-label">Completed</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--danger-light, #fce8e6)', color: 'var(--danger, #ea4335)' }}><FiAlertTriangle /></div>
          <div className="stat-info">
            <div className="stat-value">{data.noShowsToday}</div>
            <div className="stat-label">No-shows</div>
          </div>
        </div>
      </div>

      <h3 style={{ margin: '16px 0 10px', fontSize: '14px' }}>Recent Bookings</h3>
      {data.recentBookings.length === 0 ? (
        <div className="card empty-state"><p>No recent bookings</p></div>
      ) : (
        <>
          {/* MOBILE CARDS */}
          {data.recentBookings.map((b) => (
            <div key={b._id} className="mobile-card">
              <div className="mobile-card-header">
                <div>
                  <div className="mobile-card-title">{b.user?.fullName}</div>
                  <div className="mobile-card-subtitle">{b.vehicle?.registrationNumber}</div>
                </div>
                <span className={`badge ${statusColors[b.status] || 'badge-secondary'}`}>{b.status.replace(/_/g, ' ')}</span>
              </div>
              <div className="mobile-card-row">
                <span className="mobile-card-label">Service</span>
                <span className="mobile-card-value">{b.service?.name}</span>
              </div>
              <div className="mobile-card-row">
                <span className="mobile-card-label">Date</span>
                <span className="mobile-card-value">{new Date(b.bookingDate).toLocaleDateString()}</span>
              </div>
            </div>
          ))}

          {/* DESKTOP TABLE */}
          <div className="card">
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Customer</th>
                    <th>Vehicle</th>
                    <th>Service</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentBookings.map((b) => (
                    <tr key={b._id}>
                      <td style={{ fontFamily: 'monospace', fontSize: '11px' }}>{b._id.slice(-6)}</td>
                      <td>{b.user?.fullName}</td>
                      <td>{b.vehicle?.registrationNumber}</td>
                      <td>{b.service?.name}</td>
                      <td>{new Date(b.bookingDate).toLocaleDateString()}</td>
                      <td><span className={`badge ${statusColors[b.status] || 'badge-secondary'}`}>{b.status.replace(/_/g, ' ')}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
