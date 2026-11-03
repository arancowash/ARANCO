import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Modal, StyleSheet, Vibration } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { notificationAPI } from '../services/api';

export default function CompletionPopup() {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [carNumber, setCarNumber] = useState('');
  const [notifType, setNotifType] = useState('completed');
  const lastCheck = useRef(Date.now());

  useEffect(() => {
    if (!user) return;

    const interval = setInterval(async () => {
      try {
        const res = await notificationAPI.getAll({ limit: 5 });
        const notifications = res.data.data.notifications || [];
        const newOne = notifications.find(
          (n) =>
            !n.read &&
            (n.data?.status === 'READY' || n.data?.status === 'COMPLETED') &&
            n.data?.type !== 'admin' &&
            new Date(n.createdAt).getTime() > lastCheck.current
        );
        if (newOne) {
          const match = newOne.body.match(/\(([A-Z0-9\s]+)\)/);
          setCarNumber(match ? match[1].trim() : '');
          setNotifType(newOne.data?.status === 'READY' ? 'ready' : 'completed');
          setVisible(true);
          if (newOne.data?.status === 'READY') {
            Vibration.vibrate([0, 300, 200, 300, 200, 300, 200, 600]);
          }
          await notificationAPI.markOneRead(newOne._id);
        }
        lastCheck.current = Date.now();
      } catch (e) {}
    }, 5000);

    return () => clearInterval(interval);
  }, [user]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
      <View style={styles.overlay}>
        <View style={styles.popup}>
          <View style={styles.iconDone}>
            <Ionicons name="checkmark-done-circle" size={56} color="#34a853" />
          </View>
          <Text style={styles.title}>
            {notifType === 'ready' ? 'Car Ready!' : 'Service Completed!'}
          </Text>
          <Text style={styles.message}>
            Your car{' '}
            {carNumber ? <Text style={styles.carNumber}>{carNumber}</Text> : null}{' '}
            {notifType === 'ready' ? 'is ready to pick up.' : 'service has been completed.'}
          </Text>
          <Text style={styles.thankYou}>
            {notifType === 'ready' ? 'Please collect your car.' : 'Thank you for choosing us!'}
          </Text>
          <Text style={styles.tapHint} onPress={() => setVisible(false)}>Tap anywhere to close</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  popup: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconDone: { backgroundColor: '#e6f4ea' },
  iconCancel: { backgroundColor: '#fde7e7' },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    color: '#444',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  carNumber: {
    fontFamily: 'monospace',
    fontWeight: '700',
    color: '#1a73e8',
  },
  thankYou: {
    fontSize: 14,
    color: '#34a853',
    fontWeight: '600',
    marginBottom: 20,
  },
  tapHint: {
    fontSize: 12,
    color: '#666',
  },
});
