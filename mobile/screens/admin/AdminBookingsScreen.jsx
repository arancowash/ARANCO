import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert, Modal, Linking, TextInput } from 'react-native';
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

const nextStatusMap = {
  CONFIRMED: 'VEHICLE_RECEIVED', VEHICLE_RECEIVED: 'WASHING', WASHING: 'CLEANING', CLEANING: 'READY', READY: 'COMPLETED',
};

const AdminBookingsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const isStaff = user?.role === 'staff';
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selected, setSelected] = useState(null);
  const [codeInput, setCodeInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calMonth, setCalMonth] = useState(() => new Date());
  const [calCounts, setCalCounts] = useState({});
  const reqIdRef = useRef(0);

  const formatDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const fetchData = async (silent = false) => {
    const reqId = ++reqIdRef.current;
    try {
      const res = await adminAPI.getBookings({ date: formatDate(selectedDate), limit: 200 });
      if (reqId !== reqIdRef.current) return;
      setBookings(res.data.data.bookings || []);
    } catch (e) { console.log('Error:', e?.message); }
    if (!silent) setLoading(false);
  };

  const fetchMonthCounts = async (monthDate) => {
    try {
      const from = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}-01`;
      const lastDay = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
      const to = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      const res = await adminAPI.getBookingCounts(from, to);
      setCalCounts(res.data.data.counts || {});
    } catch (e) { console.log('Error:', e?.message); }
  };

  useEffect(() => { fetchData(); }, [selectedDate]);
  useEffect(() => { const i = setInterval(() => fetchData(true), 10000); return () => clearInterval(i); }, [selectedDate]);
  useEffect(() => { if (showCalendar) { setCalCounts({}); fetchMonthCounts(calMonth); } }, [showCalendar, calMonth]);
  const onRefresh = async () => { setRefreshing(true); await fetchData(); setRefreshing(false); };
  const changeDate = (days) => { const d = new Date(selectedDate); d.setDate(d.getDate() + days); setSelectedDate(d); };
  const handleStatus = async (id, status) => { try { await adminBookingAPI.updateStatus(id, status); fetchData(); } catch (e) { Alert.alert('Error', e.response?.data?.message || 'Failed'); } };
  const handleCancel = (id) => {
    Alert.alert('Cancel Booking', 'Are you sure you want to cancel this booking?', [
      { text: 'No', style: 'cancel' },
      { text: 'Yes, Cancel', style: 'destructive', onPress: async () => {
        try { await adminBookingAPI.cancel(id, 'Cancelled by admin'); fetchData(); } catch (e) { Alert.alert('Error', e.response?.data?.message || 'Failed to cancel'); }
      }},
    ]);
  };

  const handleCall = (mobile) => {
    if (!mobile) { Alert.alert('No Number', 'Customer has no phone number on file'); return; }
    Linking.openURL(`tel:${mobile}`).catch(() => Alert.alert('Error', 'Unable to open dialer'));
  };

  const handleNoShow = (id) => {
    Alert.alert('Mark No-Show', 'This releases the slot and adds a strike to the customer. Continue?', [
      { text: 'No', style: 'cancel' },
      { text: 'Mark No-Show', style: 'destructive', onPress: async () => {
        try {
          const res = await adminBookingAPI.markNoShow(id);
          const count = res.data?.data?.noShowCount;
          const blocked = res.data?.data?.blockedUntil;
          Alert.alert('Marked No-Show', blocked
            ? `Customer now has ${count} no-show(s) and is blocked until ${new Date(blocked).toLocaleDateString('en-IN')}.`
            : `Customer now has ${count} no-show(s).`);
          fetchData();
        } catch (e) { Alert.alert('Error', e.response?.data?.message || 'Failed to mark no-show'); }
      }},
    ]);
  };

  const handleVerifyCode = async () => {
    const code = codeInput.trim().toUpperCase();
    if (!code) return;
    setVerifying(true);
    try {
      const res = await adminBookingAPI.verifyCode(code);
      setSelected(res.data.data.booking);
      setCodeInput('');
    } catch (e) {
      Alert.alert('Not Found', e.response?.data?.message || 'No booking found for this code');
    } finally {
      setVerifying(false);
    }
  };

  const displayDate = (dateStr) => {
    const d = new Date(dateStr);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  const formatTime = (time) => {
    if (!time) return 'N/A';
    const [h, m] = time.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${period}`;
  };

  const dateLabel = selectedDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const isToday = formatDate(selectedDate) === formatDate(new Date());

  const changeMonth = (delta) => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() + delta, 1));
  const monthLabel = calMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const buildCalendarCells = () => {
    const firstDay = new Date(calMonth.getFullYear(), calMonth.getMonth(), 1).getDay();
    const daysInMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  };
  const calCells = buildCalendarCells();
  const weekdayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const selectedDateStr = formatDate(selectedDate);
  const todayDateStr = formatDate(new Date());

  const selectCalendarDay = (d) => {
    if (!d) return;
    setSelectedDate(new Date(calMonth.getFullYear(), calMonth.getMonth(), d));
    setShowCalendar(false);
  };

  const bookingPrice = (b) => b.finalPrice || b.price;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bookings</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}>
        <View style={styles.dateNav}>
          <TouchableOpacity onPress={() => changeDate(-1)} style={styles.dateBtn}><Ionicons name="chevron-back" size={20} color={COLORS.text} /></TouchableOpacity>
          <TouchableOpacity style={styles.dateCenter} onPress={() => { setCalMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)); setShowCalendar(true); }} activeOpacity={0.7}>
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.dateText}>{dateLabel}</Text>
              {isToday && <View style={styles.todayBadge}><Text style={styles.todayText}>Today</Text></View>}
            </View>
            <Ionicons name="calendar-outline" size={16} color={COLORS.primary} style={{ marginLeft: 6 }} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => changeDate(1)} style={styles.dateBtn}><Ionicons name="chevron-forward" size={20} color={COLORS.text} /></TouchableOpacity>
        </View>

        <View style={styles.verifyRow}>
          <Ionicons name="qr-code-outline" size={18} color={COLORS.primary} />
          <TextInput
            style={styles.verifyInput}
            placeholder="Verify booking code (CW-XXXX)"
            placeholderTextColor={COLORS.textLight}
            value={codeInput}
            onChangeText={(v) => setCodeInput(v.toUpperCase())}
            autoCapitalize="characters"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={handleVerifyCode}
          />
          <TouchableOpacity
            style={[styles.verifyBtn, (!codeInput.trim() || verifying) && { opacity: 0.5 }]}
            onPress={handleVerifyCode}
            disabled={!codeInput.trim() || verifying}
            activeOpacity={0.8}
          >
            <Text style={styles.verifyBtnText}>{verifying ? '...' : 'Verify'}</Text>
          </TouchableOpacity>
        </View>

        {loading ? <Text style={styles.empty}>Loading...</Text> : bookings.length === 0 ? (
          <View style={styles.emptyWrap}><Text style={styles.empty}>No bookings for this date</Text></View>
        ) : (
          bookings.map((b) => {
            const sc = statusColors[b.status] || statusColors.CONFIRMED;
            let next = nextStatusMap[b.status];
            if (isStaff && !['VEHICLE_RECEIVED', 'WASHING', 'CLEANING', 'READY'].includes(next)) next = null;
            const canCancel = !['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(b.status);
            const canNoShow = b.status === 'CONFIRMED';
            return (
              <TouchableOpacity key={b._id} style={styles.card} onPress={() => setSelected(b)} activeOpacity={0.75}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{b.user?.fullName}</Text>
                  <View style={[styles.badge, { backgroundColor: sc.bg }]}>
                    <Text style={[styles.badgeText, { color: sc.color }]}>{b.status.replace(/_/g, ' ')}</Text>
                  </View>
                </View>
                {(next || canCancel || canNoShow) && (
                  <View style={styles.inlineActions}>
                    {next && (
                      <TouchableOpacity style={styles.actionBtn} onPress={() => handleStatus(b._id, next)} activeOpacity={0.7}>
                        <Text style={styles.actionText}>→ {next.replace(/_/g, ' ')}</Text>
                      </TouchableOpacity>
                    )}
                    {canNoShow && (
                      <TouchableOpacity style={styles.cancelBtn} onPress={() => handleNoShow(b._id)} activeOpacity={0.7}>
                        <Text style={styles.cancelText}>No-show</Text>
                      </TouchableOpacity>
                    )}
                    {canCancel && (
                      <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancel(b._id)} activeOpacity={0.7}>
                        <Text style={styles.cancelText}>Cancel</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
                <Text style={styles.cardSub}>{b.user?.mobile || 'No mobile'}</Text>
                {b.bookingCode ? <Text style={styles.cardCode}>{b.bookingCode}</Text> : null}
                <Text style={styles.cardSub}>{b.vehicle?.registrationNumber} · {b.vehicle?.make} {b.vehicle?.model} ({b.vehicle?.vehicleType || 'N/A'})</Text>
                <Text style={styles.cardSub}>Service: {b.service?.name} · {b.timeSlot} · {b.duration} min</Text>
                <Text style={styles.cardPrice}>₹{bookingPrice(b)} <Text style={styles.cardPriceNote}>· pay at counter</Text></Text>
                <View style={styles.detailHint}>
                  <Ionicons name="information-circle-outline" size={14} color={COLORS.textLight} />
                  <Text style={styles.detailHintText}>Tap for customer details</Text>
                  <Ionicons name="chevron-forward" size={14} color={COLORS.textLight} />
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <Modal visible={!!selected} transparent animationType="fade" onRequestClose={() => setSelected(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalDialog}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Booking Details</Text>
              <TouchableOpacity onPress={() => setSelected(null)} style={styles.modalClose}><Ionicons name="close" size={22} color={COLORS.text} /></TouchableOpacity>
            </View>
            {selected && (
              <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
              <View style={styles.modalStatusRow}>
                <View style={[styles.badge, { backgroundColor: (statusColors[selected.status] || statusColors.CONFIRMED).bg }]}>
                  <Text style={[styles.badgeText, { color: (statusColors[selected.status] || statusColors.CONFIRMED).color }]}>{selected.status.replace(/_/g, ' ')}</Text>
                </View>
              </View>

              {selected.bookingCode && (
                <View style={styles.modalCodeCard}>
                  <Text style={styles.modalCodeLabel}>BOOKING CODE</Text>
                  <Text style={styles.modalCodeValue}>{selected.bookingCode}</Text>
                  <Text style={styles.modalCodeHint}>Verify this code before receiving the vehicle</Text>
                </View>
              )}

              <Text style={styles.modalSection}>Customer</Text>
              <View style={styles.modalCard}>
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Name</Text><Text style={styles.detailValue}>{selected.user?.fullName || 'N/A'}</Text></View>
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Phone</Text><Text style={styles.detailValue}>{selected.user?.mobile || 'Not provided'}</Text></View>
                <View style={[styles.detailRow, { borderBottomWidth: 0 }]}><Text style={styles.detailLabel}>Email</Text><Text style={styles.detailValue}>{selected.user?.email || 'N/A'}</Text></View>
              </View>
              <TouchableOpacity style={styles.callBtn} onPress={() => handleCall(selected.user?.mobile)} activeOpacity={0.8}>
                <Ionicons name="call" size={18} color="#fff" />
                <Text style={styles.callBtnText}>Call Customer</Text>
              </TouchableOpacity>

              <Text style={styles.modalSection}>Wash Booking</Text>
              <View style={styles.modalCard}>
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Booked For Date</Text><Text style={styles.detailValue}>{displayDate(selected.bookingDate)}</Text></View>
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Time Slot</Text><Text style={styles.detailValue}>{formatTime(selected.timeSlot)}</Text></View>
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Service</Text><Text style={styles.detailValue}>{selected.service?.name || 'N/A'}</Text></View>
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Duration</Text><Text style={styles.detailValue}>{selected.duration} min</Text></View>
                <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                  <Text style={styles.detailLabel}>Price (pay at counter)</Text>
                  <Text style={[styles.detailValue, { fontWeight: '700', color: COLORS.primary }]}>₹{bookingPrice(selected)}</Text>
                </View>
              </View>

              <Text style={styles.modalSection}>Vehicle</Text>
              <View style={styles.modalCard}>
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Registration</Text><Text style={[styles.detailValue, { fontFamily: 'monospace', color: COLORS.primary }]}>{selected.vehicle?.registrationNumber || 'N/A'}</Text></View>
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Make & Model</Text><Text style={styles.detailValue}>{selected.vehicle?.make} {selected.vehicle?.model}</Text></View>
                <View style={[styles.detailRow, { borderBottomWidth: 0 }]}><Text style={styles.detailLabel}>Type</Text><Text style={styles.detailValue}>{selected.vehicle?.vehicleType || 'N/A'}</Text></View>
              </View>

              {selected.assignedStaff?.employeeId && (
                <>
                  <Text style={styles.modalSection}>Assigned Staff</Text>
                  <View style={styles.modalCard}>
                    <View style={[styles.detailRow, { borderBottomWidth: 0 }]}><Text style={styles.detailLabel}>Employee ID</Text><Text style={styles.detailValue}>{selected.assignedStaff.employeeId}</Text></View>
                  </View>
                </>
              )}

              {selected.notes ? (
                <>
                  <Text style={styles.modalSection}>Notes</Text>
                  <View style={styles.modalCard}>
                    <Text style={styles.notesText}>{selected.notes}</Text>
                  </View>
                </>
              ) : null}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <Modal visible={showCalendar} animationType="fade" transparent onRequestClose={() => setShowCalendar(false)}>
        <View style={styles.calOverlay}>
          <View style={styles.calCard}>
            <View style={styles.calHeader}>
              <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.calNavBtn}><Ionicons name="chevron-back" size={20} color={COLORS.text} /></TouchableOpacity>
              <Text style={styles.calMonthLabel}>{monthLabel}</Text>
              <TouchableOpacity onPress={() => changeMonth(1)} style={styles.calNavBtn}><Ionicons name="chevron-forward" size={20} color={COLORS.text} /></TouchableOpacity>
            </View>
            <View style={styles.calWeekRow}>
              {weekdayLabels.map((w, i) => <Text key={i} style={styles.calWeekLabel}>{w}</Text>)}
            </View>
            <View style={styles.calGrid}>
              {calCells.map((d, i) => {
                if (d === null) return <View key={`e${i}`} style={styles.calCell} />;
                const dateStr = `${calMonth.getFullYear()}-${String(calMonth.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                const count = calCounts[dateStr] || 0;
                const isSelected = dateStr === selectedDateStr;
                const isTodayCell = dateStr === todayDateStr;
                return (
                  <TouchableOpacity key={dateStr} style={[styles.calCell, isSelected && styles.calCellSelected, isTodayCell && !isSelected && styles.calCellToday]} onPress={() => selectCalendarDay(d)} activeOpacity={0.7}>
                    <Text style={[styles.calDayNum, isSelected && styles.calDayNumSelected, isTodayCell && !isSelected && { color: COLORS.primary }]}>{d}</Text>
                    <View style={styles.calCountWrap}>
                      {count > 0 ? (
                        <View style={[styles.calCountBadge, isSelected && styles.calCountBadgeSelected]}>
                          <Text style={[styles.calCountText, isSelected && { color: COLORS.primary }]}>{count}</Text>
                        </View>
                      ) : (
                        <View style={styles.calCountPlaceholder} />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={styles.calLegend}>
              <View style={styles.calLegendItem}>
                <View style={[styles.calCountBadge, { backgroundColor: COLORS.primaryLight }]}><Text style={styles.calCountText}>3</Text></View>
                <Text style={styles.calLegendText}>bookings on date</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.calCloseBtn} onPress={() => setShowCalendar(false)} activeOpacity={0.8}>
              <Text style={styles.calCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 56, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, letterSpacing: -0.3 },
  container: { flex: 1, backgroundColor: COLORS.bg, padding: 12 },
  dateNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.white, borderRadius: 14, padding: 12, marginBottom: 12, ...SHADOWS.small, borderWidth: 1, borderColor: COLORS.borderLight },
  verifyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.white, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6, marginBottom: 12, borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOWS.small },
  verifyInput: { flex: 1, fontSize: 14, color: COLORS.text, paddingVertical: 8, fontFamily: 'monospace', letterSpacing: 1 },
  verifyBtn: { backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  verifyBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  dateBtn: { padding: 8, width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' },
  dateCenter: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4 },
  dateText: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  todayBadge: { backgroundColor: COLORS.primaryLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginTop: 4 },
  todayText: { fontSize: 10, color: '#fff', fontWeight: '700' },
  card: { backgroundColor: COLORS.white, borderRadius: 14, padding: 14, marginBottom: 8, ...SHADOWS.small, borderWidth: 1, borderColor: COLORS.borderLight },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  cardSub: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 2 },
  cardPrice: { fontSize: 15, fontWeight: '700', color: COLORS.primary, marginTop: 4 },
  cardPriceNote: { fontSize: 11, fontWeight: '500', color: COLORS.textLight },
  cardCode: { fontSize: 13, fontWeight: '800', color: COLORS.primary, fontFamily: 'monospace', letterSpacing: 1, marginTop: 2, marginBottom: 2 },
  inlineActions: { flexDirection: 'row', gap: 8, marginBottom: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.success, padding: 10, borderRadius: 10 },
  actionText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  cancelBtn: { paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.dangerLight, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(231,76,60,0.2)' },
  cancelText: { color: COLORS.danger, fontSize: 12, fontWeight: '700' },
  detailHint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: COLORS.borderLight },
  detailHintText: { fontSize: 11, color: COLORS.textLight, fontWeight: '500' },
  emptyWrap: { padding: 40 },
  empty: { textAlign: 'center', color: COLORS.textLight, fontSize: 14 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,43,70,0.45)', justifyContent: 'center', paddingHorizontal: 20 },
  modalDialog: { backgroundColor: COLORS.bg, borderRadius: 20, maxHeight: '85%', borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOWS.medium, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight, backgroundColor: COLORS.white },
  modalTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  modalClose: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' },
  modalStatusRow: { alignItems: 'center', marginBottom: 8 },
  modalCodeCard: { backgroundColor: COLORS.primary, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 10 },
  modalCodeLabel: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.7)', letterSpacing: 1.5, marginBottom: 4 },
  modalCodeValue: { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: 3, fontFamily: 'monospace' },
  modalCodeHint: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 6 },
  modalSection: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 18, marginBottom: 8 },
  modalCard: { backgroundColor: COLORS.white, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 4, borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOWS.small },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight, gap: 12 },
  detailLabel: { fontSize: 13, color: COLORS.textLight },
  detailValue: { fontSize: 14, fontWeight: '500', color: COLORS.text, flexShrink: 1, textAlign: 'right' },
  notesText: { fontSize: 14, color: COLORS.text, paddingVertical: 12, lineHeight: 20 },
  callBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.success, borderRadius: 14, padding: 14, marginTop: 10, ...SHADOWS.small },
  callBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  calOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 20 },
  calCard: { backgroundColor: COLORS.white, borderRadius: 20, padding: 16, ...SHADOWS.medium },
  calHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  calNavBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' },
  calMonthLabel: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  calWeekRow: { flexDirection: 'row', marginBottom: 6 },
  calWeekLabel: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '700', color: COLORS.textLight },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 10, paddingVertical: 2 },
  calCellToday: { borderWidth: 1.5, borderColor: COLORS.primary },
  calCellSelected: { backgroundColor: COLORS.primary },
  calDayNum: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  calDayNumSelected: { color: '#fff' },
  calCountWrap: { height: 16, justifyContent: 'center', marginTop: 1 },
  calCountBadge: { backgroundColor: COLORS.primaryLight, borderRadius: 6, paddingHorizontal: 5, paddingVertical: 1, minWidth: 18, alignItems: 'center' },
  calCountBadgeSelected: { backgroundColor: '#fff' },
  calCountText: { fontSize: 9, fontWeight: '700', color: '#fff' },
  calCountPlaceholder: { width: 18, height: 12 },
  calLegend: { alignItems: 'center', marginTop: 10 },
  calLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  calLegendText: { fontSize: 11, color: COLORS.textLight },
  calCloseBtn: { marginTop: 14, backgroundColor: COLORS.bg, borderRadius: 12, padding: 12, alignItems: 'center' },
  calCloseText: { fontSize: 14, fontWeight: '600', color: COLORS.text },
});

export default AdminBookingsScreen;
