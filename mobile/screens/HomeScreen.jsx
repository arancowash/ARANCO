import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, StatusBar, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { vehicleAPI, bookingAPI, notificationAPI, adminAPI, serviceAPI } from '../services/api';
import { COLORS, SHADOWS } from '../utils/theme';

const APP_NAME = 'ARANCO';
const APP_TAGLINE = 'AUTO SERVICE STATION';
const APP_LOCATION = 'Vadavathoor, Kottayam';

const SectionHeader = ({ title, actionLabel, onAction }) => (
  <View style={styles.sectionHead}>
    <View style={styles.sectionBar} />
    <Text style={styles.sectionTitle}>{title}</Text>
    {!!actionLabel && (
      <TouchableOpacity style={styles.sectionAction} onPress={onAction} activeOpacity={0.7}>
        <Text style={styles.sectionActionText}>{actionLabel}</Text>
        <Ionicons name="arrow-forward" size={13} color={COLORS.primary} />
      </TouchableOpacity>
    )}
  </View>
);

const HomeScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const isStaffUser = user?.role === 'staff';
  const [vehicleCount, setVehicleCount] = useState(0);
  const [activeBookings, setActiveBookings] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [services, setServices] = useState([]);

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        try {
          const nRes = await notificationAPI.getAll({ limit: 1 });
          setUnreadCount(nRes.data.unreadCount || nRes.data.data?.unreadCount || 0);
          if (isStaffUser) {
            const d = new Date();
            const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            const [allRes, vehRes] = await Promise.all([
              adminAPI.getBookings({ date: dateStr, limit: 200 }),
              adminAPI.getVehiclesWithBookings(),
            ]);
            const all = allRes.data.data.bookings || [];
            setActiveBookings(all.filter(b => !['COMPLETED', 'CANCELLED'].includes(b.status)).length);
            setVehicleCount((vehRes.data.data.vehicles || []).filter(v => v.activeBookings?.length > 0).length);
          } else {
            const [vRes, bRes, sRes] = await Promise.all([
              vehicleAPI.getAll(),
              bookingAPI.getAll({ status: 'CONFIRMED' }),
              serviceAPI.getAll(),
            ]);
            setVehicleCount(vRes.data.data.vehicles?.length || 0);
            setActiveBookings(bRes.data.data.bookings?.length || 0);
            setServices((sRes.data.data.services || []).filter(s => s.isActive).slice(0, 6));
          }
        } catch (err) {
          console.error(err);
        }
      };
      fetchData();
    }, [isStaffUser])
  );

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const dateLabel = new Date().toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' });

  const servicePrice = (s) => {
    const prices = (s.vehicleCategoryPricing || []).map(p => (p.offerPrice != null && p.offerPrice < p.price ? p.offerPrice : p.price));
    return prices.length ? Math.min(...prices) : 0;
  };
  const serviceOnOffer = (s) => (s.vehicleCategoryPricing || []).some(p => p.offerPrice != null && p.offerPrice < p.price);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <View style={styles.header}>
        <View style={styles.brandRow}>
          <View style={styles.brandLeft}>
            <View style={styles.brandLogo}>
              <Ionicons name="car-sport" size={24} color={COLORS.primary} />
            </View>
            <View style={styles.brandText}>
              <Text style={styles.brandName}>{APP_NAME}</Text>
              <Text style={styles.brandTagline}>{APP_TAGLINE}</Text>
              <View style={styles.brandLocRow}>
                <Ionicons name="location-outline" size={10} color="rgba(255,255,255,0.55)" />
                <Text style={styles.brandLoc}>{APP_LOCATION}</Text>
              </View>
            </View>
          </View>
          <View style={styles.headerBtns}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Notifications')}>
              <Ionicons name="notifications-outline" size={19} color="#fff" />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={19} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.greetRow}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.fullName?.split(' ')[0] || 'User'}</Text>
          </View>
          <View style={styles.dateChip}>
            <Ionicons name="calendar-outline" size={12} color={COLORS.primaryAccent} />
            <Text style={styles.dateChipText}>{dateLabel}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="car-sport" size={18} color={COLORS.primaryAccent} />
            </View>
            <View>
              <Text style={styles.statNum}>{vehicleCount}</Text>
              <Text style={styles.statLabel}>{isStaffUser ? 'In Workshop' : 'My Vehicles'}</Text>
            </View>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="calendar" size={18} color={COLORS.primaryAccent} />
            </View>
            <View>
              <Text style={styles.statNum}>{activeBookings}</Text>
              <Text style={styles.statLabel}>{isStaffUser ? "Today's Bookings" : 'Active Bookings'}</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
        <SectionHeader title="Quick Actions" />
        <View style={styles.actionsGrid}>
          {isStaffUser ? (
            <>
              <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('AdminPanel', { screen: 'AdminBookings' })} activeOpacity={0.7}>
                <View style={[styles.actionIcon, { backgroundColor: '#fef9e7' }]}>
                  <Ionicons name="calendar" size={22} color={COLORS.warning} />
                </View>
                <Text style={styles.actionTitle}>Booking</Text>
                <Text style={styles.actionDesc}>All bookings</Text>
                <Ionicons name="chevron-forward" size={16} color={COLORS.textLight} style={{ position: 'absolute', right: 12, top: 16 }} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('AdminPanel', { screen: 'AdminVehicles' })} activeOpacity={0.7}>
                <View style={[styles.actionIcon, { backgroundColor: '#eafaf1' }]}>
                  <Ionicons name="car-sport" size={22} color={COLORS.success} />
                </View>
                <Text style={styles.actionTitle}>Workshop</Text>
                <Text style={styles.actionDesc}>Vehicles in work</Text>
                <Ionicons name="chevron-forward" size={16} color={COLORS.textLight} style={{ position: 'absolute', right: 12, top: 16 }} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Profile')} activeOpacity={0.7}>
                <View style={[styles.actionIcon, { backgroundColor: '#f5f0eb' }]}>
                  <Ionicons name="person" size={22} color={COLORS.accent} />
                </View>
                <Text style={styles.actionTitle}>Profile</Text>
                <Text style={styles.actionDesc}>Account settings</Text>
                <Ionicons name="chevron-forward" size={16} color={COLORS.textLight} style={{ position: 'absolute', right: 12, top: 16 }} />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Services')} activeOpacity={0.7}>
                <View style={[styles.actionIcon, { backgroundColor: '#ebf5fb' }]}>
                  <Ionicons name="water" size={22} color={COLORS.info} />
                </View>
                <Text style={styles.actionTitle}>Book Wash</Text>
                <Text style={styles.actionDesc}>Choose a service</Text>
                <Ionicons name="chevron-forward" size={16} color={COLORS.textLight} style={{ position: 'absolute', right: 12, top: 16 }} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('MyVehicles')} activeOpacity={0.7}>
                <View style={[styles.actionIcon, { backgroundColor: '#eafaf1' }]}>
                  <Ionicons name="car-sport" size={22} color={COLORS.success} />
                </View>
                <Text style={styles.actionTitle}>My Vehicles</Text>
                <Text style={styles.actionDesc}>Manage your cars</Text>
                <Ionicons name="chevron-forward" size={16} color={COLORS.textLight} style={{ position: 'absolute', right: 12, top: 16 }} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('MyBookings')} activeOpacity={0.7}>
                <View style={[styles.actionIcon, { backgroundColor: '#fef9e7' }]}>
                  <Ionicons name="calendar" size={22} color={COLORS.warning} />
                </View>
                <Text style={styles.actionTitle}>My Bookings</Text>
                <Text style={styles.actionDesc}>View all bookings</Text>
                <Ionicons name="chevron-forward" size={16} color={COLORS.textLight} style={{ position: 'absolute', right: 12, top: 16 }} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Profile')} activeOpacity={0.7}>
                <View style={[styles.actionIcon, { backgroundColor: '#f5f0eb' }]}>
                  <Ionicons name="person" size={22} color={COLORS.accent} />
                </View>
                <Text style={styles.actionTitle}>Profile</Text>
                <Text style={styles.actionDesc}>Account settings</Text>
                <Ionicons name="chevron-forward" size={16} color={COLORS.textLight} style={{ position: 'absolute', right: 12, top: 16 }} />
              </TouchableOpacity>
            </>
          )}
        </View>

        {!isStaffUser && services.length > 0 && (
          <>
            <SectionHeader title="Popular Services" actionLabel="See all" onAction={() => navigation.navigate('Services')} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.servicesRow}>
              {services.map(s => (
                <TouchableOpacity key={s._id} style={styles.serviceCard} onPress={() => navigation.navigate('Services')} activeOpacity={0.8}>
                  <View style={styles.serviceIcon}>
                    <Ionicons name="water-outline" size={20} color={COLORS.info} />
                  </View>
                  {serviceOnOffer(s) && (
                    <View style={styles.offerTag}>
                      <Text style={styles.offerTagText}>OFFER</Text>
                    </View>
                  )}
                  <Text style={styles.serviceName} numberOfLines={1}>{s.name}</Text>
                  <Text style={styles.serviceMeta}>{s.duration} min</Text>
                  <Text style={styles.servicePrice}>From ₹{servicePrice(s)}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        {!isStaffUser && (
          <>
            <SectionHeader title="Services" />
            <TouchableOpacity style={styles.banner} onPress={() => navigation.navigate('Services')} activeOpacity={0.7}>
              <View style={styles.bannerOverlay}>
                <View style={styles.bannerContent}>
                  <Text style={styles.bannerTag}>PREMIUM</Text>
                  <Text style={styles.bannerTitle}>Car Wash {'&'} Cleaning</Text>
                  <Text style={styles.bannerDesc}>Professional service at your doorstep</Text>
                  <View style={styles.bannerBtn}>
                    <Text style={styles.bannerBtnText}>Book Now</Text>
                    <Ionicons name="arrow-forward" size={14} color="#fff" />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </>
        )}

        <SectionHeader title="Account" />
        <TouchableOpacity style={styles.profileCard} onPress={() => navigation.navigate('Profile')} activeOpacity={0.7}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>{user?.fullName?.charAt(0) || 'U'}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.fullName}</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
          </View>
          <View style={styles.profileArrow}>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { backgroundColor: COLORS.primary, paddingTop: 56, paddingBottom: 24, paddingHorizontal: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  brandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brandLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  brandLogo: { width: 46, height: 46, borderRadius: 13, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  brandText: {},
  brandName: { fontSize: 20, fontWeight: '700', color: '#fff', letterSpacing: 3 },
  brandTagline: { fontSize: 9.5, fontWeight: '700', color: COLORS.primaryAccent, letterSpacing: 2, marginTop: 2 },
  brandLocRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  brandLoc: { fontSize: 10, color: 'rgba(255,255,255,0.55)', letterSpacing: 0.3 },
  headerBtns: { flexDirection: 'row', gap: 8 },
  iconBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  badge: { position: 'absolute', top: -3, right: -3, backgroundColor: COLORS.danger, borderRadius: 10, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  greetRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 20 },
  greeting: { fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: '400' },
  userName: { fontSize: 22, fontWeight: '700', color: '#fff', letterSpacing: -0.3, marginTop: 1 },
  dateChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(201,169,110,0.35)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  dateChipText: { fontSize: 11.5, fontWeight: '600', color: COLORS.primaryAccent, letterSpacing: 0.3 },
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 18 },
  statCard: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  statIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(201,169,110,0.18)', justifyContent: 'center', alignItems: 'center' },
  statNum: { fontSize: 18, fontWeight: '700', color: '#fff' },
  statLabel: { fontSize: 10.5, color: 'rgba(255,255,255,0.75)', fontWeight: '500', marginTop: 1 },
  body: { flex: 1 },
  bodyContent: { padding: 16, paddingBottom: 40 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', marginTop: 18, marginBottom: 12 },
  sectionBar: { width: 4, height: 15, borderRadius: 2, backgroundColor: COLORS.primaryAccent, marginRight: 8 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: COLORS.text, letterSpacing: 0.8, textTransform: 'uppercase', flex: 1 },
  sectionAction: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sectionActionText: { fontSize: 12.5, fontWeight: '600', color: COLORS.primary },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  actionCard: { width: '48%', backgroundColor: COLORS.card, borderRadius: 16, padding: 16, marginBottom: 10, ...SHADOWS.small, borderWidth: 1, borderColor: COLORS.borderLight },
  actionIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  actionTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 2 },
  actionDesc: { fontSize: 12, color: COLORS.textLight },
  servicesRow: { paddingRight: 8, paddingBottom: 4 },
  serviceCard: { width: 148, backgroundColor: COLORS.card, borderRadius: 16, padding: 14, marginRight: 10, borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOWS.small },
  serviceIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#ebf5fb', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  offerTag: { position: 'absolute', top: 12, right: 12, backgroundColor: COLORS.primaryAccent, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  offerTagText: { fontSize: 9, fontWeight: '700', color: COLORS.primary, letterSpacing: 0.5 },
  serviceName: { fontSize: 13.5, fontWeight: '600', color: COLORS.text, marginBottom: 2 },
  serviceMeta: { fontSize: 11, color: COLORS.textLight, marginBottom: 8 },
  servicePrice: { fontSize: 15, fontWeight: '700', color: COLORS.primary },
  banner: { borderRadius: 16, overflow: 'hidden', marginBottom: 4, ...SHADOWS.medium },
  bannerOverlay: { backgroundColor: COLORS.primary, padding: 24, borderRadius: 16 },
  bannerContent: {},
  bannerTag: { fontSize: 10, fontWeight: '700', color: '#fff', letterSpacing: 1.5, marginBottom: 8, textTransform: 'uppercase' },
  bannerTitle: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 4, letterSpacing: -0.3 },
  bannerDesc: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 16 },
  bannerBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.primaryAccent, alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  bannerBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  profileCard: { backgroundColor: COLORS.card, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', ...SHADOWS.small, borderWidth: 1, borderColor: COLORS.borderLight },
  profileAvatar: { width: 44, height: 44, borderRadius: 14, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  profileAvatarText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  profileEmail: { fontSize: 12, color: COLORS.textLight, marginTop: 1 },
  profileArrow: { width: 32, height: 32, borderRadius: 8, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' },
});

export default HomeScreen;
