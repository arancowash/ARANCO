import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { notificationAPI } from '../../services/api';
import { COLORS, SHADOWS } from '../../utils/theme';

const STATUS_CONFIG = {
  Confirmed: { icon: 'checkmark-circle', color: COLORS.success, bg: COLORS.successLight, border: COLORS.success },
  Cancelled: { icon: 'close-circle', color: COLORS.danger, bg: COLORS.dangerLight, border: COLORS.danger },
  Default: { icon: 'notifications', color: '#fff', iconColor: '#fff', bg: COLORS.primaryLight, border: COLORS.primary },
};

const getConfig = (notif) => {
  const s = (notif.data?.status || '').toLowerCase();
  const t = (notif.title || '').toLowerCase();
  if (s === 'confirmed' || t.includes('confirm')) return STATUS_CONFIG.Confirmed;
  if (s === 'cancelled' || t.includes('cancel')) return STATUS_CONFIG.Cancelled;
  return STATUS_CONFIG.Default;
};

const AdminNotificationsScreen = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchData = async (silent = false) => {
    try {
      const res = await notificationAPI.getAll({ limit: 50 });
      const all = res.data.data.notifications || [];
      const filtered = all.filter(n => { const t = n.title.toLowerCase(); return t.includes('confirmed') || t.includes('cancelled'); });
      setNotifications(filtered);
      setUnreadCount(filtered.filter(n => !n.read).length);
    } catch (e) { console.log('Error:', e?.message); }
    if (!silent) setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { const i = setInterval(() => fetchData(true), 10000); return () => clearInterval(i); }, []);
  const onRefresh = async () => { setRefreshing(true); await fetchData(); setRefreshing(false); };

  const markAllRead = async () => { try { await notificationAPI.markAllRead(); setUnreadCount(0); setNotifications(prev => prev.map(n => ({ ...n, read: true }))); } catch (e) { console.log('Error:', e?.message); } };
  const markOneRead = async (id) => { try { await notificationAPI.markOneRead(id); setUnreadCount(prev => Math.max(0, prev - 1)); setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n)); } catch (e) { console.log('Error:', e?.message); } };

  const getTimeAgo = (dateStr) => {
    const diff = Math.floor((new Date() - new Date(dateStr)) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}>
      {unreadCount > 0 && (
        <TouchableOpacity style={styles.markAllBtn} onPress={markAllRead} activeOpacity={0.7}>
          <Ionicons name="checkmark-done" size={16} color={COLORS.primary} /><Text style={styles.markAllText}>Mark all read ({unreadCount})</Text>
        </TouchableOpacity>
      )}

      {loading ? <Text style={styles.empty}>Loading...</Text> : notifications.length === 0 ? (
        <View style={styles.emptyWrap}><Text style={styles.empty}>No notifications</Text></View>
      ) : (
        notifications.map(n => {
          const config = getConfig(n);
          return (
            <TouchableOpacity key={n._id} style={[styles.card, !n.read && styles.unread, { borderLeftColor: config.border, borderLeftWidth: 3 }]} onPress={() => !n.read && markOneRead(n._id)} activeOpacity={0.7}>
              <View style={[styles.iconWrap, { backgroundColor: config.bg }]}>
                <Ionicons name={config.icon} size={22} color={config.iconColor || config.color} />
              </View>
              <View style={styles.cardContent}>
                <Text style={[styles.cardTitle, { color: config.color }]}>{n.title}</Text>
                <Text style={styles.cardBody}>{n.body}</Text>
                <Text style={styles.cardTime}>{getTimeAgo(n.createdAt)}</Text>
              </View>
              {!n.read && <View style={[styles.dot, { backgroundColor: config.color }]} />}
            </TouchableOpacity>
          );
        })
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, padding: 12 },
  markAllBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 10, backgroundColor: COLORS.primaryLight, borderRadius: 12, marginBottom: 12 },
  markAllText: { fontSize: 13, fontWeight: '600', color: COLORS.primary },
  card: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: COLORS.white, borderRadius: 14, padding: 14, marginBottom: 8, ...SHADOWS.small, borderWidth: 1, borderColor: COLORS.borderLight },
  unread: { borderColor: COLORS.primaryLight },
  iconWrap: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  cardBody: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 },
  cardTime: { fontSize: 11, color: COLORS.textLight, marginTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  emptyWrap: { padding: 40 },
  empty: { textAlign: 'center', color: COLORS.textLight, fontSize: 14 },
});

export default AdminNotificationsScreen;
