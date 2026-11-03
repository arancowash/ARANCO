import React, { useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../utils/theme';
import { Ionicons } from '@expo/vector-icons';

const SplashScreen = ({ navigation }) => {
  const { user } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => { navigation.replace(user ? 'Home' : 'Login'); }, 1500);
    return () => clearTimeout(timer);
  }, [user]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <View style={styles.content}>
        <View style={styles.logoWrap}>
          <Ionicons name="car-sport" size={72} color={COLORS.primaryAccent} />
        </View>
        <Text style={styles.brand}>ARANCO</Text>
        <Text style={styles.subtitle}>AUTO SERVICE STATION</Text>
        <Text style={styles.location}>VADAVATHOOR, KOTTAYAM</Text>
        <View style={styles.dots}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  content: { alignItems: 'center' },
  logoWrap: { marginBottom: 20 },
  brand: { fontSize: 36, fontWeight: '700', color: '#fff', letterSpacing: 4, marginBottom: 6 },
  subtitle: { fontSize: 14, fontWeight: '700', color: COLORS.primaryAccent, letterSpacing: 3, marginBottom: 6 },
  location: { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.75)', letterSpacing: 1.5, marginBottom: 4 },
  dots: { flexDirection: 'row', gap: 8, marginTop: 40 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.3)' },
  dotActive: { width: 24, backgroundColor: COLORS.primaryAccent },
});

export default SplashScreen;
