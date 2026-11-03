import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { bookingAPI, adminBookingAPI } from '../services/api';
import { formatDate } from '../utils/theme';
import { COLORS, SHADOWS } from '../utils/theme';
import { useAuth } from '../context/AuthContext';
import { canCustomerCancel } from './MyBookingsScreen';

const STATUS_FLOW = [
  { key: 'CONFIRMED', label: 'Confirmed', icon: 'checkmark-circle' },
  { key: 'VEHICLE_RECEIVED', label: 'Vehicle Received', icon: 'car' },
  { key: 'WASHING', label: 'Washing', icon: 'water' },
  { key: 'CLEANING', label: 'Cleaning', icon: 'sparkles' },
  { key: 'READY', label: 'Ready', icon: 'checkmark-done-circle' },
  { key: 'COMPLETED', label: 'Completed', icon: 'trophy' },
];

const STATUS_COLORS = {
  CONFIRMED: { bg: COLORS.primaryLight, text: '#fff', icon: 'checkmark-circle' },
  IN_PROGRESS: { bg: COLORS.successLight, text: COLORS.success, icon: 'time' },
  VEHICLE_RECEIVED: { bg: '#fef9e7', text: '#f39c12', icon: 'car' },
  WASHING: { bg: '#ebf5fb', text: '#2196f3', icon: 'water' },
  CLEANING: { bg: '#f5eef8', text: '#9c27b0', icon: 'sparkles' },
  READY: { bg: '#eafaf1', text: '#2e7d32', icon: 'checkmark-done-circle' },
  COMPLETED: { bg: COLORS.successLight, text: COLORS.success, icon: 'trophy' },
  CANCELLED: { bg: COLORS.dangerLight, text: COLORS.danger, icon: 'close-circle' },
  NO_SHOW: { bg: COLORS.dangerLight, text: COLORS.danger, icon: 'alert-circle' },
};

const TimelineStep = ({ step, status, isLast, index, isCancelled }) => {
  const animatedValue = new Animated.Value(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    Animated.timing(animatedValue, { toValue: 1, duration: 400, delay: index * 150, useNativeDriver: true }).start();
    const t = setTimeout(() => setDone(true), index * 150 + 200);
    return () => clearTimeout(t);
  }, []);

  const statusIndex = STATUS_FLOW.findIndex(s => s.key === status);
  const stepIndex = STATUS_FLOW.findIndex(s => s.key === step.key);
  const isCompleted = isCancelled ? false : stepIndex < statusIndex;
  const isCurrent = step.key === status;
  const isPending = isCancelled ? true : stepIndex > statusIndex;

  const dotColor = isCompleted ? COLORS.success : isCurrent ? COLORS.primary : isCancelled && stepIndex === STATUS_FLOW.length - 1 ? COLORS.danger : COLORS.border;
  const lineColor = isCompleted ? COLORS.success : COLORS.border;
  const textColor = isCompleted || isCurrent ? COLORS.text : COLORS.textLight;

  return (
    <Animated.View style={[styles.timelineStep, { opacity: animatedValue, transform: [{ translateY: animatedValue.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
      <View style={styles.timelineLeft}>
        <View style={[styles.timelineDot, { backgroundColor: dotColor, borderColor: dotColor, transform: [{ scale: isCurrent ? 1.2 : 1 }] }]}>
          {isCompleted && <Ionicons name="checkmark" size={12} color="#fff" />}
          {isCurrent && <View style={styles.pulseDot} />}
        </View>
        {!isLast && <View style={[styles.timelineLine, { backgroundColor: lineColor }]} />}
      </View>
      <View style={styles.timelineContent}>
        <Text style={[styles.timelineLabel, { color: textColor, fontWeight: isCurrent ? '700' : '500' }]}>{step.label}</Text>
        {isCurrent && (
          <View style={[styles.currentBadge, { backgroundColor: STATUS_COLORS[status]?.bg || COLORS.primaryLight }]}>
            <Text style={[styles.currentBadgeText, { color: STATUS_COLORS[status]?.text || '#fff' }]}>Current</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
};

const BookingDetailsScreen = ({ route, navigation }) => {
  const { bookingId } = route.params;
  const { user } = useAuth();
  const isStaff = user?.isStaff;
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    const fetchBooking = async (silent = false) => {
      if (!silent) setLoading(true);
      try { const res = await bookingAPI.getOne(bookingId); setBooking(res.data.data.booking); } catch (err) { console.error(err); } finally { if (!silent) setLoading(false); }
    };
    fetchBooking();
    const interval = setInterval(() => { fetchBooking(true); }, 10000);
    return () => clearInterval(interval);
  }, [bookingId]);

  useEffect(() => { if (booking) { Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start(); } }, [booking]);

  const handleAdvanceStatus = async () => {
    const idx = STATUS_FLOW.findIndex(s => s.key === booking.status);
    const next = STATUS_FLOW[idx + 1];
    if (!next) return;
    setUpdating(true);
    try {
      const res = await adminBookingAPI.updateStatus(bookingId, next.key);
      setBooking(res.data.data.booking);
    } catch (err) {
      const { Alert } = require('react-native');
      Alert.alert('Error', err.response?.data?.message || 'Failed to update status');
    } finally { setUpdating(false); }
  };

  const handleCustomerCancel = () => {
    const { Alert } = require('react-native');
    Alert.alert(
      'Cancel Booking',
      'Cancel this booking? The slot will be released for other customers.',
      [
        { text: 'Keep it', style: 'cancel' },
        {
          text: 'Cancel Booking',
          style: 'destructive',
          onPress: async () => {
            setUpdating(true);
            try {
              const res = await bookingAPI.cancel(bookingId, 'Cancelled by customer');
              setBooking(res.data.data?.booking || { ...booking, status: 'CANCELLED' });
            } catch (err) {
              Alert.alert('Could not cancel', err.response?.data?.message || 'Please try again or call the shop.');
            } finally { setUpdating(false); }
          },
        },
      ]
    );
  };

  if (loading) return <View style={styles.loading}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  if (!booking) return <View style={styles.loading}><Text style={{ color: COLORS.textLight }}>Booking not found</Text></View>;

  const statusCfg = STATUS_COLORS[booking.status] || STATUS_COLORS.CONFIRMED;
  const isCancelled = booking.status === 'CANCELLED';
  const flowIdx = STATUS_FLOW.findIndex(s => s.key === booking.status);
  const nextStatus = flowIdx >= 0 ? STATUS_FLOW[flowIdx + 1] : null;
  const staffAllowed = ['VEHICLE_RECEIVED', 'WASHING', 'CLEANING', 'READY'];
  const canAdvance = isStaff && nextStatus && staffAllowed.includes(nextStatus.key);
  const canCancel = !isStaff && canCustomerCancel(booking);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={[styles.statusBanner, { backgroundColor: statusCfg.bg }]}>
            <Ionicons name={statusCfg.icon} size={22} color={statusCfg.text} />
            <Text style={[styles.statusText, { color: statusCfg.text }]}>{(booking.status || '').replace(/_/g, ' ')}</Text>
          </View>

          {booking.bookingCode ? (
            <View style={styles.codeCard}>
              <Text style={styles.codeLabel}>BOOKING CODE</Text>
              <Text style={styles.codeValue}>{booking.bookingCode}</Text>
              <Text style={styles.codeHint}>Show this code at the counter to verify your booking</Text>
            </View>
          ) : null}

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="git-branch-outline" size={18} color={COLORS.primary} />
              <Text style={styles.cardTitle}>Progress</Text>
            </View>
            {STATUS_FLOW.map((step, i) => (
              <TimelineStep key={step.key} step={step} status={booking.status} isLast={i === STATUS_FLOW.length - 1} index={i} isCancelled={booking.status === 'CANCELLED'} />
            ))}
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="construct-outline" size={18} color="#9c27b0" />
              <Text style={styles.cardTitle}>Service</Text>
            </View>
            <View style={styles.row}><Text style={styles.label}>Service</Text><Text style={styles.value}>{booking.service?.name || 'N/A'}</Text></View>
            <View style={styles.row}><Text style={styles.label}>Date</Text><Text style={styles.value}>{formatDate(booking.bookingDate)}</Text></View>
            <View style={styles.row}><Text style={styles.label}>Time Slot</Text><Text style={styles.value}>{booking.timeSlot}</Text></View>
            <View style={styles.row}><Text style={styles.label}>Duration</Text><Text style={styles.value}>{booking.duration} min</Text></View>
            <View style={[styles.row, { borderBottomWidth: 0 }]}>
              <Text style={styles.label}>Price (pay at counter)</Text>
              <Text style={styles.priceText}>₹{booking.finalPrice || booking.price}</Text>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="car-outline" size={18} color="#f39c12" />
              <Text style={styles.cardTitle}>Vehicle</Text>
            </View>
            <View style={styles.row}><Text style={styles.label}>Vehicle</Text><Text style={styles.value}>{booking.vehicle?.make} {booking.vehicle?.model}</Text></View>
            <View style={styles.row}><Text style={styles.label}>Registration</Text><Text style={[styles.value, { fontFamily: 'monospace', fontWeight: '700', color: COLORS.primary }]}>{booking.vehicle?.registrationNumber || 'N/A'}</Text></View>
            <View style={[styles.row, { borderBottomWidth: 0 }]}><Text style={styles.label}>Type</Text><Text style={styles.value}>{booking.vehicle?.vehicleType || 'N/A'}</Text></View>
          </View>

          {booking.notes && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="document-text-outline" size={18} color={COLORS.textSecondary} />
                <Text style={styles.cardTitle}>Notes</Text>
              </View>
              <Text style={styles.notes}>{booking.notes}</Text>
            </View>
          )}

          {canAdvance && (
            <TouchableOpacity style={styles.updateBtn} onPress={handleAdvanceStatus} disabled={updating} activeOpacity={0.7}>
              {updating ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="arrow-forward-circle-outline" size={18} color="#fff" />}
              <Text style={styles.updateBtnText}>{updating ? 'Updating...' : `Mark as ${nextStatus.label}`}</Text>
            </TouchableOpacity>
          )}

          {canCancel && (
            <TouchableOpacity style={styles.cancelBtn} onPress={handleCustomerCancel} disabled={updating} activeOpacity={0.7}>
              <Ionicons name="close-circle-outline" size={18} color={COLORS.danger} />
              <Text style={styles.cancelBtnText}>Cancel booking</Text>
            </TouchableOpacity>
          )}
          {!isStaff && !isCancelled && booking.status !== 'NO_SHOW' && !canCancel && (
            <Text style={styles.cancelHint}>Bookings can be cancelled at least 2 hours before the slot. Call the shop for changes.</Text>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 56, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, letterSpacing: -0.3 },
  scroll: { padding: 16 },
  statusBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 14, marginBottom: 16 },
  statusText: { fontSize: 14, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  codeCard: { backgroundColor: COLORS.primary, borderRadius: 16, padding: 16, alignItems: 'center', marginBottom: 12, ...SHADOWS.medium },
  codeLabel: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.7)', letterSpacing: 1.5, marginBottom: 4 },
  codeValue: { fontSize: 30, fontWeight: '800', color: '#fff', letterSpacing: 3, fontFamily: 'monospace' },
  codeHint: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 6 },
  card: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginBottom: 12, ...SHADOWS.small, borderWidth: 1, borderColor: COLORS.borderLight },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  label: { fontSize: 14, color: COLORS.textLight },
  value: { fontSize: 14, fontWeight: '500', color: COLORS.text },
  priceText: { fontSize: 18, fontWeight: '700', color: COLORS.primary },
  payBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  payBadgeText: { fontSize: 12, fontWeight: '700' },
  notes: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 },
  updateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderRadius: 14, backgroundColor: COLORS.primary, marginTop: 4 },
  updateBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  cancelBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderRadius: 14, borderWidth: 1.5, borderColor: COLORS.danger, backgroundColor: COLORS.white, marginTop: 10 },
  cancelBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.danger },
  cancelHint: { fontSize: 12, color: COLORS.textLight, textAlign: 'center', marginTop: 12, lineHeight: 17 },
  timelineStep: { flexDirection: 'row', minHeight: 44 },
  timelineLeft: { width: 30, alignItems: 'center' },
  timelineDot: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  timelineLine: { width: 2, flex: 1, minHeight: 20 },
  timelineContent: { flex: 1, paddingLeft: 10, paddingBottom: 8 },
  timelineLabel: { fontSize: 14 },
  currentBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, alignSelf: 'flex-start', marginTop: 4 },
  currentBadgeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
});

export default BookingDetailsScreen;
