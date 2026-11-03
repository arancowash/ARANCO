import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { vehicleAPI } from '../services/api';
import { COLORS, SHADOWS } from '../utils/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ServiceDetailsScreen = ({ route, navigation }) => {
  const { service } = route.params;
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  useFocusEffect(useCallback(() => {
    vehicleAPI.getAll().then(res => setVehicles(res.data.data.vehicles || [])).catch(() => {});
  }, []));

  const getPricing = (vehicleType) => {
    const p = (service.vehicleCategoryPricing || []).find(p => p.vehicleType === vehicleType);
    return p ? p.price : null;
  };

  const getEffectivePrice = (vehicleType) => {
    const p = (service.vehicleCategoryPricing || []).find(p => p.vehicleType === vehicleType);
    if (!p) return null;
    return (p.offerPrice != null && p.offerPrice < p.price) ? p.offerPrice : p.price;
  };

  const getOfferPrice = (vehicleType) => {
    const p = (service.vehicleCategoryPricing || []).find(p => p.vehicleType === vehicleType);
    if (!p) return null;
    return (p.offerPrice != null && p.offerPrice < p.price) ? p.offerPrice : null;
  };

  const pctOff = (orig, off) => (orig > 0 && off < orig) ? Math.round((1 - off / orig) * 100) : 0;

  const handleBookNow = () => {
    if (!selectedVehicle) { alert('Please select a vehicle first'); return; }
    navigation.navigate('SelectDate', { service, vehicle: selectedVehicle });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Service Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <View style={styles.heroBg}>
            <View style={styles.heroIconLarge}>
              <Ionicons name="water" size={36} color="#fff" />
            </View>
            <Text style={styles.heroTitle}>{service.name}</Text>
            <Text style={styles.heroDesc}>{service.description}</Text>
            <View style={styles.heroBadges}>
              <View style={styles.heroBadge}>
                <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.8)" />
                <Text style={styles.heroBadgeText}>{service.duration} min</Text>
              </View>
              <View style={[styles.heroBadge, styles.heroBadgeGold]}>
                <Ionicons name="star" size={14} color={COLORS.primaryAccent} />
                <Text style={[styles.heroBadgeText, { color: COLORS.primaryAccent }]}>Premium</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconWrap}>
              <Ionicons name="car-sport" size={16} color={COLORS.primary} />
            </View>
            <Text style={styles.sectionTitle}>Select Vehicle</Text>
          </View>
          {vehicles.length === 0 ? (
            <TouchableOpacity style={styles.addVehicleCard} onPress={() => navigation.navigate('AddVehicle')}>
              <View style={styles.addVehicleIconWrap}>
                <Ionicons name="add-circle-outline" size={28} color={COLORS.primaryAccent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.addVehicleTitle}>No vehicles found</Text>
                <Text style={styles.addVehicleSubtitle}>Add your first vehicle to continue</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.primaryAccent} />
            </TouchableOpacity>
          ) : (
            vehicles.map(v => {
              const eff = getEffectivePrice(v.vehicleType);
              const offer = getOfferPrice(v.vehicleType);
              const isActive = selectedVehicle?._id === v._id;
              return (
                <TouchableOpacity key={v._id} style={[styles.vehicleCard, isActive && styles.vehicleCardActive]} onPress={() => setSelectedVehicle(v)} activeOpacity={0.7}>
                  <View style={styles.vehicleLeft}>
                    <View style={[styles.vehicleRadio, isActive && styles.vehicleRadioActive]}>
                      {isActive && <View style={styles.vehicleRadioInner} />}
                    </View>
                    <View>
                      <Text style={[styles.vehicleName, isActive && styles.vehicleNameActive]}>{v.make} {v.model}</Text>
                      <Text style={[styles.vehicleReg, isActive && styles.vehicleRegActive]}>{v.registrationNumber}</Text>
                    </View>
                  </View>
                  <View style={styles.vehicleRight}>
                    <View style={[styles.vehicleTypePill, isActive && styles.vehicleTypePillActive]}>
                      <Text style={[styles.vehicleTypeText, isActive && styles.vehicleTypeTextActive]}>{v.vehicleType}</Text>
                    </View>
                    {eff !== null ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        {offer !== null && <Text style={[styles.vehicleOriginalPrice, isActive && { color: 'rgba(255,255,255,0.6)' }]}>₹{getPricing(v.vehicleType)}</Text>}
                        <Text style={[styles.vehiclePrice, isActive && styles.vehiclePriceActive]}>₹{eff}</Text>
                        {offer !== null && <Text style={[styles.vehiclePctOff, isActive && { color: COLORS.primaryAccent }]}>{pctOff(getPricing(v.vehicleType), offer)}% OFF</Text>}
                      </View>
                    ) : (
                      <Text style={styles.notAvailable}>N/A</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconWrap}>
              <Ionicons name="pricetag" size={16} color={COLORS.primaryAccent} />
            </View>
            <Text style={styles.sectionTitle}>Pricing</Text>
          </View>
          <View style={styles.pricingCard}>
            {(service.vehicleCategoryPricing || []).map((p, i) => {
              const onOffer = p.offerPrice != null && p.offerPrice < p.price;
              return (
                <View key={p.vehicleType} style={[styles.pricingRow, i < (service.vehicleCategoryPricing || []).length - 1 && styles.pricingRowBorder]}>
                  <View style={styles.pricingLeft}>
                    <View style={styles.pricingTypeIcon}>
                      <Ionicons name={p.vehicleType === 'SUV' ? 'car' : p.vehicleType === 'Sedan' ? 'car-sport' : 'bicycle'} size={18} color={COLORS.primary} />
                    </View>
                    <Text style={styles.pricingType}>{p.vehicleType}</Text>
                    {onOffer && (
                      <View style={styles.offerBadge}>
                        <Text style={styles.offerBadgeText}>{pctOff(p.price, p.offerPrice)}% OFF</Text>
                      </View>
                    )}
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    {onOffer && <Text style={styles.pricingOriginal}>₹{p.price}</Text>}
                    <Text style={[styles.pricingPrice, onOffer && { color: '#f39c12' }]}>₹{onOffer ? p.offerPrice : p.price}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {(service.includedServices || []).length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconWrap}>
                <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
              </View>
              <Text style={styles.sectionTitle}>What's Included</Text>
            </View>
            <View style={styles.includedCard}>
              {(service.includedServices || []).map((s, i) => (
                <View key={i} style={[styles.includedItem, i < (service.includedServices || []).length - 1 && styles.includedBorder]}>
                  <View style={styles.includedDot}>
                    <Ionicons name="checkmark" size={12} color="#fff" />
                  </View>
                  <Text style={styles.includedText}>{s}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            {selectedVehicle && getEffectivePrice(selectedVehicle.vehicleType) !== null ? (
              <>
                <Text style={styles.footerLabel}>Total — pay at the center</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  {getOfferPrice(selectedVehicle.vehicleType) !== null && <Text style={styles.footerOriginal}>₹{getPricing(selectedVehicle.vehicleType)}</Text>}
                  <Text style={styles.footerPrice}>₹{getEffectivePrice(selectedVehicle.vehicleType)}</Text>
                </View>
              </>
            ) : (
              <Text style={styles.footerHint}>Select a vehicle to continue</Text>
            )}
          </View>
          <TouchableOpacity
            style={[styles.bookBtn, (!selectedVehicle || getEffectivePrice(selectedVehicle?.vehicleType) === null) && styles.bookBtnDisabled]}
            onPress={handleBookNow}
            disabled={!selectedVehicle || getEffectivePrice(selectedVehicle?.vehicleType) === null}
            activeOpacity={0.8}
          >
          <Text style={styles.bookBtnText}>Continue</Text>
          <Ionicons name="arrow-forward" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 56, paddingBottom: 14, backgroundColor: COLORS.primary },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#fff', letterSpacing: -0.2 },
  scroll: { paddingBottom: 100 },

  heroSection: { backgroundColor: COLORS.primary, paddingBottom: 24 },
  heroBg: { paddingHorizontal: 20 },
  heroIconLarge: { width: 64, height: 64, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  heroTitle: { fontSize: 26, fontWeight: '800', color: '#fff', marginBottom: 6, letterSpacing: -0.5 },
  heroDesc: { fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 20, marginBottom: 16 },
  heroBadges: { flexDirection: 'row', gap: 10 },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  heroBadgeGold: { backgroundColor: 'rgba(201,169,110,0.12)', borderWidth: 1, borderColor: 'rgba(201,169,110,0.25)' },
  heroBadgeText: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.85)' },

  section: { padding: 16, paddingBottom: 0 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  sectionIconWrap: { width: 32, height: 32, borderRadius: 8, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, letterSpacing: -0.2 },

  pricingCard: { backgroundColor: COLORS.white, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOWS.small },
  pricingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 },
  pricingRowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  pricingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pricingTypeIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' },
  pricingType: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  pricingPrice: { fontSize: 18, fontWeight: '800', color: COLORS.success, letterSpacing: -0.3 },
  pricingOriginal: { fontSize: 14, color: COLORS.textLight, textDecorationLine: 'line-through' },
  offerBadge: { backgroundColor: '#f39c12', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  offerBadgeText: { fontSize: 9, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },

  includedCard: { backgroundColor: COLORS.white, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOWS.small },
  includedItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  includedBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  includedDot: { width: 22, height: 22, borderRadius: 11, backgroundColor: COLORS.success, justifyContent: 'center', alignItems: 'center' },
  includedText: { fontSize: 14, color: COLORS.text, flex: 1 },

  vehicleCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 14, marginBottom: 8, backgroundColor: COLORS.white },
  vehicleCardActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  vehicleLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  vehicleRadio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center' },
  vehicleRadioActive: { borderColor: '#fff' },
  vehicleRadioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff' },
  vehicleName: { fontSize: 15, fontWeight: '600', color: COLORS.text, marginBottom: 2 },
  vehicleNameActive: { color: '#fff' },
  vehicleReg: { fontSize: 12, color: COLORS.textLight, fontFamily: 'monospace' },
  vehicleRegActive: { color: 'rgba(255,255,255,0.7)' },
  vehicleRight: { alignItems: 'flex-end', gap: 6 },
  vehicleTypePill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, backgroundColor: COLORS.bg },
  vehicleTypePillActive: { backgroundColor: 'rgba(255,255,255,0.15)' },
  vehicleTypeText: { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary },
  vehicleTypeTextActive: { color: 'rgba(255,255,255,0.85)' },
  vehiclePrice: { fontSize: 16, fontWeight: '800', color: COLORS.success },
  vehiclePriceActive: { color: '#fff' },
  vehicleOriginalPrice: { fontSize: 12, color: COLORS.textLight, textDecorationLine: 'line-through' },
  vehiclePctOff: { fontSize: 10, fontWeight: '800', color: '#f39c12' },
  notAvailable: { fontSize: 13, color: COLORS.textLight },

  addVehicleCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, backgroundColor: COLORS.white, borderRadius: 14, borderWidth: 1.5, borderColor: COLORS.border, borderStyle: 'dashed' },
  addVehicleIconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(201,169,110,0.08)', justifyContent: 'center', alignItems: 'center' },
  addVehicleTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 2 },
  addVehicleSubtitle: { fontSize: 12, color: COLORS.textLight },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.white, padding: 16, paddingBottom: 28, borderTopWidth: 1, borderTopColor: COLORS.borderLight, flexDirection: 'row', alignItems: 'center', gap: 16, ...SHADOWS.medium },
  footerLeft: { flex: 1 },
  footerLabel: { fontSize: 12, color: COLORS.textLight, marginBottom: 2 },
  footerPrice: { fontSize: 24, fontWeight: '800', color: COLORS.success, letterSpacing: -0.5 },
  footerOriginal: { fontSize: 14, color: COLORS.textLight, textDecorationLine: 'line-through', marginTop: 6 },
  footerHint: { fontSize: 13, color: COLORS.textLight },
  bookBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.primary, paddingHorizontal: 28, paddingVertical: 16, borderRadius: 14 },
  bookBtnDisabled: { opacity: 0.45 },
  bookBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});

export default ServiceDetailsScreen;
