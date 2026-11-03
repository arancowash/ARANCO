import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../utils/theme';
import { VEHICLE_TYPES } from '../utils/vehicleCatalog';

const IMAGES = {
  Hatchback: require('../assets/vehicletypes/hatchback.jpg'),
  Sedan: require('../assets/vehicletypes/sedan.jpg'),
  SUV: require('../assets/vehicletypes/suv.jpg'),
  MUV: require('../assets/vehicletypes/muv.jpg'),
  Luxury: require('../assets/vehicletypes/luxury.jpg'),
  Other: require('../assets/vehicletypes/other.jpg'),
};

const HINTS = {
  Hatchback: 'Compact, short rear',
  Sedan: '4 doors, separate boot',
  SUV: 'Tall, high clearance',
  MUV: '7+ seats, family van',
  Luxury: 'Premium high-end car',
  Other: 'None of these',
};

const VehicleTypeSelect = ({ value, onChange }) => (
  <View style={styles.grid}>
    {VEHICLE_TYPES.map(t => {
      const active = value === t;
      return (
        <TouchableOpacity key={t} style={[styles.card, active && styles.cardActive]} activeOpacity={0.8} onPress={() => onChange(t)}>
          <View style={styles.imgWrap}>
            <Image source={IMAGES[t]} style={styles.img} resizeMode="cover" />
            <View style={[styles.tint, active && styles.tintActive]} />
            <View style={[styles.radio, active && styles.radioActive]}>
              {active && <Ionicons name="checkmark" size={13} color={COLORS.primary} />}
            </View>
          </View>
          <View style={[styles.labelWrap, active && styles.labelWrapActive]}>
            <Text style={[styles.label, active && styles.labelActive]}>{t}</Text>
            <Text style={[styles.hint, active && styles.hintActive]} numberOfLines={1}>{HINTS[t]}</Text>
          </View>
        </TouchableOpacity>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
  card: { width: '48%', borderRadius: 16, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.white, overflow: 'hidden' },
  cardActive: { borderColor: COLORS.primaryAccent, ...SHADOWS.accent },
  imgWrap: { width: '100%', height: 96, backgroundColor: COLORS.bg },
  img: { width: '100%', height: '100%' },
  tint: { ...StyleSheet.absoluteFillObject, backgroundColor: 'transparent' },
  tintActive: { backgroundColor: 'rgba(15,43,70,0.22)' },
  radio: { position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: '#fff', backgroundColor: 'rgba(255,255,255,0.7)', alignItems: 'center', justifyContent: 'center' },
  radioActive: { backgroundColor: COLORS.primaryAccent, borderColor: COLORS.primaryAccent },
  labelWrap: { alignItems: 'center', paddingVertical: 9, paddingHorizontal: 6, gap: 1 },
  labelWrapActive: { backgroundColor: COLORS.accentLight },
  label: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary, letterSpacing: -0.1 },
  labelActive: { color: COLORS.primary },
  hint: { fontSize: 10, color: COLORS.textLight },
  hintActive: { color: COLORS.textSecondary },
});

export default VehicleTypeSelect;
