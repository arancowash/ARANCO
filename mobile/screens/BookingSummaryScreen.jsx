import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { bookingAPI } from '../services/api';
import { COLORS, SHADOWS } from '../utils/theme';

const BookingSummaryScreen = ({ route, navigation }) => {
  const { service, vehicle, date, timeSlot } = route.params;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const pricing = (service.vehicleCategoryPricing || []).find(p => p.vehicleType === vehicle.vehicleType);
  const originalPrice = pricing ? pricing.price : 0;
  const onOffer = pricing && pricing.offerPrice != null && pricing.offerPrice < pricing.price;
  const price = onOffer ? pricing.offerPrice : originalPrice;
  const pctOff = onOffer && originalPrice > 0 ? Math.round((1 - price / originalPrice) * 100) : 0;

  const formatTime = (time) => {
    const [h, m] = time.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
  };

  const formatDateDisplay = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`;
  };

  const handleConfirm = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await bookingAPI.create({
        vehicleId: vehicle._id,
        serviceId: service._id,
        bookingDate: date,
        timeSlot,
      });
      const booking = res.data.data.booking;
      navigation.replace('BookingConfirmation', { booking });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create booking');
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review Booking</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={18} color={COLORS.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.heroSection}>
          <View style={styles.heroIconWrap}>
            <Ionicons name="water" size={24} color="#fff" />
          </View>
          <View style={styles.heroInfo}>
            <Text style={styles.heroName}>{service.name}</Text>
            <Text style={styles.heroDuration}>{service.duration} minutes</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            {onOffer && <Text style={styles.heroOriginalPrice}>₹{originalPrice}</Text>}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              {pctOff > 0 && <View style={styles.heroPctBadge}><Text style={styles.heroPctText}>{pctOff}% OFF</Text></View>}
              <Text style={styles.heroPrice}>₹{price}</Text>
            </View>
          </View>
        </View>

        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <View style={styles.detailIconWrap}>
              <Ionicons name="car-sport" size={16} color={COLORS.primary} />
            </View>
            <View style={styles.detailInfo}>
              <Text style={styles.detailLabel}>Vehicle</Text>
              <Text style={styles.detailValue}>{vehicle.make} {vehicle.model}</Text>
            </View>
          </View>
          <View style={styles.detailDivider} />

          <View style={styles.detailRow}>
            <View style={styles.detailIconWrap}>
              <Ionicons name="key" size={16} color={COLORS.primary} />
            </View>
            <View style={styles.detailInfo}>
              <Text style={styles.detailLabel}>Registration</Text>
              <Text style={[styles.detailValue, { fontFamily: 'monospace' }]}>{vehicle.registrationNumber || vehicle.licensePlate}</Text>
            </View>
          </View>
          <View style={styles.detailDivider} />

          <View style={styles.detailRow}>
            <View style={styles.detailIconWrap}>
              <Ionicons name="calendar" size={16} color={COLORS.primary} />
            </View>
            <View style={styles.detailInfo}>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>{formatDateDisplay(date)}</Text>
            </View>
          </View>
          <View style={styles.detailDivider} />

          <View style={styles.detailRow}>
            <View style={styles.detailIconWrap}>
              <Ionicons name="time" size={16} color={COLORS.primary} />
            </View>
            <View style={styles.detailInfo}>
              <Text style={styles.detailLabel}>Time Slot</Text>
              <Text style={styles.detailValue}>{formatTime(timeSlot)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.totalCard}>
          <View style={styles.totalLeft}>
            <Text style={styles.totalLabel}>Service Price</Text>
            <Text style={styles.totalNote}>Pay at the counter after the wash</Text>
          </View>
          <View style={styles.totalRight}>
            <Text style={styles.totalCurrency}>₹</Text>
            <Text style={styles.totalValue}>{price}</Text>
          </View>
        </View>

        <View style={styles.noteCard}>
          <View style={styles.noteIconWrap}>
            <Ionicons name="information-circle" size={18} color={COLORS.primaryAccent} />
          </View>
          <Text style={styles.noteText}>
            No payment is needed to book. Your slot is reserved instantly — show your booking code at the counter and pay after the service.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.payBtn, loading && styles.payBtnDisabled]}
          onPress={handleConfirm}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <View style={styles.processingRow}>
              <ActivityIndicator color="#fff" />
              <Text style={styles.payBtnText}>Creating Booking...</Text>
            </View>
          ) : (
            <>
              <Ionicons name="calendar" size={18} color="#fff" />
              <Text style={styles.payBtnText}>Confirm Booking</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 56, paddingBottom: 14, backgroundColor: COLORS.primary },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#fff', letterSpacing: -0.2 },

  scroll: { padding: 16, paddingBottom: 140 },

  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.dangerLight, padding: 14, borderRadius: 14, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(231,76,60,0.15)' },
  errorText: { color: COLORS.danger, fontSize: 14, fontWeight: '500', flex: 1 },

  heroSection: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, padding: 18, borderRadius: 16, marginBottom: 16, ...SHADOWS.medium },
  heroIconWrap: { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  heroInfo: { flex: 1 },
  heroName: { fontSize: 17, fontWeight: '700', color: '#fff', marginBottom: 2 },
  heroDuration: { fontSize: 13, color: 'rgba(255,255,255,0.6)' },
  heroPrice: { fontSize: 24, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  heroOriginalPrice: { fontSize: 13, color: 'rgba(255,255,255,0.55)', textDecorationLine: 'line-through', marginBottom: 2 },
  heroPctBadge: { backgroundColor: '#f39c12', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  heroPctText: { fontSize: 10, fontWeight: '800', color: '#fff' },

  detailsCard: { backgroundColor: COLORS.white, borderRadius: 16, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOWS.small },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
  detailIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' },
  detailInfo: { flex: 1 },
  detailLabel: { fontSize: 12, color: COLORS.textLight, marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  detailValue: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  detailDivider: { height: 1, backgroundColor: COLORS.borderLight, marginVertical: 10 },

  totalCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 16, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOWS.small },
  totalLeft: { flex: 1 },
  totalLabel: { fontSize: 15, fontWeight: '600', color: COLORS.text, marginBottom: 2 },
  totalNote: { fontSize: 12, color: COLORS.textLight },
  totalRight: { flexDirection: 'row', alignItems: 'flex-start' },
  totalCurrency: { fontSize: 18, fontWeight: '600', color: COLORS.success, marginTop: 4, marginRight: 2 },
  totalValue: { fontSize: 32, fontWeight: '800', color: COLORS.success, letterSpacing: -1 },

  noteCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(201,169,110,0.06)', padding: 14, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(201,169,110,0.15)' },
  noteIconWrap: { width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(201,169,110,0.1)', justifyContent: 'center', alignItems: 'center' },
  noteText: { fontSize: 13, color: COLORS.textSecondary, flex: 1, lineHeight: 18 },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.white, padding: 16, paddingBottom: 28, borderTopWidth: 1, borderTopColor: COLORS.borderLight, ...SHADOWS.medium },
  payBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: COLORS.primary, padding: 18, borderRadius: 14 },
  payBtnDisabled: { opacity: 0.55 },
  payBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  processingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});

export default BookingSummaryScreen;
