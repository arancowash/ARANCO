import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Modal, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { adminServiceAPI } from '../../services/api';
import { COLORS, SHADOWS } from '../../utils/theme';

const vehicleTypes = ['Hatchback', 'Sedan', 'SUV', 'MUV', 'Luxury', 'Other'];

const AdminServicesScreen = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', includedServices: '', duration: '60', pricing: vehicleTypes.map(v => ({ vehicleType: v, price: '', offerPrice: '' })) });

  const fetchData = async (silent = false) => {
    try { const res = await adminServiceAPI.getAll(); setServices(res.data.data.services || []); } catch (e) { console.log('Error:', e?.message); }
    if (!silent) setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);
  const onRefresh = async () => { setRefreshing(true); await fetchData(); setRefreshing(false); };

  const openAdd = () => { setEditing(null); setForm({ name: '', description: '', includedServices: '', duration: '60', pricing: vehicleTypes.map(v => ({ vehicleType: v, price: '', offerPrice: '' })) }); setShowModal(true); };
  const openEdit = (s) => {
    setEditing(s);
    setForm({ name: s.name, description: s.description, includedServices: (s.includedServices || []).join(', '), duration: String(s.duration), pricing: vehicleTypes.map(v => { const p = (s.vehicleCategoryPricing || []).find(x => x.vehicleType === v); return { vehicleType: v, price: p ? String(p.price) : '', offerPrice: p && p.offerPrice != null ? String(p.offerPrice) : '' }; }) });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    const payload = {
      name: form.name,
      description: form.description,
      includedServices: form.includedServices.split(',').map(s => s.trim()).filter(Boolean),
      duration: parseInt(form.duration),
      vehicleCategoryPricing: form.pricing.filter(p => p.price !== '').map(p => {
        const entry = { vehicleType: p.vehicleType, price: parseFloat(p.price) };
        if (p.offerPrice !== '') entry.offerPrice = parseFloat(p.offerPrice);
        return entry;
      }),
    };
    try { if (editing) await adminServiceAPI.update(editing._id, payload); else await adminServiceAPI.create(payload); setShowModal(false); fetchData(); } catch (e) { Alert.alert('Error', e.response?.data?.message || 'Failed'); }
  };

  const handleToggle = async (id) => { try { await adminServiceAPI.toggleActive(id); fetchData(); } catch (e) { console.log('Error:', e?.message); } };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}>
      <TouchableOpacity style={styles.addBtn} onPress={openAdd} activeOpacity={0.8}>
        <Ionicons name="add-circle" size={18} color="#fff" /><Text style={styles.addBtnText}>Add Service</Text>
      </TouchableOpacity>

      {loading ? <Text style={styles.empty}>Loading...</Text> : services.length === 0 ? (
        <Text style={styles.empty}>No services configured</Text>
      ) : (
        services.map(s => (
          <View key={s._id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{s.name}</Text>
              <View style={[styles.badge, { backgroundColor: s.isActive ? COLORS.successLight : COLORS.dangerLight }]}>
                <Text style={[styles.badgeText, { color: s.isActive ? COLORS.success : COLORS.danger }]}>{s.isActive ? 'Active' : 'Inactive'}</Text>
              </View>
            </View>
            <Text style={styles.cardSub}>{s.description}</Text>
            <Text style={styles.cardSub}>Duration: {s.duration} min · Included: {(s.includedServices || []).length} items</Text>
            <View style={styles.pricingBox}>
              {(s.vehicleCategoryPricing || []).map(p => {
                const onOffer = p.offerPrice != null && p.offerPrice < p.price;
                const pctOff = onOffer ? Math.round((1 - p.offerPrice / p.price) * 100) : 0;
                return (
                  <View key={p.vehicleType} style={styles.pricingRow}>
                    <Text style={styles.pricingType}>{p.vehicleType}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      {onOffer && <Text style={styles.pricingOriginal}>₹{p.price}</Text>}
                      {onOffer && <Text style={styles.pricingPct}>{pctOff}% OFF</Text>}
                      <Text style={styles.pricingPrice}>₹{onOffer ? p.offerPrice : p.price}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
            <View style={styles.actions}>
              <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(s)} activeOpacity={0.7}>
                <Ionicons name="create-outline" size={16} color="#fff" /><Text style={styles.actionText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.toggleBtn, { backgroundColor: s.isActive ? COLORS.danger : COLORS.success }]} onPress={() => handleToggle(s._id)} activeOpacity={0.7}>
                <Text style={styles.actionText}>{s.isActive ? 'Deactivate' : 'Activate'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      <Modal visible={showModal} transparent animationType="fade" onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ width: '100%' }}>
            <View style={styles.modalDialog}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{editing ? 'Edit' : 'Add'} Service</Text>
                <TouchableOpacity onPress={() => setShowModal(false)} style={styles.modalClose}><Ionicons name="close" size={22} color={COLORS.text} /></TouchableOpacity>
              </View>
              <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
            <Text style={styles.label}>Name</Text>
            <TextInput style={styles.input} value={form.name} onChangeText={v => setForm({ ...form, name: v })} placeholderTextColor={COLORS.textLight} />
            <Text style={styles.label}>Description</Text>
            <TextInput style={styles.input} value={form.description} onChangeText={v => setForm({ ...form, description: v })} multiline numberOfLines={3} placeholderTextColor={COLORS.textLight} />
            <Text style={styles.label}>Included Services (comma separated)</Text>
            <TextInput style={styles.input} value={form.includedServices} onChangeText={v => setForm({ ...form, includedServices: v })} multiline numberOfLines={2} placeholder="e.g. Exterior wash, Interior vacuum" placeholderTextColor={COLORS.textLight} />
            <Text style={styles.label}>Duration (min)</Text>
            <TextInput style={styles.input} value={form.duration} onChangeText={v => setForm({ ...form, duration: v })} keyboardType="numeric" placeholderTextColor={COLORS.textLight} />
            <Text style={[styles.label, { marginTop: 12 }]}>Vehicle Pricing (Price = original, Offer = discounted)</Text>
            {form.pricing.map((p, i) => (
              <View key={p.vehicleType} style={styles.pricingFormCol}>
                <Text style={styles.pricingFormType}>{p.vehicleType}</Text>
                <View style={styles.pricingFormRow}>
                  <TextInput style={[styles.input, { flex: 1, marginBottom: 0 }]} value={p.price} onChangeText={v => { const u = [...form.pricing]; u[i] = { ...u[i], price: v }; setForm({ ...form, pricing: u }); }} keyboardType="numeric" placeholder="Price ₹" placeholderTextColor={COLORS.textLight} />
                  <TextInput style={[styles.input, { flex: 1, marginBottom: 0 }]} value={p.offerPrice} onChangeText={v => { const u = [...form.pricing]; u[i] = { ...u[i], offerPrice: v }; setForm({ ...form, pricing: u }); }} keyboardType="numeric" placeholder="Offer ₹" placeholderTextColor={COLORS.textLight} />
                </View>
              </View>
            ))}
            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} activeOpacity={0.8}>
              <Text style={styles.submitBtnText}>{editing ? 'Update' : 'Create'}</Text>
            </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, padding: 12 },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, borderRadius: 14, padding: 12, marginBottom: 12, gap: 6, ...SHADOWS.small },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  card: { backgroundColor: COLORS.white, borderRadius: 14, padding: 14, marginBottom: 8, ...SHADOWS.small, borderWidth: 1, borderColor: COLORS.borderLight },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  cardSub: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 2 },
  pricingBox: { backgroundColor: COLORS.bg, borderRadius: 10, padding: 10, marginTop: 8 },
  pricingRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  pricingType: { fontSize: 13, color: COLORS.textSecondary },
  pricingPrice: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  pricingOriginal: { fontSize: 12, color: COLORS.textLight, textDecorationLine: 'line-through' },
  pricingPct: { fontSize: 10, fontWeight: '800', color: '#f39c12' },
  pricingFormCol: { marginBottom: 10 },
  pricingFormRow: { flexDirection: 'row', gap: 8 },
  pricingFormType: { fontSize: 14, color: COLORS.text, flex: 1, marginBottom: 4 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  editBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, padding: 10, borderRadius: 10, backgroundColor: COLORS.primary },
  toggleBtn: { flex: 1, padding: 10, borderRadius: 10, alignItems: 'center' },
  actionText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  empty: { textAlign: 'center', color: COLORS.textLight, padding: 40, fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,43,70,0.45)', justifyContent: 'center', paddingHorizontal: 20 },
  modalDialog: { backgroundColor: COLORS.white, borderRadius: 20, maxHeight: '85%', borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOWS.medium },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  modalTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  modalClose: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' },
  modalBody: { padding: 16 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6, color: COLORS.text },
  input: { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, padding: 12, fontSize: 15, marginBottom: 12, backgroundColor: COLORS.bg, color: COLORS.text },
  submitBtn: { backgroundColor: COLORS.primary, borderRadius: 14, padding: 14, alignItems: 'center', marginTop: 12, ...SHADOWS.medium },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});

export default AdminServicesScreen;
