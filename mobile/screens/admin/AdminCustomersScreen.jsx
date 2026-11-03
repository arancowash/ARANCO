import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TextInput, TouchableOpacity, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { adminAPI } from '../../services/api';
import { COLORS, SHADOWS } from '../../utils/theme';

const BLOCK_DAY_OPTIONS = [7, 30, 90];

const isBlocked = (c) => c.bookingBlockedUntil && new Date(c.bookingBlockedUntil) > new Date();

const AdminCustomersScreen = () => {
  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [blockDays, setBlockDays] = useState(30);
  const [blockReason, setBlockReason] = useState('');
  const [busy, setBusy] = useState(false);

  const fetchData = async (silent = false) => {
    try { const res = await adminAPI.getCustomers({ search, page, limit: 15 }); setCustomers(res.data.data.customers); setPagination(res.data.data.pagination); } catch (e) { console.log('Error:', e?.message); }
    if (!silent) setLoading(false);
  };

  useEffect(() => { fetchData(); }, [page]);
  const onRefresh = async () => { setRefreshing(true); await fetchData(); setRefreshing(false); };

  const openCustomer = (c) => {
    setSelected(c);
    setBlockDays(30);
    setBlockReason('');
  };

  const handleBlock = async () => {
    setBusy(true);
    try {
      await adminAPI.blockCustomer(selected._id, blockDays, blockReason.trim());
      await fetchData(true);
      Alert.alert('Customer blocked', `${selected.fullName} cannot book for ${blockDays} days. They have been notified.`);
      setSelected(null);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to block customer');
    } finally { setBusy(false); }
  };

  const handleUnblock = () => {
    Alert.alert(
      'Unblock Customer',
      `Clear all no-show strikes and let ${selected.fullName} book again?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unblock',
          onPress: async () => {
            setBusy(true);
            try {
              await adminAPI.unblockCustomer(selected._id);
              await fetchData(true);
              Alert.alert('Customer unblocked', `${selected.fullName} can book again and strikes were cleared.`);
              setSelected(null);
            } catch (e) {
              Alert.alert('Error', e.response?.data?.message || 'Failed to unblock customer');
            } finally { setBusy(false); }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={COLORS.textLight} />
        <TextInput style={styles.searchInput} placeholder="Search customers..." placeholderTextColor={COLORS.textLight} value={search} onChangeText={setSearch} onSubmitEditing={() => { setPage(1); fetchData(); }} />
      </View>

      {loading ? <Text style={styles.empty}>Loading...</Text> : customers.length === 0 ? (
        <View style={styles.emptyWrap}><Text style={styles.empty}>No customers found</Text></View>
      ) : (
        customers.map(c => (
          <TouchableOpacity key={c._id} style={styles.card} onPress={() => openCustomer(c)} activeOpacity={0.7}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{c.fullName}</Text>
              {isBlocked(c) ? (
                <View style={styles.blockedBadge}><Text style={styles.blockedBadgeText}>BLOCKED</Text></View>
              ) : (
                <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
              )}
            </View>
            <Text style={styles.cardSub}>{c.mobile} · {c.email}</Text>
            <Text style={styles.cardSub}>Vehicles: {c.vehicleCount} · Bookings: {c.bookingCount} · Completed: {c.completedCount || 0} · No-shows: {c.noShowCount || 0}</Text>
          </TouchableOpacity>
        ))
      )}

      {pagination.pages > 1 && (
        <View style={styles.pagination}>
          <TouchableOpacity disabled={page <= 1} onPress={() => setPage(page - 1)} style={[styles.pageBtn, page <= 1 && styles.disabled]}><Text style={{ color: COLORS.text }}>Prev</Text></TouchableOpacity>
          <Text style={styles.pageInfo}>{page} / {pagination.pages}</Text>
          <TouchableOpacity disabled={page >= pagination.pages} onPress={() => setPage(page + 1)} style={[styles.pageBtn, page >= pagination.pages && styles.disabled]}><Text style={{ color: COLORS.text }}>Next</Text></TouchableOpacity>
        </View>
      )}

      <Modal visible={!!selected} transparent animationType="fade" onRequestClose={() => setSelected(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalDialog}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Customer Details</Text>
              <TouchableOpacity onPress={() => setSelected(null)} style={styles.modalClose}><Ionicons name="close" size={22} color={COLORS.text} /></TouchableOpacity>
            </View>
            {selected && (
              <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
              <View style={styles.detailRow}><Text style={styles.detailLabel}>Name</Text><Text style={styles.detailValue}>{selected.fullName}</Text></View>
              <View style={styles.detailRow}><Text style={styles.detailLabel}>Phone</Text><Text style={styles.detailValue}>{selected.mobile}</Text></View>
              <View style={styles.detailRow}><Text style={styles.detailLabel}>Email</Text><Text style={styles.detailValue}>{selected.email}</Text></View>
              <View style={styles.detailRow}><Text style={styles.detailLabel}>Vehicles</Text><Text style={styles.detailValue}>{selected.vehicleCount}</Text></View>
              <View style={styles.detailRow}><Text style={styles.detailLabel}>Total Bookings</Text><Text style={styles.detailValue}>{selected.bookingCount}</Text></View>
              <View style={styles.detailRow}><Text style={styles.detailLabel}>Completed Washes</Text><Text style={[styles.detailValue, { color: COLORS.primary, fontWeight: '700' }]}>{selected.completedCount || 0}</Text></View>
              <View style={styles.detailRow}><Text style={styles.detailLabel}>No-shows</Text><Text style={[styles.detailValue, { color: selected.noShowCount > 0 ? '#f39c12' : COLORS.text }]}>{selected.noShowCount || 0}</Text></View>
              <View style={styles.detailRow}><Text style={styles.detailLabel}>Booking Blocked Until</Text><Text style={[styles.detailValue, { color: isBlocked(selected) ? COLORS.danger : COLORS.text }]}>{isBlocked(selected) ? new Date(selected.bookingBlockedUntil).toLocaleDateString('en-IN') : 'Not blocked'}</Text></View>
              {isBlocked(selected) && selected.bookingBlockReason ? (
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Block Reason</Text><Text style={[styles.detailValue, { color: COLORS.danger }]}>{selected.bookingBlockReason}</Text></View>
              ) : null}
              <View style={styles.detailRow}><Text style={styles.detailLabel}>Registered</Text><Text style={styles.detailValue}>{new Date(selected.createdAt).toLocaleDateString()}</Text></View>

              {isBlocked(selected) ? (
                <TouchableOpacity style={styles.unblockBtn} onPress={handleUnblock} disabled={busy} activeOpacity={0.8}>
                  <Ionicons name="checkmark-circle-outline" size={18} color={COLORS.success} />
                  <Text style={styles.unblockBtnText}>{busy ? 'Working...' : 'Unblock & clear strikes'}</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.blockCard}>
                  <Text style={styles.blockCardTitle}>Block from booking</Text>
                  <View style={styles.daysRow}>
                    {BLOCK_DAY_OPTIONS.map(d => (
                      <TouchableOpacity key={d} style={[styles.dayChip, blockDays === d && styles.dayChipActive]} onPress={() => setBlockDays(d)} activeOpacity={0.7}>
                        <Text style={[styles.dayChipText, blockDays === d && styles.dayChipTextActive]}>{d} days</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TextInput
                    style={styles.reasonInput}
                    placeholder="Reason (optional, shown to customer)"
                    placeholderTextColor={COLORS.textLight}
                    value={blockReason}
                    onChangeText={setBlockReason}
                  />
                  <TouchableOpacity style={styles.blockBtn} onPress={handleBlock} disabled={busy} activeOpacity={0.8}>
                    <Ionicons name="ban-outline" size={18} color="#fff" />
                    <Text style={styles.blockBtnText}>{busy ? 'Working...' : `Block for ${blockDays} days`}</Text>
                  </TouchableOpacity>
                </View>
              )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, padding: 12 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 14, padding: 10, marginBottom: 12, gap: 8, ...SHADOWS.small, borderWidth: 1, borderColor: COLORS.borderLight },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.text },
  card: { backgroundColor: COLORS.white, borderRadius: 14, padding: 14, marginBottom: 8, ...SHADOWS.small, borderWidth: 1, borderColor: COLORS.borderLight },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  cardSub: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 2 },
  blockedBadge: { backgroundColor: COLORS.dangerLight, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(231,76,60,0.3)' },
  blockedBadgeText: { fontSize: 10, fontWeight: '800', color: COLORS.danger, letterSpacing: 0.5 },
  emptyWrap: { padding: 40 },
  empty: { textAlign: 'center', color: COLORS.textLight, fontSize: 14 },
  pagination: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12, marginVertical: 16 },
  pageBtn: { padding: 8, backgroundColor: COLORS.white, borderRadius: 10, ...SHADOWS.small },
  disabled: { opacity: 0.4 },
  pageInfo: { fontSize: 14, fontWeight: '500', color: COLORS.text },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,43,70,0.45)', justifyContent: 'center', paddingHorizontal: 20 },
  modalDialog: { backgroundColor: COLORS.white, borderRadius: 20, maxHeight: '85%', borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOWS.medium },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  modalTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  modalClose: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight, gap: 12 },
  detailLabel: { fontSize: 13, color: COLORS.textLight },
  detailValue: { fontSize: 14, fontWeight: '500', color: COLORS.text, flexShrink: 1, textAlign: 'right' },
  blockCard: { marginTop: 16, backgroundColor: COLORS.bg, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: 'rgba(231,76,60,0.25)' },
  blockCardTitle: { fontSize: 14, fontWeight: '700', color: COLORS.danger, marginBottom: 10 },
  daysRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  dayChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.border },
  dayChipActive: { backgroundColor: COLORS.danger, borderColor: COLORS.danger },
  dayChipText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  dayChipTextActive: { color: '#fff' },
  reasonInput: { backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: COLORS.text, marginBottom: 10 },
  blockBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.danger, borderRadius: 12, padding: 14 },
  blockBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  unblockBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderColor: COLORS.success, borderRadius: 12, padding: 14, marginTop: 16, backgroundColor: COLORS.successLight },
  unblockBtnText: { color: COLORS.success, fontSize: 15, fontWeight: '700' },
});

export default AdminCustomersScreen;
