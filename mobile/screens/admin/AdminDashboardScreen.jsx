import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { adminAPI } from '../../services/api';
import { COLORS, SHADOWS } from '../../utils/theme';

const StatCard = ({ icon, label, value, color }) => (
  <View style={[styles.statCard, { borderLeftColor: color }]}>
    <View style={[styles.statIcon, { backgroundColor: color + '15' }]}>
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const AdminDashboardScreen = () => {
  const [data, setData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async (silent = false) => {
    try { const res = await adminAPI.getDashboard(); setData(res.data.data); } catch (e) { console.log('Error:', e?.message); }
  };

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { const i = setInterval(() => fetchData(true), 15000); return () => clearInterval(i); }, []);
  const onRefresh = async () => { setRefreshing(true); await fetchData(); setRefreshing(false); };

  if (!data) return <View style={styles.center}><Text style={{ color: COLORS.textLight }}>Loading...</Text></View>;

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}>
      <View style={styles.statsGrid}>
        <StatCard icon="calendar" label="Today" value={data.todayBookings} color={COLORS.primary} />
        <StatCard icon="time" label="Pending" value={data.pendingBookings} color="#f39c12" />
        <StatCard icon="checkmark-circle" label="Done" value={data.completedToday} color={COLORS.success} />
        <StatCard icon="alert-circle" label="No-shows" value={data.noShowsToday} color={COLORS.danger} />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Bookings</Text>
        <View style={styles.sectionCount}><Text style={styles.sectionCountText}>{data.recentBookings.length}</Text></View>
      </View>

      {data.recentBookings.length === 0 ? (
        <View style={styles.emptyWrap}><Text style={styles.empty}>No recent bookings</Text></View>
      ) : (
        data.recentBookings.map((b) => (
          <View key={b._id} style={styles.card}>
            <View style={styles.cardRow}>
              <View style={styles.cardLeft}>
                <Text style={styles.cardTitle}>{b.user?.fullName}</Text>
                <Text style={styles.cardSub}>{b.vehicle?.registrationNumber}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: b.status === 'COMPLETED' ? COLORS.successLight : b.status === 'CANCELLED' ? COLORS.dangerLight : COLORS.primaryLight }]}>
                <Text style={[styles.badgeText, { color: b.status === 'COMPLETED' ? COLORS.success : b.status === 'CANCELLED' ? COLORS.danger : '#fff' }]}>{b.status.replace(/_/g, ' ')}</Text>
              </View>
            </View>
            <Text style={styles.cardService}>{b.service?.name}</Text>
            <Text style={styles.cardDate}>{new Date(b.bookingDate).toLocaleDateString()}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, padding: 16 },
  statCard: { width: '47%', backgroundColor: COLORS.white, borderRadius: 14, padding: 14, borderLeftWidth: 3, ...SHADOWS.small, borderWidth: 1, borderColor: COLORS.borderLight },
  statIcon: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  statValue: { fontSize: 24, fontWeight: '700', color: COLORS.text, letterSpacing: -0.5 },
  statLabel: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  sectionCount: { backgroundColor: COLORS.bg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  sectionCountText: { fontSize: 12, color: COLORS.textLight },
  card: { backgroundColor: COLORS.white, borderRadius: 14, padding: 14, marginHorizontal: 16, marginBottom: 8, ...SHADOWS.small, borderWidth: 1, borderColor: COLORS.borderLight },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  cardLeft: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  cardSub: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  cardService: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 2 },
  cardDate: { fontSize: 12, color: COLORS.textLight },
  emptyWrap: { padding: 40 },
  empty: { textAlign: 'center', color: COLORS.textLight, fontSize: 14 },
});

export default AdminDashboardScreen;
