import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Modal, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { adminStaffAPI } from '../../services/api';
import { COLORS, SHADOWS } from '../../utils/theme';

const AdminStaffScreen = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ fullName: '', email: '', mobile: '', password: '', employeeId: '', skills: '', maxDailyBookings: '10' });

  const fetchData = async (silent = false) => {
    try { const res = await adminStaffAPI.getAll(); setStaff(res.data.data.staff || []); } catch (e) { console.log('Error:', e?.message); }
    if (!silent) setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);
  const onRefresh = async () => { setRefreshing(true); await fetchData(); setRefreshing(false); };

  const openAdd = () => { setEditing(null); setForm({ fullName: '', email: '', mobile: '', password: '', employeeId: '', skills: '', maxDailyBookings: '10' }); setShowModal(true); };
  const openEdit = (s) => {
    setEditing(s);
    setForm({ fullName: s.user?.fullName || '', email: s.user?.email || '', mobile: s.user?.mobile || '', password: '', employeeId: s.employeeId, skills: (s.skills || []).join(', '), maxDailyBookings: String(s.maxDailyBookings) });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    const payload = { ...form, maxDailyBookings: parseInt(form.maxDailyBookings), skills: form.skills.split(',').map(s => s.trim()).filter(Boolean) };
    if (!payload.password) delete payload.password;
    try { if (editing) await adminStaffAPI.update(editing._id, payload); else await adminStaffAPI.create(payload); setShowModal(false); fetchData(); } catch (e) { Alert.alert('Error', e.response?.data?.message || 'Failed'); }
  };

  const handleToggle = async (id) => { try { await adminStaffAPI.toggleActive(id); fetchData(); } catch (e) { console.log('Error:', e?.message); } };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}>
      <TouchableOpacity style={styles.addBtn} onPress={openAdd} activeOpacity={0.8}>
        <Ionicons name="add-circle" size={18} color="#fff" /><Text style={styles.addBtnText}>Add Staff</Text>
      </TouchableOpacity>

      {loading ? <Text style={styles.empty}>Loading...</Text> : staff.length === 0 ? (
        <Text style={styles.empty}>No staff members</Text>
      ) : (
        staff.map(s => (
          <View key={s._id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{s.user?.fullName}</Text>
                <Text style={styles.cardSub}>{s.employeeId}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: s.isActive ? COLORS.successLight : COLORS.dangerLight }]}>
                <Text style={[styles.badgeText, { color: s.isActive ? COLORS.success : COLORS.danger }]}>{s.isActive ? 'Active' : 'Inactive'}</Text>
              </View>
            </View>
            <Text style={styles.cardSub}>{s.user?.email} · {s.user?.mobile}</Text>
            <Text style={styles.cardSub}>Skills: {(s.skills || []).join(', ') || '-'}</Text>
            <Text style={styles.cardSub}>Max Daily: {s.maxDailyBookings}</Text>
            <View style={styles.actions}>
              <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(s)} activeOpacity={0.7}>
                <Ionicons name="create-outline" size={16} color="#fff" /><Text style={styles.actionText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.toggleBtn, { backgroundColor: s.isActive ? COLORS.danger : COLORS.success }]} onPress={() => handleToggle(s._id)} activeOpacity={0.7}>
                <Text style={styles.actionText}>{s.isActive ? 'Disable' : 'Enable'}</Text>
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
                <Text style={styles.modalTitle}>{editing ? 'Edit' : 'Add'} Staff</Text>
                <TouchableOpacity onPress={() => setShowModal(false)} style={styles.modalClose}><Ionicons name="close" size={22} color={COLORS.text} /></TouchableOpacity>
              </View>
              <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput style={styles.input} value={form.fullName} onChangeText={v => setForm({ ...form, fullName: v })} placeholderTextColor={COLORS.textLight} />
            <Text style={styles.label}>Email</Text>
            <TextInput style={styles.input} value={form.email} onChangeText={v => setForm({ ...form, email: v })} keyboardType="email-address" placeholderTextColor={COLORS.textLight} />
            <Text style={styles.label}>Mobile</Text>
            <TextInput style={styles.input} value={form.mobile} onChangeText={v => setForm({ ...form, mobile: v })} keyboardType="phone-pad" placeholderTextColor={COLORS.textLight} />
            {!editing && <><Text style={styles.label}>Password</Text><TextInput style={styles.input} value={form.password} onChangeText={v => setForm({ ...form, password: v })} secureTextEntry placeholderTextColor={COLORS.textLight} /></>}
            <Text style={styles.label}>Employee ID</Text>
            <TextInput style={styles.input} value={form.employeeId} onChangeText={v => setForm({ ...form, employeeId: v })} placeholderTextColor={COLORS.textLight} />
            <Text style={styles.label}>Max Daily Bookings</Text>
            <TextInput style={styles.input} value={form.maxDailyBookings} onChangeText={v => setForm({ ...form, maxDailyBookings: v })} keyboardType="numeric" placeholderTextColor={COLORS.textLight} />
            <Text style={styles.label}>Skills (comma separated)</Text>
            <TextInput style={styles.input} value={form.skills} onChangeText={v => setForm({ ...form, skills: v })} placeholder="Washing, Detailing, Interior" placeholderTextColor={COLORS.textLight} />
            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} activeOpacity={0.8}>
              <Text style={styles.submitBtnText}>{editing ? 'Update' : 'Add'}</Text>
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
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  cardSub: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 2 },
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

export default AdminStaffScreen;
