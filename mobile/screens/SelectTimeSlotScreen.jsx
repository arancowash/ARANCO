import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { availabilityAPI } from '../services/api';
import { COLORS, SHADOWS } from '../utils/theme';

const SelectTimeSlotScreen = ({ route, navigation }) => {
  const { service, vehicle, date } = route.params;
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSlots = async () => {
      try {
        const res = await availabilityAPI.getSlots(date);
        setSlots(res.data.data.slots || []);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchSlots();
  }, [date]);

  const formatSlot = (time) => {
    const [h, m] = time.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
  };

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const isToday = date === todayStr;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const processedSlots = isToday
    ? slots.map((s) => {
        const [h, m] = s.time.split(':').map(Number);
        const past = h * 60 + m <= nowMinutes;
        return past ? { ...s, available: false, past: true } : s;
      })
    : slots;

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`;
  };

  const availableCount = processedSlots.filter(s => s.available).length;
  const morningSlots = processedSlots.filter(s => { const h = parseInt(s.time.split(':')[0]); return h < 12; });
  const afternoonSlots = processedSlots.filter(s => { const h = parseInt(s.time.split(':')[0]); return h >= 12 && h < 17; });
  const eveningSlots = processedSlots.filter(s => { const h = parseInt(s.time.split(':')[0]); return h >= 17; });

  const handleContinue = () => {
    if (!selectedSlot) return;
    navigation.navigate('BookingSummary', { service, vehicle, date, timeSlot: selectedSlot });
  };

  const renderSlotGroup = (title, icon, groupSlots) => {
    if (groupSlots.length === 0) return null;
    const groupAvailable = groupSlots.filter(s => s.available).length;
    return (
      <View style={styles.timeGroup}>
        <View style={styles.timeGroupHeader}>
          <Ionicons name={icon} size={14} color={COLORS.primaryAccent} />
          <Text style={styles.timeGroupTitle}>{title}</Text>
          <Text style={styles.timeGroupCount}>{groupAvailable} available</Text>
        </View>
        <View style={styles.slotsGrid}>
          {groupSlots.map(slot => {
            const isSelected = selectedSlot === slot.time;
            return (
              <TouchableOpacity
                key={slot.time}
                style={[styles.slotCard, !slot.available && styles.slotUnavailable, isSelected && styles.slotActive]}
                onPress={() => slot.available && setSelectedSlot(slot.time)}
                disabled={!slot.available}
                activeOpacity={0.7}
              >
                <Text style={[styles.slotTime, !slot.available && styles.slotTimeUnavailable, isSelected && styles.slotTimeActive]}>
                  {formatSlot(slot.time)}
                </Text>
                {slot.available ? (
                  <Text style={[styles.slotAvail, isSelected && styles.slotAvailActive]}>{slot.remaining} left</Text>
                ) : (
                  <Text style={styles.slotFull}>{slot.past ? 'Passed' : 'Full'}</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pick a Time</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressRow}>
          <View style={styles.progressStep}>
            <View style={[styles.progressDot, styles.progressDotDone]}>
              <Ionicons name="checkmark" size={10} color="#fff" />
            </View>
            <Text style={[styles.progressLabel, styles.progressLabelDone]}>Vehicle</Text>
          </View>
          <View style={[styles.progressLine, styles.progressLineDone]} />
          <View style={styles.progressStep}>
            <View style={[styles.progressDot, styles.progressDotDone]}>
              <Ionicons name="checkmark" size={10} color="#fff" />
            </View>
            <Text style={[styles.progressLabel, styles.progressLabelDone]}>Date</Text>
          </View>
          <View style={[styles.progressLine, styles.progressLineDone]} />
          <View style={styles.progressStep}>
            <View style={[styles.progressDot, styles.progressDotActive]}>
              <Text style={styles.progressDotText}>3</Text>
            </View>
            <Text style={[styles.progressLabel, styles.progressLabelActive]}>Time</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryIconWrap}>
              <Ionicons name="calendar" size={16} color={COLORS.primary} />
            </View>
            <View>
              <Text style={styles.summaryLabel}>Date</Text>
              <Text style={styles.summaryValue}>{formatDate(date)}</Text>
            </View>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <View style={styles.summaryIconWrap}>
              <Ionicons name="car-sport" size={16} color={COLORS.primary} />
            </View>
            <View>
              <Text style={styles.summaryLabel}>Vehicle</Text>
              <Text style={styles.summaryValue}>{vehicle.make} {vehicle.model}</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Available Time Slots</Text>
          {!loading && <Text style={styles.slotCount}>{availableCount} slots available</Text>}
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading available slots...</Text>
          </View>
        ) : slots.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="time-outline" size={36} color={COLORS.textLight} />
            </View>
            <Text style={styles.emptyTitle}>No Slots Available</Text>
            <Text style={styles.emptyText}>Try selecting a different date</Text>
          </View>
        ) : (
          <>
            {renderSlotGroup('Morning', 'sunny', morningSlots)}
            {renderSlotGroup('Afternoon', 'partly-sunny', afternoonSlots)}
            {renderSlotGroup('Evening', 'moon', eveningSlots)}
          </>
        )}

        {selectedSlot && (
          <View style={styles.selectedCard}>
            <View style={styles.selectedIconWrap}>
              <Ionicons name="checkmark-circle" size={22} color={COLORS.success} />
            </View>
            <View style={styles.selectedInfo}>
              <Text style={styles.selectedTime}>{formatSlot(selectedSlot)}</Text>
              <Text style={styles.selectedNote}>on {formatDate(date)}</Text>
            </View>
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.continueBtn, !selectedSlot && styles.continueBtnDisabled]}
          onPress={handleContinue}
          disabled={!selectedSlot}
          activeOpacity={0.8}
        >
          <Text style={styles.continueBtnText}>Continue</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
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

  progressSection: { backgroundColor: COLORS.primary, paddingBottom: 20, paddingHorizontal: 24 },
  progressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  progressStep: { alignItems: 'center', gap: 6 },
  progressDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  progressDotActive: { backgroundColor: COLORS.primaryAccent },
  progressDotDone: { backgroundColor: COLORS.success },
  progressDotText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  progressLabel: { fontSize: 11, fontWeight: '500', color: 'rgba(255,255,255,0.4)' },
  progressLabelActive: { color: '#fff', fontWeight: '600' },
  progressLabelDone: { color: 'rgba(255,255,255,0.7)' },
  progressLine: { flex: 1, height: 2, backgroundColor: 'rgba(255,255,255,0.12)', marginHorizontal: 8, marginBottom: 18, borderRadius: 1 },
  progressLineDone: { backgroundColor: COLORS.success },

  scroll: { padding: 16, paddingBottom: 100 },

  summaryCard: { flexDirection: 'row', backgroundColor: COLORS.white, padding: 16, borderRadius: 14, marginBottom: 20, borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOWS.small },
  summaryRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  summaryIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' },
  summaryLabel: { fontSize: 11, color: COLORS.textLight, marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  summaryValue: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  summaryDivider: { width: 1, backgroundColor: COLORS.borderLight, marginHorizontal: 12 },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text, letterSpacing: -0.3 },
  slotCount: { fontSize: 13, fontWeight: '600', color: COLORS.success },

  loadingWrap: { alignItems: 'center', paddingTop: 60 },
  loadingText: { fontSize: 13, color: COLORS.textLight, marginTop: 12 },

  emptyCard: { alignItems: 'center', paddingTop: 48, paddingBottom: 32, backgroundColor: COLORS.white, borderRadius: 16, borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOWS.small },
  emptyIconWrap: { width: 72, height: 72, borderRadius: 20, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  emptyText: { fontSize: 13, color: COLORS.textLight },

  timeGroup: { marginBottom: 20 },
  timeGroupHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  timeGroupTitle: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  timeGroupCount: { fontSize: 11, color: COLORS.textLight, fontWeight: '500', marginLeft: 'auto' },
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },

  slotCard: { width: '47%', backgroundColor: COLORS.white, borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1.5, borderColor: COLORS.border, ...SHADOWS.small },
  slotUnavailable: { opacity: 0.35 },
  slotActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight, ...SHADOWS.medium },
  slotTime: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 4, letterSpacing: -0.2 },
  slotTimeUnavailable: { color: COLORS.textLight },
  slotTimeActive: { color: '#fff' },
  slotAvail: { fontSize: 11, color: COLORS.success, fontWeight: '600' },
  slotAvailActive: { color: 'rgba(255,255,255,0.8)' },
  slotFull: { fontSize: 11, color: COLORS.danger, fontWeight: '600' },

  selectedCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.white, padding: 16, borderRadius: 14, marginTop: 8, borderWidth: 1, borderColor: COLORS.success, ...SHADOWS.small },
  selectedIconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.successLight, justifyContent: 'center', alignItems: 'center' },
  selectedInfo: { flex: 1 },
  selectedTime: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 2 },
  selectedNote: { fontSize: 12, color: COLORS.textLight },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.white, padding: 16, paddingBottom: 28, borderTopWidth: 1, borderTopColor: COLORS.borderLight, ...SHADOWS.medium },
  continueBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.primary, padding: 16, borderRadius: 14 },
  continueBtnDisabled: { opacity: 0.45 },
  continueBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});

export default SelectTimeSlotScreen;
