import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { FiSearch, FiEye } from 'react-icons/fi';

const BLOCK_DAY_OPTIONS = [7, 30, 90];

const isBlocked = (c) => c.bookingBlockedUntil && new Date(c.bookingBlockedUntil) > new Date();

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [blockDays, setBlockDays] = useState(30);
  const [blockReason, setBlockReason] = useState('');
  const [busy, setBusy] = useState(false);

  const fetchCustomers = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await adminAPI.getCustomers({ search, page, limit: 15 });
      setCustomers(res.data.data.customers);
      setPagination(res.data.data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => { fetchCustomers(); }, [page]);
  useEffect(() => { const i = setInterval(() => fetchCustomers(true), 10000); return () => clearInterval(i); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchCustomers();
  };

  const openCustomer = (c) => {
    setSelectedCustomer(c);
    setBlockDays(30);
    setBlockReason('');
  };

  const handleBlock = async () => {
    if (!window.confirm(`Block ${selectedCustomer.fullName} from booking for ${blockDays} days? They will be notified.`)) return;
    setBusy(true);
    try {
      await adminAPI.blockCustomer(selectedCustomer._id, blockDays, blockReason.trim());
      await fetchCustomers(true);
      setSelectedCustomer(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to block customer');
    } finally {
      setBusy(false);
    }
  };

  const handleUnblock = async () => {
    if (!window.confirm(`Unblock ${selectedCustomer.fullName} and clear their no-show strikes?`)) return;
    setBusy(true);
    try {
      await adminAPI.unblockCustomer(selectedCustomer._id);
      await fetchCustomers(true);
      setSelectedCustomer(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to unblock customer');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header"><h2>Customers</h2></div>

      <div className="filter-bar">
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', flex: 1 }}>
          <div className="search-input" style={{ flex: 1 }}>
            <FiSearch />
            <input placeholder="Search by name, email or phone..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary">Search</button>
        </form>
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner"></div></div>
      ) : customers.length === 0 ? (
        <div className="card empty-state"><h3>No customers found</h3></div>
      ) : (
        <>
          {/* MOBILE CARDS */}
          {customers.map((c) => (
            <div key={c._id} className="mobile-card">
              <div className="mobile-card-header">
                <div>
                  <div className="mobile-card-title">{c.fullName}</div>
                  <div className="mobile-card-subtitle">{c.email}</div>
                </div>
                <button className="btn btn-sm btn-secondary" onClick={() => openCustomer(c)}>
                  <FiEye /> View
                </button>
              </div>
              <div className="mobile-card-row">
                <span className="mobile-card-label">Phone</span>
                <span className="mobile-card-value">{c.mobile}</span>
              </div>
              <div className="mobile-card-row">
                <span className="mobile-card-label">Vehicles</span>
                <span className="mobile-card-value">{c.vehicleCount}</span>
              </div>
              <div className="mobile-card-row">
                <span className="mobile-card-label">Bookings</span>
                <span className="mobile-card-value">{c.bookingCount}</span>
              </div>
              <div className="mobile-card-row">
                <span className="mobile-card-label">Completed Washes</span>
                <span className="mobile-card-value" style={{ fontWeight: '700', color: '#1a73e8' }}>{c.completedCount || 0}</span>
              </div>
              <div className="mobile-card-row">
                <span className="mobile-card-label">No-shows</span>
                <span className="mobile-card-value" style={{ fontWeight: c.noShowCount > 0 ? 700 : 400, color: c.noShowCount > 0 ? '#e37400' : 'inherit' }}>{c.noShowCount || 0}</span>
              </div>
              <div className="mobile-card-row">
                <span className="mobile-card-label">Booking Status</span>
                <span className={`badge ${isBlocked(c) ? 'badge-danger' : 'badge-success'}`}>{isBlocked(c) ? `BLOCKED until ${new Date(c.bookingBlockedUntil).toLocaleDateString('en-IN')}` : 'Can book'}</span>
              </div>
              <div className="mobile-card-row">
                <span className="mobile-card-label">Registered</span>
                <span className="mobile-card-value">{new Date(c.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}

          {/* DESKTOP TABLE */}
          <div className="card">
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>Vehicles</th>
                    <th>Bookings</th>
                    <th>Completed</th>
                    <th>No-shows</th>
                    <th>Booking Status</th>
                    <th>Registered</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => (
                    <tr key={c._id}>
                      <td>{c.fullName}</td>
                      <td>{c.mobile}</td>
                      <td>{c.email}</td>
                      <td>{c.vehicleCount}</td>
                      <td>{c.bookingCount}</td>
                      <td>{c.completedCount || 0}</td>
                      <td>{c.noShowCount || 0}</td>
                      <td><span className={`badge ${isBlocked(c) ? 'badge-danger' : 'badge-success'}`}>{isBlocked(c) ? `Blocked until ${new Date(c.bookingBlockedUntil).toLocaleDateString('en-IN')}` : 'Can book'}</span></td>
                      <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                      <td><button className="btn btn-sm btn-secondary" onClick={() => openCustomer(c)}><FiEye /> View</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pagination">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button>
            {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => {
              const p = i + 1;
              return <button key={p} className={page === p ? 'active' : ''} onClick={() => setPage(p)}>{p}</button>;
            })}
            <button disabled={page >= pagination.pages} onClick={() => setPage(page + 1)}>Next</button>
          </div>
        </>
      )}

      {selectedCustomer && (
        <div className="modal-overlay" onClick={() => setSelectedCustomer(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Customer Details</h3>
              <button className="btn btn-sm btn-secondary" onClick={() => setSelectedCustomer(null)}>Close</button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item"><label>Name</label><span>{selectedCustomer.fullName}</span></div>
                <div className="detail-item"><label>Phone</label><span>{selectedCustomer.mobile}</span></div>
                <div className="detail-item"><label>Email</label><span>{selectedCustomer.email}</span></div>
                <div className="detail-item"><label>Vehicles</label><span>{selectedCustomer.vehicleCount}</span></div>
                <div className="detail-item"><label>Total Bookings</label><span>{selectedCustomer.bookingCount}</span></div>
                <div className="detail-item"><label>Completed Washes</label><span style={{ fontWeight: 700, color: '#1a73e8' }}>{selectedCustomer.completedCount || 0}</span></div>
                <div className="detail-item"><label>No-shows</label><span style={{ color: selectedCustomer.noShowCount > 0 ? '#e37400' : 'inherit', fontWeight: selectedCustomer.noShowCount > 0 ? 700 : 400 }}>{selectedCustomer.noShowCount || 0}</span></div>
                <div className="detail-item"><label>Booking Blocked Until</label><span style={{ color: isBlocked(selectedCustomer) ? '#ea4335' : 'inherit', fontWeight: isBlocked(selectedCustomer) ? 700 : 400 }}>{isBlocked(selectedCustomer) ? new Date(selectedCustomer.bookingBlockedUntil).toLocaleDateString('en-IN') : 'Not blocked'}</span></div>
                {isBlocked(selectedCustomer) && selectedCustomer.bookingBlockReason && (
                  <div className="detail-item"><label>Block Reason</label><span style={{ color: '#ea4335' }}>{selectedCustomer.bookingBlockReason}</span></div>
                )}
                <div className="detail-item"><label>Registered</label><span>{new Date(selectedCustomer.createdAt).toLocaleDateString()}</span></div>
              </div>

              <div style={{ marginTop: '16px', padding: '14px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg)' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '10px', color: isBlocked(selectedCustomer) ? '#ea4335' : 'var(--text-primary)' }}>
                  {isBlocked(selectedCustomer) ? 'Booking blocked' : 'Block from booking'}
                </div>
                {isBlocked(selectedCustomer) ? (
                  <button className="btn btn-sm btn-success" onClick={handleUnblock} disabled={busy}>
                    {busy ? 'Working...' : 'Unblock & clear strikes'}
                  </button>
                ) : (
                  <>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                      {BLOCK_DAY_OPTIONS.map((d) => (
                        <button
                          key={d}
                          type="button"
                          className={`btn btn-sm ${blockDays === d ? 'btn-danger' : 'btn-secondary'}`}
                          onClick={() => setBlockDays(d)}
                        >
                          {d} days
                        </button>
                      ))}
                    </div>
                    <input
                      className="form-control"
                      style={{ marginBottom: '10px' }}
                      placeholder="Reason (optional, shown to customer)"
                      value={blockReason}
                      onChange={(e) => setBlockReason(e.target.value)}
                    />
                    <button className="btn btn-sm btn-danger" onClick={handleBlock} disabled={busy}>
                      {busy ? 'Working...' : `Block for ${blockDays} days`}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
