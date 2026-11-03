import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { notificationAPI } from '../services/api';
import { COLORS, SHADOWS } from '../utils/theme';

const STATUS_CONFIG = {
  Confirmed: { icon: 'checkmark-circle', color: COLORS.success, bg: COLORS.successLight, border: COLORS.success },
  Received: { icon: 'car', color: '#f39c12', bg: '#fef9e7', border: '#f39c12' },
  Washing: { icon: 'water', color: '#2196f3', bg: '#ebf5fb', border: '#2196f3' },
  Cleaning: { icon: 'sparkles', color: '#9c27b0', bg: '#f5eef8', border: '#9c27b0' },
  Ready: { icon: 'checkmark-done-circle', color: '#2e7d32', bg: '#eafaf1', border: '#2e7d32' },
  Complete: { icon: 'checkmark-done-circle', color: '#2e7d32', bg: '#eafaf1', border: '#2e7d32' },
  Cancel: { icon: 'close-circle', color: COLORS.danger, bg: COLORS.dangerLight, border: COLORS.danger },
  Default: { icon: 'notifications', color: COLORS.textSecondary, iconColor: '#fff', bg: COLORS.primaryLight, border: COLORS.primary },
};

const getStatusConfig = (notif) => {
  const s = (notif.data?.status || '').toLowerCase();
  const t = (notif.title || '').toLowerCase();
  if (s === 'confirmed' || t.includes('confirm')) return STATUS_CONFIG.Confirmed;
  if (s === 'received' || t.includes('received')) return STATUS_CONFIG.Received;
  if (s === 'washing' || t.includes('washing')) return STATUS_CONFIG.Washing;
  if (s === 'cleaning' || t.includes('cleaning')) return STATUS_CONFIG.Cleaning;
  if (s === 'ready' || t.includes('ready')) return STATUS_CONFIG.Ready;
  if (s === 'completed' || t.includes('complete')) return STATUS_CONFIG.Complete;
  if (s === 'cancelled' || t.includes('cancel')) return STATUS_CONFIG.Cancel;
  return STATUS_CONFIG.Default;
};

const NotificationsScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async (silent = false) => {
    try {
      const res = await notificationAPI.getAll({ limit: 50 });
      setNotifications(res.data.data.notifications || []);
      setUnreadCount(res.data.data.unreadCount || 0);
    } catch (err) {
      console.error(err);
    } finally {
      if (!silent) setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);
  useEffect(() => { const i = setInterval(() => fetchNotifications(true), 10000); return () => clearInterval(i); }, [fetchNotifications]);

  const onRefresh = () => { setRefreshing(true); fetchNotifications(); };

  const markAllRead = async () => {
    try {
      await notificationAPI.markAllRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) { console.error(err); }
  };

  const getTimeAgo = (dateStr) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  };

  const renderNotification = ({ item }) => {
    const config = getStatusConfig(item);
    return (
      <TouchableOpacity
        style={[styles.card, !item.read && styles.cardUnread, { borderLeftColor: config.border, borderLeftWidth: 3 }]}
        onPress={() => {
          if (!item.read) {
            notificationAPI.markOneRead(item._id);
            setUnreadCount((prev) => Math.max(0, prev - 1));
            setNotifications((prev) => prev.map((n) => (n._id === item._id ? { ...n, read: true } : n)));
          }
          if (item.data?.bookingId) { navigation.navigate('BookingDetails', { bookingId: item.data.bookingId }); }
        }}
        activeOpacity={0.7}
      >
        <View style={[styles.iconWrap, { backgroundColor: config.bg }]}>
          <Ionicons name={config.icon} size={22} color={config.iconColor || config.color} />
        </View>
        <View style={styles.content}>
          <Text style={[styles.title, !item.read && { color: config.color }]}>{item.title}</Text>
          <Text style={styles.body} numberOfLines={2}>{item.body}</Text>
          <Text style={styles.time}>{getTimeAgo(item.createdAt)}</Text>
        </View>
        {!item.read && <View style={[styles.dot, { backgroundColor: config.color }]} />}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={markAllRead} style={styles.markBtn}>
            <Text style={styles.markRead}>Mark all read</Text>
          </TouchableOpacity>
        ) : <View style={{ width: 80 }} />}
      </View>

      {loading ? (
        <View style={styles.emptyWrap}>
          <View style={styles.emptyIcon}><Ionicons name="notifications-outline" size={40} color={COLORS.textLight} /></View>
          <Text style={styles.emptyText}>Loading...</Text>
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyWrap}>
          <View style={styles.emptyIcon}><Ionicons name="notifications-off-outline" size={40} color={COLORS.textLight} /></View>
          <Text style={styles.emptyTitle}>No Notifications</Text>
          <Text style={styles.emptyDesc}>You're all caught up!</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id}
          renderItem={renderNotification}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
          contentContainerStyle={{ padding: 16 }}
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
  markBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: COLORS.primaryLight },
  markRead: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  card: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: COLORS.white, borderRadius: 14, padding: 14, marginBottom: 10, ...SHADOWS.small, borderWidth: 1, borderColor: COLORS.borderLight },
  cardUnread: { borderColor: COLORS.primaryLight },
  iconWrap: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12, flexShrink: 0 },
  content: { flex: 1 },
  title: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 2 },
  body: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18, marginBottom: 4 },
  time: { fontSize: 11, color: COLORS.textLight },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 4, marginLeft: 8 },
  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyIcon: { width: 72, height: 72, borderRadius: 20, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: COLORS.borderLight },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: COLORS.text, marginTop: 8, marginBottom: 4 },
  emptyDesc: { fontSize: 14, color: COLORS.textLight },
  emptyText: { fontSize: 14, color: COLORS.textLight, marginTop: 8 },
});

export default NotificationsScreen;
