import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { serviceAPI } from '../services/api';
import { COLORS, SHADOWS } from '../utils/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SERVICES_META = [
  { icon: 'water', color: '#2196F3', bg: '#ebf5fb' },
  { icon: 'sparkles', color: '#27ae60', bg: '#eafaf1' },
  { icon: 'shield-checkmark', color: '#f39c12', bg: '#fef9e7' },
  { icon: 'fitness', color: '#e74c3c', bg: '#fdedec' },
  { icon: 'car', color: '#9b59b6', bg: '#f5eef8' },
];

const ServicesScreen = ({ navigation }) => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchServices = async () => {
    try {
      const res = await serviceAPI.getAll();
      setServices(res.data.data.services || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchServices(); }, []));

  const renderFeatured = ({ item }) => {
    const meta = SERVICES_META[0];
    const prices = item.vehicleCategoryPricing || [];
    const eff = (p) => (p.offerPrice != null && p.offerPrice < p.price) ? p.offerPrice : p.price;
    const minPrice = prices.length > 0 ? Math.min(...prices.map(eff)) : 0;
    const minOriginal = prices.length > 0 ? Math.min(...prices.map(p => p.price)) : 0;
    const hasOffer = prices.some(p => p.offerPrice != null && p.offerPrice < p.price);
    const pctOff = hasOffer && minOriginal > 0 && minPrice < minOriginal ? Math.round((1 - minPrice / minOriginal) * 100) : 0;
    const included = item.includedServices || [];

    return (
      <TouchableOpacity
        style={styles.featuredCard}
        onPress={() => navigation.navigate('ServiceDetails', { service: item })}
        activeOpacity={0.8}
      >
        <View style={styles.featuredBg}>
          <View style={styles.featuredOverlay}>
            <View style={styles.featuredBadge}>
              <Ionicons name="star" size={12} color={COLORS.primaryAccent} />
              <Text style={styles.featuredBadgeText}>{pctOff > 0 ? `${pctOff}% OFF` : 'POPULAR'}</Text>
            </View>

            <View style={styles.featuredContent}>
              <View style={styles.featuredIconWrap}>
                <Ionicons name={meta.icon} size={32} color="#fff" />
              </View>
              <View style={styles.featuredInfo}>
                <Text style={styles.featuredName}>{item.name}</Text>
                <Text style={styles.featuredDesc} numberOfLines={2}>{item.description}</Text>
              </View>
            </View>

            <View style={styles.featuredBottom}>
              <View style={styles.featuredMeta}>
                <View style={styles.featuredMetaItem}>
                  <Ionicons name="time" size={14} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.featuredMetaText}>{item.duration} min</Text>
                </View>
                <View style={styles.featuredDivider} />
                <View style={styles.featuredMetaItem}>
                  <Ionicons name="checkmark-circle" size={14} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.featuredMetaText}>{included.length} services</Text>
                </View>
              </View>
              <View style={styles.featuredPriceWrap}>
                <Text style={styles.featuredPriceLabel}>From</Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                  {hasOffer && <Text style={styles.featuredPriceOriginal}>₹{minOriginal}</Text>}
                  <Text style={styles.featuredPrice}>₹{minPrice}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderService = ({ item, index }) => {
    const meta = SERVICES_META[(index + 1) % SERVICES_META.length];
    const prices = item.vehicleCategoryPricing || [];
    const eff = (p) => (p.offerPrice != null && p.offerPrice < p.price) ? p.offerPrice : p.price;
    const minPrice = prices.length > 0 ? Math.min(...prices.map(eff)) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices.map(eff)) : 0;
    const minOriginal = prices.length > 0 ? Math.min(...prices.map(p => p.price)) : 0;
    const hasOffer = prices.some(p => p.offerPrice != null && p.offerPrice < p.price);
    const pctOff = hasOffer && minOriginal > 0 && minPrice < minOriginal ? Math.round((1 - minPrice / minOriginal) * 100) : 0;
    const included = item.includedServices || [];

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('ServiceDetails', { service: item })}
        activeOpacity={0.7}
      >
        <View style={[styles.cardIconWrap, { backgroundColor: meta.bg }]}>
          <Ionicons name={meta.icon} size={24} color={meta.color} />
        </View>

        <View style={styles.cardContent}>
          <View style={styles.cardTop}>
            <Text style={styles.cardName}>{item.name}</Text>
            <View style={styles.cardPriceBadge}>
              {hasOffer && <Text style={styles.cardPriceOriginal}>₹{minOriginal}</Text>}
              <Text style={styles.cardPrice}>₹{minPrice}</Text>
              {minPrice !== maxPrice && <Text style={styles.cardPriceMax}>-₹{maxPrice}</Text>}
            </View>
          </View>

          <Text style={styles.cardDesc} numberOfLines={1}>{item.description}</Text>

            <View style={styles.cardTags}>
              {pctOff > 0 && (
                <View style={styles.cardTagOffer}>
                  <Ionicons name="pricetag" size={12} color="#fff" />
                  <Text style={styles.cardTagOfferText}>{pctOff}% OFF</Text>
                </View>
              )}
              <View style={styles.cardTag}>
                <Ionicons name="time-outline" size={12} color={COLORS.textSecondary} />
                <Text style={styles.cardTagText}>{item.duration} min</Text>
              </View>
            <View style={[styles.cardTag, styles.cardTagGreen]}>
              <Ionicons name="checkmark-circle-outline" size={12} color={COLORS.success} />
              <Text style={[styles.cardTagText, { color: COLORS.success }]}>{included.length} included</Text>
            </View>
          </View>

          {included.length > 0 && (
            <View style={styles.includedPreview}>
              {included.slice(0, 2).map((s, i) => (
                <View key={i} style={styles.includedItem}>
                  <View style={styles.includedDot} />
                  <Text style={styles.includedText} numberOfLines={1}>{s}</Text>
                </View>
              ))}
              {included.length > 2 && (
                <Text style={styles.includedMore}>+{included.length - 2} more</Text>
              )}
            </View>
          )}
        </View>

        <View style={styles.cardArrow}>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.listHeader}>
      <View style={styles.heroSection}>
        <Text style={styles.heroGreeting}>Choose Your Service</Text>
        <Text style={styles.heroSub}>Select from our premium car wash packages</Text>
      </View>
      {services.length > 0 && (
        <View style={styles.featuredSection}>
          <Text style={styles.sectionLabel}>Featured</Text>
          {renderFeatured({ item: services[0] })}
        </View>
      )}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionLabel}>All Services</Text>
        <Text style={styles.sectionCount}>{services.length} available</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Services</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={COLORS.primaryAccent} />
          <Text style={styles.loadingText}>Loading services...</Text>
        </View>
      ) : services.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="water-outline" size={40} color={COLORS.textLight} />
          </View>
          <Text style={styles.emptyTitle}>No Services Yet</Text>
          <Text style={styles.emptyDesc}>Services will appear here once added by admin</Text>
        </View>
      ) : (
        <FlatList
          data={services.slice(1)}
          renderItem={renderService}
          keyExtractor={(item) => item._id}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 56, paddingBottom: 14, backgroundColor: COLORS.primary },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#fff', letterSpacing: -0.2 },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 13, color: COLORS.textLight, marginTop: 12 },
  list: { paddingBottom: 20 },
  listHeader: { paddingBottom: 8 },
  heroSection: { padding: 20, paddingBottom: 8 },
  heroGreeting: { fontSize: 24, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5 },
  heroSub: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  featuredSection: { padding: 16, paddingBottom: 0 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },
  featuredCard: { borderRadius: 20, overflow: 'hidden', ...SHADOWS.large },
  featuredBg: { backgroundColor: COLORS.primary },
  featuredOverlay: { padding: 20 },
  featuredBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(201,169,110,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start', marginBottom: 16, borderWidth: 1, borderColor: 'rgba(201,169,110,0.25)' },
  featuredBadgeText: { fontSize: 10, fontWeight: '700', color: COLORS.primaryAccent, letterSpacing: 0.8 },
  featuredContent: { flexDirection: 'row', marginBottom: 20 },
  featuredIconWrap: { width: 56, height: 56, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  featuredInfo: { flex: 1 },
  featuredName: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 4, letterSpacing: -0.3 },
  featuredDesc: { fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 18 },
  featuredBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  featuredMeta: { flexDirection: 'row', alignItems: 'center' },
  featuredMetaItem: { flexDirection: 'row', alignItems: 'center', marginRight: 12 },
  featuredMetaText: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '500', marginLeft: 5 },
  featuredDivider: { width: 1, height: 14, backgroundColor: 'rgba(255,255,255,0.2)' },
  featuredPriceWrap: { alignItems: 'flex-end' },
  featuredPriceLabel: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 2 },
  featuredPrice: { fontSize: 24, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  featuredPriceOriginal: { fontSize: 14, color: 'rgba(255,255,255,0.5)', textDecorationLine: 'line-through' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, marginHorizontal: 16, marginBottom: 10, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOWS.small },
  cardIconWrap: { width: 50, height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cardContent: { flex: 1 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  cardName: { fontSize: 16, fontWeight: '700', color: COLORS.text, letterSpacing: -0.2, flex: 1 },
  cardPriceBadge: { flexDirection: 'row', alignItems: 'baseline' },
  cardPrice: { fontSize: 16, fontWeight: '800', color: COLORS.success },
  cardPriceOriginal: { fontSize: 12, color: COLORS.textLight, textDecorationLine: 'line-through', marginRight: 4 },
  cardPriceMax: { fontSize: 12, color: COLORS.textLight, fontWeight: '500', marginLeft: 4 },
  cardDesc: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 8 },
  cardTags: { flexDirection: 'row', marginBottom: 8 },
  cardTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginRight: 8 },
  cardTagOffer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f39c12', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginRight: 8 },
  cardTagOfferText: { fontSize: 11, fontWeight: '700', color: '#fff', marginLeft: 4 },
  cardTagGreen: { backgroundColor: COLORS.successLight },
  cardTagText: { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary, marginLeft: 4 },
  includedPreview: { flexDirection: 'row', alignItems: 'center' },
  includedItem: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 },
  includedDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.success, marginRight: 5 },
  includedText: { fontSize: 11, color: COLORS.textSecondary, flex: 1 },
  includedMore: { fontSize: 11, color: COLORS.primaryAccent, fontWeight: '600' },
  cardArrow: { width: 32, height: 32, borderRadius: 8, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  sectionCount: { fontSize: 12, color: COLORS.textLight, fontWeight: '500' },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIconWrap: { width: 88, height: 88, borderRadius: 24, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: COLORS.borderLight },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  emptyDesc: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', paddingHorizontal: 40 },
});

export default ServicesScreen;
