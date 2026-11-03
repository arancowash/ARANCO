import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../utils/theme';
import { availabilityAPI } from '../services/api';

const toLocalStr = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const SelectDateScreen = ({ route, navigation }) => {
  const { service, vehicle } = route.params;
  const [selectedDate, setSelectedDate] = useState(null);
  const [startOffset, setStartOffset] = useState(0);
  const [closedToday, setClosedToday] = useState(false);

  useEffect(() => {
    const checkShopHours = async () => {
      try {
        const res = await availabilityAPI.getSlots(toLocalStr(new Date()));
        const settings = res.data.data?.settings;
        if (!settings?.closingTime || !settings?.slotDuration) return;
        const [closeH, closeM] = settings.closingTime.split(':').map(Number);
        const now = new Date();
        const nowMinutes = now.getHours() * 60 + now.getMinutes();
        const lastSlotStart = closeH * 60 + closeM - Number(settings.slotDuration);
        if (nowMinutes >= lastSlotStart) {
          setClosedToday(true);
          setStartOffset(1);
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          setSelectedDate(tomorrow);
        }
      } catch (err) { /* keep today available on error */ }
    };
    checkShopHours();
  }, []);

  const generateDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = startOffset; i <= startOffset + 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const dates = generateDates();
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const handleContinue = () => {
    if (!selectedDate) return;
    navigation.navigate('SelectTimeSlot', { service, vehicle, date: toLocalStr(selectedDate) });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pick a Date</Text>
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
            <View style={[styles.progressDot, styles.progressDotActive]}>
              <Text style={styles.progressDotText}>2</Text>
            </View>
            <Text style={[styles.progressLabel, styles.progressLabelActive]}>Date</Text>
          </View>
          <View style={styles.progressLine} />
          <View style={styles.progressStep}>
            <View style={styles.progressDot}>
              <Text style={styles.progressDotText}>3</Text>
            </View>
            <Text style={styles.progressLabel}>Time</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.serviceInfo}>
          <View style={styles.serviceInfoLeft}>
            <View style={styles.serviceIconWrap}>
              <Ionicons name="water" size={18} color={COLORS.primaryAccent} />
            </View>
            <View>
              <Text style={styles.serviceInfoName}>{service.name}</Text>
              <Text style={styles.serviceInfoVehicle}>{vehicle.make} {vehicle.model} · {vehicle.registrationNumber}</Text>
            </View>
          </View>
        </View>

        <View style={styles.dateSection}>
          <Text style={styles.sectionTitle}>Choose a Date</Text>
          <Text style={styles.sectionSubtitle}>Select your preferred appointment date</Text>

          {closedToday && (
            <View style={styles.closedBanner}>
              <Ionicons name="moon" size={16} color="#f39c12" />
              <Text style={styles.closedBannerText}>Shop hours are over for today — showing dates from tomorrow onwards</Text>
            </View>
          )}

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll} contentContainerStyle={styles.dateScrollContent}>
            {dates.map((date, i) => {
              const isToday = toLocalStr(date) === toLocalStr(new Date());
              const isSelected = selectedDate?.toDateString() === date.toDateString();
              const isWeekend = date.getDay() === 0 || date.getDay() === 6;
              return (
                <TouchableOpacity
                  key={i}
                  style={[styles.dateCard, isSelected && styles.dateCardActive, isWeekend && !isSelected && styles.dateCardWeekend]}
                  onPress={() => setSelectedDate(date)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.dayName, isSelected && styles.textActive]}>{days[date.getDay()]}</Text>
                  <Text style={[styles.dateNum, isSelected && styles.textActiveLarge]}>{date.getDate()}</Text>
                  <Text style={[styles.monthName, isSelected && styles.textActive]}>{months[date.getMonth()]}</Text>
                  {isToday && <View style={[styles.todayDot, isSelected && { backgroundColor: '#fff' }]} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {selectedDate && (
          <View style={styles.selectedCard}>
            <View style={styles.selectedIconWrap}>
              <Ionicons name="checkmark-circle" size={22} color={COLORS.success} />
            </View>
            <View style={styles.selectedInfo}>
              <Text style={styles.selectedDay}>{days[selectedDate.getDay()]}, {selectedDate.getDate()} {months[selectedDate.getMonth()]} {selectedDate.getFullYear()}</Text>
              <Text style={styles.selectedNote}>You'll be redirected to pick a time slot</Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.continueBtn, !selectedDate && styles.continueBtnDisabled]}
          onPress={handleContinue}
          disabled={!selectedDate}
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

  serviceInfo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.white, padding: 14, borderRadius: 14, marginBottom: 20, borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOWS.small },
  serviceInfoLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  serviceIconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(201,169,110,0.08)', justifyContent: 'center', alignItems: 'center' },
  serviceInfoName: { fontSize: 15, fontWeight: '600', color: COLORS.text, marginBottom: 2 },
  serviceInfoVehicle: { fontSize: 12, color: COLORS.textLight, fontFamily: 'monospace' },

  dateSection: { marginBottom: 8 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text, letterSpacing: -0.3 },
  sectionSubtitle: { fontSize: 13, color: COLORS.textLight, marginTop: 4, marginBottom: 16 },
  closedBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fef9e7', borderWidth: 1, borderColor: 'rgba(243,156,18,0.25)', borderRadius: 12, padding: 12, marginBottom: 14 },
  closedBannerText: { flex: 1, fontSize: 12, color: '#b7791f', fontWeight: '600', lineHeight: 17 },

  dateScroll: { marginLeft: -16, marginRight: -16 },
  dateScrollContent: { paddingHorizontal: 16 },
  dateCard: { width: 72, height: 96, backgroundColor: COLORS.white, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 10, borderWidth: 1.5, borderColor: COLORS.border, ...SHADOWS.small },
  dateCardActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary, ...SHADOWS.medium },
  dateCardWeekend: { borderColor: 'rgba(201,169,110,0.3)' },
  dayName: { fontSize: 11, color: COLORS.textLight, marginBottom: 4, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  textActive: { color: 'rgba(255,255,255,0.75)' },
  dateNum: { fontSize: 24, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5 },
  textActiveLarge: { color: '#fff' },
  monthName: { fontSize: 11, color: COLORS.textLight, marginTop: 2, fontWeight: '500', textTransform: 'uppercase' },
  todayDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primaryAccent, marginTop: 6 },

  selectedCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.white, padding: 16, borderRadius: 14, marginTop: 8, borderWidth: 1, borderColor: COLORS.success, ...SHADOWS.small },
  selectedIconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.successLight, justifyContent: 'center', alignItems: 'center' },
  selectedInfo: { flex: 1 },
  selectedDay: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 2 },
  selectedNote: { fontSize: 12, color: COLORS.textLight },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.white, padding: 16, paddingBottom: 28, borderTopWidth: 1, borderTopColor: COLORS.borderLight, ...SHADOWS.medium },
  continueBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.primary, padding: 16, borderRadius: 14 },
  continueBtnDisabled: { opacity: 0.45 },
  continueBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});

export default SelectDateScreen;
