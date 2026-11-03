import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { adminAPI, adminBookingAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SHADOWS } from '../../utils/theme';

const statusColors = {
  CONFIRMED: { bg: COLORS.primaryLight, color: '#fff' },
  VEHICLE_RECEIVED: { bg: '#fef9e7', color: '#f39c12' },
  WASHING: { bg: '#ebf5fb', color: '#2196f3' },
  CLEANING: { bg: '#f5eef8', color: '#9c27b0' },
  READY: { bg: '#eafaf1', color: '#2e7d32' },
  COMPLETED: { bg: COLORS.successLight, color: COLORS.success },
  CANCELLED: { bg: COLORS.dangerLight, color: COLORS.danger },
  NO_SHOW: { bg: COLORS.dangerLight, color: COLORS.danger },
};

const nextStatusMap = { CONFIRMED: 'VEHICLE_RECEIVED', VEHICLE_RECEIVED: 'WASHING', WASHING: 'CLEANING', CLEANING: 'READY', READY: 'COMPLETED' };

const AdminVehiclesScreen = ({ navigation }) => {
  const { user } = useAuth();
  const isStaff = user?.role === 'staff';
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const fetchData = async (silent = false) => {
    try { const res = await adminAPI.getVehiclesWithBookings(); setVehicles(res.data.data.vehicles || []); } catch (e) { console.log('Error:', e?.message); }
    if (!silent) setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { const i = setInterval(() => fetchData(true), 10000); return () => clearInterval(i); }, []);
  const onRefresh = async () => { setRefreshing(true); await fetchData(); setRefreshing(false); };
  const handleStatus = async (id, status) => { try { await adminBookingAPI.updateStatus(id, status); fetchData(); } catch (e) { console.log('Error:', e?.message); } };
  const handleCancel = (id) => {
    Alert.alert('Cancel Booking', 'Are you sure you want to cancel this booking?', [
      { text: 'No', style: 'cancel' },
      { text: 'Yes, Cancel', style: 'destructive', onPress: async () => {
        try { await adminBookingAPI.cancel(id, 'Cancelled by admin'); fetchData(); } catch (e) { console.log('Error:', e?.message); }
      }},
    ]);
  };

  const filtered = vehicles.filter(v => { if (!search) return true; const s = search.toLowerCase(); return v.registrationNumber?.toLowerCase().includes(s) || v.make?.toLowerCase().includes(s) || v.user?.fullName?.toLowerCase().includes(s); });
  const active = filtered.filter(v => v.activeBookings.length > 0);
  const idle = filtered.filter(v => v.activeBookings.length === 0);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Workshop</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={COLORS.textLight} />
          <TextInput style={styles.searchInput} placeholder="Search vehicles..." placeholderTextColor={COLORS.textLight} value={search} onChangeText={setSearch} />
        </View>

      {loading ? <Text style={styles.empty}>Loading...</Text> : (
        <>
          {active.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Active Work ({active.length})</Text>
              {active.map(v => v.activeBookings.map(b => {
                const sc = statusColors[b.status] || statusColors.CONFIRMED;
                let next = nextStatusMap[b.status];
                if (isStaff && !['VEHICLE_RECEIVED', 'WASHING', 'CLEANING', 'READY'].includes(next)) next = null;
                    const canCancel = !['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(b.status);
                return (
                  <View key={b._id} style={styles.card}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.regNo}>{v.registrationNumber}</Text>
                      <View style={[styles.badge, { backgroundColor: sc.bg }]}><Text style={[styles.badgeText, { color: sc.color }]}>{b.status.replace(/_/g, ' ')}</Text></View>
                    </View>
                    {(next || canCancel) && (
                      <View style={styles.inlineActions}>
                        {next && (
                          <TouchableOpacity style={styles.actionBtn} onPress={() => handleStatus(b._id, next)} activeOpacity={0.7}>
                            <Text style={styles.actionText}>→ {next.replace(/_/g, ' ')}</Text>
                          </TouchableOpacity>
                        )}
                        {canCancel && (
                          <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancel(b._id)} activeOpacity={0.7}>
                            <Text style={styles.cancelText}>Cancel</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                    <Text style={styles.cardSub}>{v.make} {v.model} · {v.vehicleType}</Text>
                    <Text style={styles.cardSub}>{v.user?.fullName} · {v.user?.mobile || 'N/A'}</Text>
                    <Text style={styles.cardSub}>{b.service?.name} · {b.timeSlot}{b.duration ? ` · ${b.duration} min` : ''}</Text>
                    <Text style={styles.cardPrice}>₹{b.finalPrice || b.price} <Text style={styles.cardPriceNote}>· pay at counter</Text></Text>
                    {b.assignedStaff?.employeeId && <Text style={styles.cardSub}>Assigned: {b.assignedStaff.employeeId}</Text>}
                    {b.notes ? <Text style={styles.cardSub}>Notes: {b.notes}</Text> : null}
                  </View>
                );
              }))}
            </>
          )}
          {idle.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Idle ({idle.length})</Text>
              {idle.map(v => (
                <View key={v._id} style={styles.card}>
                  <Text style={styles.regNo}>{v.registrationNumber}</Text>
                  <Text style={styles.cardSub}>{v.make} {v.model} · {v.vehicleType}</Text>
                  <Text style={styles.cardSub}>{v.user?.fullName}</Text>
                </View>
              ))}
            </>
          )}
        </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 56, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, letterSpacing: -0.3 },
  container: { flex: 1, backgroundColor: COLORS.bg, padding: 12 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 14, padding: 10, marginBottom: 12, gap: 8, ...SHADOWS.small, borderWidth: 1, borderColor: COLORS.borderLight },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.text },
  sectionTitle: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 8, color: COLORS.text, textTransform: 'uppercase', letterSpacing: 0.5 },
  card: { backgroundColor: COLORS.white, borderRadius: 14, padding: 14, marginBottom: 8, ...SHADOWS.small, borderWidth: 1, borderColor: COLORS.borderLight },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  regNo: { fontSize: 14, fontWeight: '700', fontFamily: 'monospace', color: COLORS.text },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  cardSub: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 2 },
  cardPrice: { fontSize: 15, fontWeight: '700', color: COLORS.primary, marginTop: 4 },
  cardPriceNote: { fontSize: 11, fontWeight: '500', color: COLORS.textLight },
  inlineActions: { flexDirection: 'row', gap: 8, marginBottom: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.success, padding: 10, borderRadius: 10 },
  actionText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  cancelBtn: { paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.dangerLight, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(231,76,60,0.2)' },
  cancelText: { color: COLORS.danger, fontSize: 12, fontWeight: '700' },
  empty: { textAlign: 'center', color: COLORS.textLight, padding: 40, fontSize: 14 },
});

export default AdminVehiclesScreen;
