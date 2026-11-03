import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Animated, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { bookingAPI } from '../services/api';
import { COLORS, SHADOWS } from '../utils/theme';

const STATUS_CONFIG = {
  CONFIRMED: { bg: COLORS.primaryLight, text: '#fff', icon: 'checkmark-circle-outline', border: COLORS.primary },
  VEHICLE_RECEIVED: { bg: '#fef9e7', text: '#f39c12', icon: 'car-outline', border: '#f39c12' },
  WASHING: { bg: '#ebf5fb', text: '#2196f3', icon: 'water-outline', border: '#2196f3' },
  CLEANING: { bg: '#f5eef8', text: '#9c27b0', icon: 'sparkles-outline', border: '#9c27b0' },
  READY: { bg: '#eafaf1', text: '#2e7d32', icon: 'checkmark-done-circle-outline', border: '#2e7d32' },
  COMPLETED: { bg: COLORS.successLight, text: COLORS.success, icon: 'trophy-outline', border: COLORS.success },
  CANCELLED: { bg: COLORS.dangerLight, text: COLORS.danger, icon: 'close-circle-outline', border: COLORS.danger },
  NO_SHOW: { bg: COLORS.dangerLight, text: COLORS.danger, icon: 'alert-circle-outline', border: COLORS.danger },
};

const formatTime = (time) => {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
};

// Customers may cancel only this many hours before the slot (matches backend rule).
const MIN_CANCEL_HOURS = 2;

export const canCustomerCancel = (item) => {
  if (!['CONFIRMED', 'VEHICLE_RECEIVED', 'WASHING', 'CLEANING', 'READY'].includes(item.status)) return false;
  let start = item.slotStartAt ? new Date(item.slotStartAt) : null;
  if (!start && item.bookingDate && /^\d{2}:\d{2}$/.test(item.timeSlot || '')) {
    const d = new Date(item.bookingDate);
    const [h, m] = item.timeSlot.split(':').map(Number);
    d.setHours(h, m, 0, 0);
    start = d;
  }
  if (!start) return false;
  return start.getTime() - Date.now() > MIN_CANCEL_HOURS * 60 * 60 * 1000;
};

const AnimatedCard = ({ item, index, onPress, onCancel }) => {
  const animatedValue = new Animated.Value(0);
  useEffect(() => { Animated.timing(animatedValue, { toValue: 1, duration: 400, delay: index * 80, useNativeDriver: true }).start(); }, []);
  const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.CONFIRMED;
  return (
    <Animated.View style={{ opacity: animatedValue, transform: [{ translateY: animatedValue.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }] }}>
      <TouchableOpacity style={[styles.card, { borderLeftColor: cfg.border, borderLeftWidth: 3 }]} activeOpacity={0.7} onPress={onPress}>
        <View style={styles.cardTop}>
          <View style={styles.cardIconWrap}>
            <Ionicons name={cfg.icon} size={20} color={cfg.border} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.cardService}>{item.service?.name || 'Service'}</Text>
            <Text style={styles.cardVehicle}>{item.vehicle?.make} {item.vehicle?.model}</Text>
            <View style={styles.cardRegRow}>
              <Ionicons name="car" size={12} color={COLORS.textLight} />
              <Text style={styles.cardReg}>{item.vehicle?.registrationNumber}</Text>
            </View>
            {item.bookingCode && (
              <View style={styles.cardCodeRow}>
                <Ionicons name="qr-code-outline" size={12} color={COLORS.primary} />
                <Text style={styles.cardCode}>{item.bookingCode}</Text>
              </View>
            )}
          </View>
          <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
            <Ionicons name={cfg.icon} size={12} color={cfg.text} />
            <Text style={[styles.statusText, { color: cfg.text }]}>{(item.status || '').replace(/_/g, ' ')}</Text>
          </View>
        </View>
        <View style={styles.cardDivider} />
        <View style={styles.cardBottom}>
          <View style={styles.cardInfo}>
            <Ionicons name="calendar-outline" size={14} color={COLORS.textLight} />
            <Text style={styles.cardInfoText}>{new Date(item.bookingDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</Text>
          </View>
          <View style={styles.cardInfo}>
            <Ionicons name="time-outline" size={14} color={COLORS.textLight} />
            <Text style={styles.cardInfoText}>{formatTime(item.timeSlot)}</Text>
          </View>
          <View style={styles.cardPriceWrap}>
            <Text style={styles.cardPrice}>₹{item.finalPrice || item.price}</Text>
          </View>
        </View>
        {canCustomerCancel(item) && (
          <View style={styles.cancelStrip} onStartShouldSetResponder={() => true} onResponderRelease={() => onCancel(item)}>
            <Ionicons name="close-circle-outline" size={15} color={COLORS.danger} />
            <Text style={styles.cancelText}>Cancel booking</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const MyBookingsScreen = ({ navigation }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('ALL');

  const fetchBookings = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await bookingAPI.getAll();
      const data = res.data.data.bookings || [];
      data.sort((a, b) => {
        const activeStatuses = ['CONFIRMED', 'IN_PROGRESS', 'VEHICLE_RECEIVED', 'WASHING', 'CLEANING', 'READY'];
        const aActive = activeStatuses.includes(a.status);
        const bActive = activeStatuses.includes(b.status);
        if (aActive && !bActive) return -1;
        if (!aActive && bActive) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      setBookings(data);
    } catch (err) { console.error(err); } finally { if (!silent) setLoading(false); setRefreshing(false); }
  };

  useFocusEffect(useCallback(() => { fetchBookings(); }, []));
  useEffect(() => { const interval = setInterval(() => { fetchBookings(true); }, 10000); return () => clearInterval(interval); }, []);
  const onRefresh = () => { setRefreshing(true); fetchBookings(); };

  const filtered = filter === 'ALL' ? bookings
    : filter === 'ACTIVE' ? bookings.filter(b => ['CONFIRMED', 'IN_PROGRESS', 'VEHICLE_RECEIVED', 'WASHING', 'CLEANING', 'READY'].includes(b.status))
    : bookings.filter(b => b.status === filter);

  const activeCount = bookings.filter(b => ['CONFIRMED', 'IN_PROGRESS', 'VEHICLE_RECEIVED', 'WASHING', 'CLEANING', 'READY'].includes(b.status)).length;

  const handleCancel = (item) => {
    Alert.alert(
      'Cancel Booking',
      `Cancel ${item.service?.name || 'this booking'} on ${new Date(item.bookingDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} at ${formatTime(item.timeSlot)}? The slot will be released for other customers.`,
      [
        { text: 'Keep it', style: 'cancel' },
        {
          text: 'Cancel Booking',
          style: 'destructive',
          onPress: async () => {
            try {
              await bookingAPI.cancel(item._id, 'Cancelled by customer');
              fetchBookings(true);
            } catch (err) {
              Alert.alert('Could not cancel', err.response?.data?.message || 'Please try again or call the shop.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Bookings</Text>
        {activeCount > 0 ? (
          <View style={styles.countBadge}><Text style={styles.countText}>{activeCount}</Text></View>
        ) : <View style={{ width: 40 }} />}
      </View>

      <View style={styles.filterRow}>
        {['ALL', 'ACTIVE', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map(f => {
          const count = f === 'ALL' ? bookings.length : f === 'ACTIVE' ? activeCount : bookings.filter(b => b.status === f).length;
          return (
            <TouchableOpacity key={f} style={[styles.filterBtn, filter === f && styles.filterActive]} onPress={() => setFilter(f)} activeOpacity={0.7}>
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f === 'ALL' ? 'All' : f === 'ACTIVE' ? 'Active' : f.charAt(0) + f.slice(1).toLowerCase()}</Text>
              <Text style={[styles.filterCount, filter === f && styles.filterCountActive]}>{count}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 60 }} />
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIconWrap}><Ionicons name="calendar-outline" size={40} color={COLORS.textLight} /></View>
          <Text style={styles.emptyTitle}>No Bookings Found</Text>
          <Text style={styles.emptySubtext}>Book a service to get started</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('Services')} activeOpacity={0.8}>
            <Ionicons name="add-circle" size={18} color="#fff" />
            <Text style={styles.emptyBtnText}>Book a Service</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          renderItem={({ item, index }) => (
            <AnimatedCard item={item} index={index} onCancel={handleCancel} onPress={() => navigation.navigate('BookingDetails', { bookingId: item._id })} />
          )}
          keyExtractor={i => i._id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 56, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, letterSpacing: -0.3 },
  countBadge: { backgroundColor: COLORS.primary, borderRadius: 12, minWidth: 24, height: 24, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 8 },
  countText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  filterRow: { flexDirection: 'row', padding: 12, gap: 8 },
  filterBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border },
  filterActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  filterTextActive: { color: '#fff' },
  filterCount: { fontSize: 10, fontWeight: '700', color: COLORS.textLight, backgroundColor: COLORS.bg, borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1 },
  filterCountActive: { color: '#fff', backgroundColor: 'rgba(255,255,255,0.3)' },
  list: { padding: 16 },
  card: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginBottom: 12, ...SHADOWS.small, borderWidth: 1, borderColor: COLORS.borderLight },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start' },
  cardIconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' },
  cardService: { fontSize: 15, fontWeight: '600', color: COLORS.text, marginBottom: 2 },
  cardVehicle: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 2 },
  cardRegRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardReg: { fontSize: 12, color: COLORS.textLight, fontFamily: 'monospace' },
  cardCodeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  cardCode: { fontSize: 12, color: COLORS.primary, fontFamily: 'monospace', fontWeight: '700', letterSpacing: 0.5 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  cardDivider: { height: 1, backgroundColor: COLORS.borderLight, marginVertical: 12 },
  cardBottom: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  cardInfo: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardInfoText: { fontSize: 12, color: COLORS.textLight },
  cardPriceWrap: { marginLeft: 'auto' },
  cardPrice: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  cancelStrip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12, paddingVertical: 10, borderRadius: 10, backgroundColor: COLORS.dangerLight },
  cancelText: { fontSize: 13, fontWeight: '700', color: COLORS.danger },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIconWrap: { width: 80, height: 80, borderRadius: 24, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: COLORS.borderLight },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: COLORS.text, marginBottom: 4 },
  emptySubtext: { fontSize: 13, color: COLORS.textLight, marginBottom: 24 },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14, ...SHADOWS.medium },
  emptyBtnText: { color: '#fff', fontWeight: '600' },
});

export default MyBookingsScreen;
