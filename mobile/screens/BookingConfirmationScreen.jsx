import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CommonActions } from '@react-navigation/native';
import { COLORS, SHADOWS } from '../utils/theme';

const BookingConfirmationScreen = ({ route, navigation }) => {
  const { booking } = route.params || {};
  const goToHome = () => { navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Home' }] })); };
  const goToBookings = () => { navigation.dispatch(CommonActions.reset({ index: 1, routes: [{ name: 'Home' }, { name: 'MyBookings' }] })); };

  const formatTime = (time) => {
    if (!time) return '';
    const [h, m] = time.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${period}`;
  };

  const bookingDate = booking?.bookingDate
    ? new Date(booking.bookingDate).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
    : '';

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="checkmark-circle" size={72} color={COLORS.success} />
        </View>
        <Text style={styles.title}>Slot Booked!</Text>
        <Text style={styles.subtitle}>No payment needed now. Show this code at the counter when you arrive.</Text>

        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>BOOKING CODE</Text>
          <Text style={styles.codeValue}>{booking?.bookingCode || '—'}</Text>
          <Text style={styles.codeHint}>Keep it handy — staff will verify this code</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardItem}>
            <View style={[styles.cardIcon, { backgroundColor: COLORS.successLight }]}><Ionicons name="calendar" size={16} color={COLORS.success} /></View>
            <Text style={styles.cardText}>{bookingDate} at {formatTime(booking?.timeSlot)}</Text>
          </View>
          <View style={styles.cardItem}>
            <View style={[styles.cardIcon, { backgroundColor: COLORS.primaryLight }]}><Ionicons name="car" size={16} color="#fff" /></View>
            <Text style={styles.cardText}>{booking?.vehicle?.registrationNumber || 'Your vehicle'} · {booking?.service?.name || 'Service'}</Text>
          </View>
          <View style={styles.cardItem}>
            <View style={[styles.cardIcon, { backgroundColor: '#fef9e7' }]}><Ionicons name="cash" size={16} color="#f39c12" /></View>
            <Text style={styles.cardText}>Pay ₹{booking?.finalPrice ?? booking?.price ?? 0} at the service center</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.primaryBtn} onPress={goToBookings} activeOpacity={0.8}>
            <Ionicons name="calendar-outline" size={18} color="#fff" />
            <Text style={styles.primaryBtnText}>View My Bookings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={goToHome} activeOpacity={0.8}>
            <Text style={styles.secondaryBtnText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center' },
  iconWrap: { marginBottom: 20 },
  title: { fontSize: 26, fontWeight: '700', color: COLORS.text, marginBottom: 8, textAlign: 'center', letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 24, lineHeight: 22, paddingHorizontal: 16 },
  codeCard: { backgroundColor: COLORS.primary, borderRadius: 20, paddingVertical: 20, paddingHorizontal: 32, width: '100%', alignItems: 'center', marginBottom: 16, ...SHADOWS.medium },
  codeLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.7)', letterSpacing: 1.5, marginBottom: 6 },
  codeValue: { fontSize: 36, fontWeight: '800', color: '#fff', letterSpacing: 4, fontFamily: 'monospace' },
  codeHint: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 8 },
  card: { backgroundColor: COLORS.white, borderRadius: 16, padding: 18, width: '100%', marginBottom: 28, ...SHADOWS.small, borderWidth: 1, borderColor: COLORS.borderLight },
  cardItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  cardIcon: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  cardText: { fontSize: 14, color: COLORS.textSecondary, flex: 1 },
  actions: { width: '100%', gap: 12 },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.primary, padding: 16, borderRadius: 14, ...SHADOWS.medium },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  secondaryBtn: { borderWidth: 1.5, borderColor: COLORS.border, padding: 16, borderRadius: 14, alignItems: 'center' },
  secondaryBtnText: { color: COLORS.textSecondary, fontWeight: '600', fontSize: 16 },
});

export default BookingConfirmationScreen;
