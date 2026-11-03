import { useState, useEffect } from 'react';
import { adminAPI, staffAPI } from '../services/api';
import { FiPlus, FiEdit } from 'react-icons/fi';

const Staff = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [formData, setFormData] = useState({ fullName: '', email: '', mobile: '', password: '', employeeId: '', skills: '', maxDailyBookings: 10 });

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getStaff();
      setStaff(res.data.data.staff);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStaff(); }, []);

  const openAdd = () => {
    setEditingStaff(null);
    setFormData({ fullName: '', email: '', mobile: '', password: '', employeeId: '', skills: '', maxDailyBookings: 10 });
    setShowModal(true);
  };

  const openEdit = (s) => {
    setEditingStaff(s);
    setFormData({
      fullName: s.user?.fullName || '',
      email: s.user?.email || '',
      mobile: s.user?.mobile || '',
      password: '',
      employeeId: s.employeeId,
      skills: (s.skills || []).join(', '),
      maxDailyBookings: s.maxDailyBookings,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      skills: formData.skills.split(',').map((s) => s.trim()).filter(Boolean),
    };
    if (!payload.password) delete payload.password;
    try {
      if (editingStaff) {
        await staffAPI.update(editingStaff._id, payload);
      } else {
        await staffAPI.create(payload);
      }
      setShowModal(false);
      fetchStaff();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save staff');
    }
  };

  const handleToggle = async (id) => {
    try {
      await staffAPI.toggleActive(id);
      fetchStaff();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to toggle staff');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2>Staff</h2>
        <button className="btn btn-primary" onClick={openAdd}><FiPlus /> Add Staff</button>
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner"></div></div>
      ) : staff.length === 0 ? (
        <div className="card empty-state"><h3>No staff members</h3></div>
      ) : (
        <>
          {/* MOBILE CARDS */}
          {staff.map((s) => (
            <div key={s._id} className="mobile-card">
              <div className="mobile-card-header">
                <div>
                  <div className="mobile-card-title">{s.user?.fullName}</div>
                  <div className="mobile-card-subtitle" style={{ fontFamily: 'monospace' }}>{s.employeeId}</div>
                </div>
                <span className={`badge ${s.isActive ? 'badge-success' : 'badge-danger'}`}>{s.isActive ? 'Active' : 'Inactive'}</span>
              </div>
              <div className="mobile-card-row">
                <span className="mobile-card-label">Email</span>
                <span className="mobile-card-value">{s.user?.email}</span>
              </div>
              <div className="mobile-card-row">
                <span className="mobile-card-label">Phone</span>
                <span className="mobile-card-value">{s.user?.mobile}</span>
              </div>
              <div className="mobile-card-row">
                <span className="mobile-card-label">Skills</span>
                <span className="mobile-card-value">{(s.skills || []).join(', ') || '-'}</span>
              </div>
              <div className="mobile-card-row">
                <span className="mobile-card-label">Max Daily</span>
                <span className="mobile-card-value">{s.maxDailyBookings}</span>
              </div>
              <div className="mobile-card-actions">
                <button className="btn btn-sm btn-secondary" onClick={() => openEdit(s)} style={{ flex: 1 }}><FiEdit /> Edit</button>
                <button className={`btn btn-sm ${s.isActive ? 'btn-danger' : 'btn-success'}`} onClick={() => handleToggle(s._id)} style={{ flex: 1 }}>{s.isActive ? 'Disable' : 'Enable'}</button>
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
                    <th>Employee ID</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Skills</th>
                    <th>Max Daily</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map((s) => (
                    <tr key={s._id}>
                      <td>{s.user?.fullName}</td>
                      <td style={{ fontFamily: 'monospace' }}>{s.employeeId}</td>
                      <td>{s.user?.email}</td>
                      <td>{s.user?.mobile}</td>
                      <td>{(s.skills || []).join(', ') || '-'}</td>
                      <td>{s.maxDailyBookings}</td>
                      <td><span className={`badge ${s.isActive ? 'badge-success' : 'badge-danger'}`}>{s.isActive ? 'Active' : 'Inactive'}</span></td>
                      <td>
                        <div className="action-buttons">
                          <button className="btn btn-sm btn-secondary" onClick={() => openEdit(s)}><FiEdit /></button>
                          <button className={`btn btn-sm ${s.isActive ? 'btn-danger' : 'btn-success'}`} onClick={() => handleToggle(s._id)}>{s.isActive ? 'Disable' : 'Enable'}</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingStaff ? 'Edit Staff' : 'Add Staff'}</h3>
              <button className="btn btn-sm btn-secondary" onClick={() => setShowModal(false)}>Close</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Full Name</label>
                  <input className="form-control" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Email</label>
                    <input type="email" className="form-control" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Mobile</label>
                    <input className="form-control" value={formData.mobile} onChange={(e) => setFormData({ ...formData, mobile: e.target.value })} required pattern="[6-9]\d{9}" />
                  </div>
                </div>
                {!editingStaff && (
                  <div className="form-group">
                    <label>Password</label>
                    <input type="password" className="form-control" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required={!editingStaff} />
                  </div>
                )}
                <div className="form-row">
                  <div className="form-group">
                    <label>Employee ID</label>
                    <input className="form-control" value={formData.employeeId} onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Max Daily Bookings</label>
                    <input type="number" className="form-control" value={formData.maxDailyBookings} onChange={(e) => setFormData({ ...formData, maxDailyBookings: parseInt(e.target.value) })} min="1" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Skills (comma separated)</label>
                  <input className="form-control" value={formData.skills} onChange={(e) => setFormData({ ...formData, skills: e.target.value })} placeholder="e.g. Washing, Detailing, Interior" />
                </div>
                <div className="modal-footer" style={{ padding: '16px 0 0', border: 'none' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">{editingStaff ? 'Update' : 'Add'} Staff</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Staff;
