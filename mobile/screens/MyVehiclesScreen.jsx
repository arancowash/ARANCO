import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { vehicleAPI } from '../services/api';
import { COLORS, SHADOWS } from '../utils/theme';

const MyVehiclesScreen = ({ navigation }) => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchVehicles = async () => {
    try { const res = await vehicleAPI.getAll(); setVehicles(res.data.data.vehicles || []); } catch (err) { console.error(err); } finally { setLoading(false); setRefreshing(false); }
  };

  useFocusEffect(useCallback(() => { fetchVehicles(); }, []));
  const onRefresh = () => { setRefreshing(true); fetchVehicles(); };

  const handleDelete = (vehicle) => {
    Alert.alert('Delete Vehicle', `Remove ${vehicle.make} ${vehicle.model}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { try { await vehicleAPI.delete(vehicle._id); setVehicles(prev => prev.filter(v => v._id !== vehicle._id)); } catch (err) { console.error(err); } } },
    ]);
  };

  const renderVehicle = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <View style={styles.iconWrap}><Ionicons name="car-sport" size={24} color="#fff" /></View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>{item.make} {item.model}</Text>
          <Text style={styles.cardDetail}>{item.registrationNumber}</Text>
          {item.color ? <Text style={styles.cardMeta}>{item.color} · {item.vehicleType}</Text> : null}
        </View>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('EditVehicle', { vehicleId: item._id })} activeOpacity={0.7}>
          <Ionicons name="create-outline" size={18} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: COLORS.dangerLight }]} onPress={() => handleDelete(item)} activeOpacity={0.7}>
          <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Vehicles</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddVehicle')} activeOpacity={0.8}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 60 }} />
      ) : vehicles.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIconWrap}><Ionicons name="car-sport-outline" size={40} color={COLORS.textLight} /></View>
          <Text style={styles.emptyTitle}>No Vehicles Yet</Text>
          <Text style={styles.emptyDesc}>Add your first vehicle to get started</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('AddVehicle')} activeOpacity={0.8}>
            <Ionicons name="add" size={16} color="#fff" />
            <Text style={styles.emptyBtnText}>Add Vehicle</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList data={vehicles} renderItem={renderVehicle} keyExtractor={i => i._id} contentContainerStyle={styles.list} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 56, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, letterSpacing: -0.3 },
  addBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16 },
  card: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginBottom: 12, ...SHADOWS.small, borderWidth: 1, borderColor: COLORS.borderLight },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconWrap: { width: 48, height: 48, borderRadius: 14, backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 2 },
  cardDetail: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 2, fontFamily: 'monospace', letterSpacing: 0.5 },
  cardMeta: { fontSize: 12, color: COLORS.textSecondary },
  cardActions: { flexDirection: 'row', gap: 6 },
  actionBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIconWrap: { width: 80, height: 80, borderRadius: 24, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: COLORS.borderLight },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: COLORS.text, marginBottom: 4 },
  emptyDesc: { fontSize: 14, color: COLORS.textLight, marginBottom: 24 },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14, ...SHADOWS.medium },
  emptyBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});

export default MyVehiclesScreen;
