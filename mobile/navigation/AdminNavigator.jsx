import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AdminHomeScreen from '../screens/admin/AdminHomeScreen';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminBookingsScreen from '../screens/admin/AdminBookingsScreen';
import AdminVehiclesScreen from '../screens/admin/AdminVehiclesScreen';
import AdminServicesScreen from '../screens/admin/AdminServicesScreen';
import AdminStaffScreen from '../screens/admin/AdminStaffScreen';
import AdminCustomersScreen from '../screens/admin/AdminCustomersScreen';
import AdminNotificationsScreen from '../screens/admin/AdminNotificationsScreen';

const Stack = createNativeStackNavigator();

const screenOptions = {
  headerShown: true,
  headerStyle: { backgroundColor: '#fff' },
  headerTintColor: '#1a73e8',
  headerTitleStyle: { fontWeight: '600', fontSize: 16 },
  headerBackTitle: 'Back',
};

const AdminNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminHome" component={AdminHomeScreen} />
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ ...screenOptions, title: 'Dashboard' }} />
      <Stack.Screen name="AdminBookings" component={AdminBookingsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AdminVehicles" component={AdminVehiclesScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AdminServices" component={AdminServicesScreen} options={{ ...screenOptions, title: 'Services' }} />
      <Stack.Screen name="AdminStaff" component={AdminStaffScreen} options={{ ...screenOptions, title: 'Staff' }} />
      <Stack.Screen name="AdminCustomers" component={AdminCustomersScreen} options={{ ...screenOptions, title: 'Customers' }} />
      <Stack.Screen name="AdminNotifications" component={AdminNotificationsScreen} options={{ ...screenOptions, title: 'Notifications' }} />
    </Stack.Navigator>
  );
};

export default AdminNavigator;
