import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Vibration, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { notificationAPI } from '../services/api';

export default function NewBookingPopup() {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [notif, setNotif] = useState(null);
  const [queueCount, setQueueCount] = useState(0);
  const seenIds = useRef(new Set());
  const queue = useRef([]);
  const showing = useRef(false);

  const startVibration = useCallback(() => {
    try {
      Vibration.vibrate([0, 300, 200, 300, 200, 300, 200, 600], true);
    } catch (e) {}
  }, []);

  const stopVibration = useCallback(() => {
    try { Vibration.cancel(); } catch (e) {}
  }, []);

  const showNext = useCallback(() => {
    if (queue.current.length === 0) {
      showing.current = false;
      stopVibration();
      return;
    }
    showing.current = true;
    const next = queue.current.shift();
    setQueueCount(queue.current.length);
    setNotif(next);
    setVisible(true);
    startVibration();
    // Mark read immediately so it never re-shows after dismiss/app restart
    notificationAPI.markOneRead(next._id).catch(() => {});
  }, [startVibration, stopVibration]);

  const dismiss = useCallback(() => {
    stopVibration();
    setVisible(false);
    setTimeout(() => showNext(), 300);
  }, [stopVibration, showNext]);

  useEffect(() => {
    return () => { stopVibration(); };
  }, [stopVibration]);

  useEffect(() => {
    if (!user || !['admin', 'staff'].includes(user.role)) return;

    const check = async () => {
      try {
        const res = await notificationAPI.getAll({ limit: 10 });
        const notifications = res.data.data.notifications || [];
        const newBookings = notifications.filter(
          (n) => !n.read && n.data?.status === 'CONFIRMED' && n.data?.type === 'admin'
        );

        for (const n of newBookings) {
          if (!seenIds.current.has(n._id)) {
            queue.current.push(n);
            setQueueCount(queue.current.length);
            seenIds.current.add(n._id);
          }
        }

        if (!showing.current && queue.current.length > 0) {
          showNext();
        }
      } catch (e) {}
    };

    check();
    const i = setInterval(check, 3000);
    return () => clearInterval(i);
  }, [user, showNext]);

  if (!user || !['admin', 'staff'].includes(user.role) || !notif || !visible) return null;

  const d = notif.data || {};
  const date = d.date ? new Date(d.date) : null;
  const dateStr = date ? date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '';

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <View style={styles.backdrop} />
      <View style={styles.popup} pointerEvents="auto">
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="notifications" size={20} color="#1a73e8" />
            <Text style={styles.headerTitle}>New Booking</Text>
            {queueCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>+{queueCount} more</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.section}>
            <View style={styles.row}>
              <Ionicons name="calendar" size={16} color="#1a73e8" />
              <Text style={styles.rowLabel}>Date & Time</Text>
              <Text style={styles.rowValue}>{dateStr} at {d.timeSlot || ''}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Customer</Text>
            <View style={styles.row}>
              <Ionicons name="person" size={16} color="#34a853" />
              <Text style={styles.rowLabel}>Name</Text>
              <Text style={styles.rowValue}>{d.customerName || 'N/A'}</Text>
            </View>
            <View style={styles.row}>
              <Ionicons name="call" size={16} color="#34a853" />
              <Text style={styles.rowLabel}>Phone</Text>
              <Text style={styles.rowValue}>{d.customerPhone || 'N/A'}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vehicle</Text>
            <View style={styles.row}>
              <Ionicons name="car" size={16} color="#ff9800" />
              <Text style={styles.rowLabel}>Reg No</Text>
              <Text style={[styles.rowValue, styles.mono]}>{d.vehicleReg || 'N/A'}</Text>
            </View>
            <View style={styles.row}>
              <Ionicons name="car-sport" size={16} color="#ff9800" />
              <Text style={styles.rowLabel}>Model</Text>
              <Text style={styles.rowValue}>{d.vehicleMake} {d.vehicleModel}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.row}>
              <Ionicons name="construct" size={16} color="#9c27b0" />
              <Text style={styles.rowLabel}>Service</Text>
              <Text style={styles.rowValue}>{d.serviceName || 'N/A'}</Text>
            </View>
            <View style={[styles.row, { borderBottomWidth: 0 }]}>
              <Ionicons name="cash" size={16} color="#1a73e8" />
              <Text style={styles.rowLabel}>Amount</Text>
              <Text style={styles.price}>₹{d.price || 0}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.closeBtn} onPress={dismiss}>
          <Ionicons name="close-circle" size={20} color="#fff" />
          <Text style={styles.closeBtnText}>Dismiss</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', padding: 20, zIndex: 9999, elevation: 9999 },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)' },
  popup: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#e8f0fe' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontWeight: '700', fontSize: 17, color: '#1a73e8' },
  badge: { backgroundColor: '#ea4335', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  body: { padding: 16 },
  section: { marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#666', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f8f8f8' },
  rowLabel: { fontSize: 13, color: '#666', width: 70 },
  rowValue: { fontSize: 14, color: '#333', fontWeight: '500', flex: 1 },
  mono: { fontFamily: 'monospace', fontWeight: '700', color: '#1a73e8' },
  price: { fontSize: 18, fontWeight: '700', color: '#1a73e8' },
  closeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, backgroundColor: '#1a73e8' },
  closeBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
