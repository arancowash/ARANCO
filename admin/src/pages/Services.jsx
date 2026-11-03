import { useState, useEffect } from 'react';
import { serviceAPI } from '../services/api';
import { FiPlus, FiEdit } from 'react-icons/fi';

const vehicleTypes = ['Hatchback', 'Sedan', 'SUV', 'MUV', 'Luxury', 'Other'];

const Services = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState({
    name: '', description: '', includedServices: '', duration: 60,
    vehicleCategoryPricing: vehicleTypes.map((v) => ({ vehicleType: v, price: '' })),
  });

  const fetchServices = async () => {
    setLoading(true);
    try {
      const res = await serviceAPI.getAll();
      setServices(res.data.data.services);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchServices(); }, []);

  const openAdd = () => {
    setEditingService(null);
    setFormData({ name: '', description: '', includedServices: '', duration: 60, vehicleCategoryPricing: vehicleTypes.map((v) => ({ vehicleType: v, price: '', offerPrice: '' })) });
    setShowModal(true);
  };

  const openEdit = (service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description,
      includedServices: (service.includedServices || []).join(', '),
      duration: service.duration,
      vehicleCategoryPricing: vehicleTypes.map((v) => {
        const existing = (service.vehicleCategoryPricing || []).find((p) => p.vehicleType === v);
        return { vehicleType: v, price: existing ? existing.price : '', offerPrice: existing && existing.offerPrice != null ? existing.offerPrice : '' };
      }),
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      includedServices: formData.includedServices.split(',').map((s) => s.trim()).filter(Boolean),
      vehicleCategoryPricing: formData.vehicleCategoryPricing.filter((p) => p.price !== '').map((p) => {
        const entry = { vehicleType: p.vehicleType, price: Number(p.price) };
        if (p.offerPrice !== '') entry.offerPrice = Number(p.offerPrice);
        return entry;
      }),
    };
    try {
      if (editingService) {
        await serviceAPI.update(editingService._id, payload);
      } else {
        await serviceAPI.create(payload);
      }
      setShowModal(false);
      fetchServices();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save service');
    }
  };

  const handleToggle = async (id) => {
    try {
      await serviceAPI.toggleActive(id);
      fetchServices();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to toggle service');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2>Services</h2>
        <button className="btn btn-primary" onClick={openAdd}><FiPlus /> Add Service</button>
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner"></div></div>
      ) : services.length === 0 ? (
        <div className="card empty-state"><h3>No services configured</h3><p>Add your first service to get started</p></div>
      ) : (
        <div className="service-grid">
          {services.map((s) => (
            <div key={s._id} className="service-card">
              <div className="service-card-header">
                <span className="service-card-name">{s.name}</span>
                <span className={`badge ${s.isActive ? 'badge-success' : 'badge-danger'}`}>{s.isActive ? 'Active' : 'Inactive'}</span>
              </div>
              <p className="service-card-desc">{s.description}</p>
              <div style={{ fontSize: '12px', color: 'var(--text-light)', marginBottom: '10px' }}>
                Duration: {s.duration} min
              </div>
              <div className="service-pricing">
                {(s.vehicleCategoryPricing || []).map((p) => {
                  const onOffer = p.offerPrice != null && p.offerPrice < p.price;
                  const pctOff = onOffer ? Math.round((1 - p.offerPrice / p.price) * 100) : 0;
                  return (
                    <div key={p.vehicleType} className="service-pricing-row">
                      <span className="service-pricing-type">{p.vehicleType}</span>
                      <span>
                        {onOffer && <span style={{ textDecoration: 'line-through', color: 'var(--text-light)', marginRight: 6 }}>₹{p.price}</span>}
                        {onOffer && <span style={{ background: '#f39c12', color: '#fff', borderRadius: 4, padding: '1px 5px', fontSize: '10px', fontWeight: 700, marginRight: 6 }}>{pctOff}% OFF</span>}
                        <span style={{ color: onOffer ? '#f39c12' : undefined, fontWeight: onOffer ? 700 : undefined }}>₹{onOffer ? p.offerPrice : p.price}</span>
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="service-card-actions">
                <button className="btn btn-sm btn-secondary" onClick={() => openEdit(s)}><FiEdit /> Edit</button>
                <button className={`btn btn-sm ${s.isActive ? 'btn-danger' : 'btn-success'}`} onClick={() => handleToggle(s._id)}>{s.isActive ? 'Deactivate' : 'Activate'}</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingService ? 'Edit Service' : 'Add Service'}</h3>
              <button className="btn btn-sm btn-secondary" onClick={() => setShowModal(false)}>Close</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Service Name</label>
                  <input className="form-control" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea className="form-control" rows="3" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Included Services (comma separated)</label>
                  <input className="form-control" value={formData.includedServices} onChange={(e) => setFormData({ ...formData, includedServices: e.target.value })} placeholder="e.g. Exterior wash, Interior vacuum, Dashboard cleaning" />
                </div>
                <div className="form-group">
                  <label>Duration (minutes)</label>
                  <input type="number" className="form-control" value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })} min="15" required />
                </div>
                <h4 style={{ fontSize: '14px', marginBottom: '12px' }}>Vehicle Category Pricing (Price = original, Offer = discounted)</h4>
                {formData.vehicleCategoryPricing.map((p, i) => (
                  <div key={p.vehicleType} className="form-row" style={{ marginBottom: '12px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>{p.vehicleType}</label>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <input type="number" className="form-control" placeholder="Price" value={p.price} onChange={(e) => {
                        const updated = [...formData.vehicleCategoryPricing];
                        updated[i].price = e.target.value;
                        setFormData({ ...formData, vehicleCategoryPricing: updated });
                      }} min="0" />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <input type="number" className="form-control" placeholder="Offer (optional)" value={p.offerPrice} onChange={(e) => {
                        const updated = [...formData.vehicleCategoryPricing];
                        updated[i].offerPrice = e.target.value;
                        setFormData({ ...formData, vehicleCategoryPricing: updated });
                      }} min="0" />
                    </div>
                  </div>
                ))}
                <div className="modal-footer" style={{ padding: '16px 0 0', border: 'none' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">{editingService ? 'Update' : 'Create'} Service</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Services;
