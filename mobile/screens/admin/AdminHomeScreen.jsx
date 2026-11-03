import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SHADOWS } from '../../utils/theme';

const menuItems = [
  { screen: 'AdminDashboard', icon: 'grid', label: 'Dashboard', color: COLORS.primary, roles: ['admin'] },
  { screen: 'AdminBookings', icon: 'calendar', label: 'Bookings', color: '#f39c12', roles: ['admin', 'staff'] },
  { screen: 'AdminVehicles', icon: 'car', label: 'Workshop', color: '#9c27b0', roles: ['admin', 'staff'] },
  { screen: 'AdminServices', icon: 'build', label: 'Services', color: COLORS.success, roles: ['admin'] },
  { screen: 'AdminStaff', icon: 'people', label: 'Staff', color: '#00bcd4', roles: ['admin'] },
  { screen: 'AdminCustomers', icon: 'person', label: 'Customers', color: '#e91e63', roles: ['admin'] },
  { screen: 'AdminNotifications', icon: 'notifications', label: 'Notifications', color: COLORS.danger, roles: ['admin'] },
];

const AdminHomeScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const isStaff = user?.role === 'staff';
  const visibleMenu = menuItems.filter(item => item.roles.includes(user?.role));

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          {navigation.canGoBack() ? (
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </TouchableOpacity>
          ) : (
            <View style={styles.backBtn}>
              <Ionicons name="car-sport" size={18} color={COLORS.primaryAccent} />
            </View>
          )}
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>{isStaff ? 'Staff Panel' : 'Admin Panel'}</Text>
            <Text style={styles.headerSub}>ARANCO Auto Service Station</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.userRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.fullName?.charAt(0) || 'A'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>{user?.fullName}</Text>
            <Text style={styles.userRole}>{isStaff ? 'Staff' : 'Administrator'}</Text>
          </View>
          <TouchableOpacity style={styles.userActionBtn} onPress={() => navigation.navigate('Profile')} activeOpacity={0.7}>
            <Ionicons name="person-outline" size={18} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.userActionBtn, { backgroundColor: 'rgba(231,76,60,0.25)' }]} onPress={handleLogout} activeOpacity={0.7}>
            <Ionicons name="log-out-outline" size={18} color="#ffb4ab" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <Text style={styles.sectionTitle}>Management</Text>
        <View style={styles.grid}>
          {visibleMenu.map((item) => (
            <TouchableOpacity key={item.screen} style={styles.menuCard} onPress={() => navigation.navigate(item.screen)} activeOpacity={0.7}>
              <View style={[styles.iconBox, { backgroundColor: item.color + '15' }]}>
                <Ionicons name={item.icon} size={24} color={item.color} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { backgroundColor: COLORS.primary, paddingTop: 56, paddingBottom: 20, paddingHorizontal: 16, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(201,169,110,0.2)', justifyContent: 'center', alignItems: 'center' },
  headerTitleWrap: { alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff', letterSpacing: -0.3 },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.85)' },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(201,169,110,0.12)', borderRadius: 14, padding: 12 },
  avatar: { width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.primaryAccent, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  userName: { fontSize: 15, fontWeight: '600', color: '#fff' },
  userRole: { fontSize: 12, color: 'rgba(255,255,255,0.85)' },
  userActionBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  body: { flex: 1 },
  bodyContent: { padding: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  menuCard: { width: '47%', backgroundColor: COLORS.white, borderRadius: 16, padding: 16, alignItems: 'center', ...SHADOWS.small, borderWidth: 1, borderColor: COLORS.borderLight },
  iconBox: { width: 50, height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  menuLabel: { fontSize: 13, fontWeight: '600', color: COLORS.text },
});

export default AdminHomeScreen;
