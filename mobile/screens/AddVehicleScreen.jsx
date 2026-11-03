import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { vehicleAPI } from '../services/api';
import { COLORS, SHADOWS } from '../utils/theme';
import { MAKES, getModels, OTHER } from '../utils/vehicleCatalog';
import { normalizePlate, isValidPlate, PLATE_FORMAT_MSG, PLATE_HINT } from '../utils/validation';
import Dropdown from '../components/Dropdown';
import VehicleTypeSelect from '../components/VehicleTypeSelect';

const FUEL_TYPES = ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG'];
const MAKE_OPTIONS = [...MAKES, OTHER];

const AddVehicleScreen = ({ navigation }) => {
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [customMake, setCustomMake] = useState('');
  const [customModel, setCustomModel] = useState('');
  const [year, setYear] = useState('');
  const [color, setColor] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [vehicleType, setVehicleType] = useState('Sedan');
  const [fuelType, setFuelType] = useState('Petrol');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const scrollViewRef = useRef();

  const scrollToField = (ref) => {
    setTimeout(() => { ref?.current?.measureLayout(scrollViewRef.current, (x, y) => { scrollViewRef.current.scrollTo({ y: y - 100, animated: true }); }); }, 100);
  };

  const finalMake = make === OTHER ? customMake.trim() : make;
  const finalModel = make === OTHER ? customModel.trim() : (model === OTHER ? customModel.trim() : model);

  const handleMakeChange = (val) => {
    setMake(val);
    setModel('');
    setCustomModel('');
    if (val !== OTHER) setCustomMake('');
  };

  const handleSave = async () => {
    const plate = normalizePlate(licensePlate);
    if (!finalMake || !finalModel || !year || !plate) { setError('Please fill all required fields'); return; }
    if (!isValidPlate(plate)) { setError(PLATE_FORMAT_MSG); return; }
    setLoading(true); setError('');
    try { await vehicleAPI.create({ make: finalMake, model: finalModel, year: parseInt(year), color, registrationNumber: plate, vehicleType, fuelType }); navigation.goBack(); } catch (err) { setError(err.response?.data?.message || 'Failed to add vehicle'); } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Vehicle</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView ref={scrollViewRef} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {error ? <View style={styles.errorBox}><Ionicons name="alert-circle" size={18} color={COLORS.danger} /><Text style={styles.errorText}>{error}</Text></View> : null}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Make *</Text>
          <Dropdown label="Select Make" value={make} options={MAKE_OPTIONS} onChange={handleMakeChange} placeholder="Select make" />
          {make === OTHER && (
            <TextInput style={[styles.input, { marginTop: 8 }]} placeholder="Type make" placeholderTextColor={COLORS.textLight} value={customMake} onChangeText={setCustomMake} autoCapitalize="words" />
          )}
        </View>

        {!!make && (make !== OTHER || !!customMake.trim()) && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Model *</Text>
            {make === OTHER ? (
              <TextInput style={styles.input} placeholder="Type model" placeholderTextColor={COLORS.textLight} value={customModel} onChangeText={setCustomModel} autoCapitalize="words" />
            ) : (
              <>
                <Dropdown label="Select Model" value={model} options={[...getModels(make), OTHER]} onChange={setModel} placeholder="Select model" />
                {model === OTHER && (
                  <TextInput style={[styles.input, { marginTop: 8 }]} placeholder="Type model" placeholderTextColor={COLORS.textLight} value={customModel} onChangeText={setCustomModel} autoCapitalize="words" />
                )}
              </>
            )}
          </View>
        )}

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Year *</Text>
            <TextInput ref={useRef()} style={styles.input} placeholder="e.g. 2023" placeholderTextColor={COLORS.textLight} value={year} onChangeText={setYear} keyboardType="numeric" />
          </View>
          <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
            <Text style={styles.label}>Color</Text>
            <TextInput ref={useRef()} style={styles.input} placeholder="e.g. White" placeholderTextColor={COLORS.textLight} value={color} onChangeText={setColor} />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>License Plate *</Text>
          <TextInput ref={useRef()} style={[styles.input, { textTransform: 'uppercase', fontFamily: 'monospace', letterSpacing: 1 }]} placeholder="KL07AB1234" placeholderTextColor={COLORS.textLight} value={licensePlate} onChangeText={setLicensePlate} autoCapitalize="characters" />
          <Text style={styles.hint}>{PLATE_HINT}</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Fuel Type</Text>
          <View style={styles.typeRow}>
            {FUEL_TYPES.map(t => (
              <TouchableOpacity key={t} style={[styles.typeBtn, fuelType === t && styles.typeActive]} onPress={() => setFuelType(t)} activeOpacity={0.7}>
                <Text style={[styles.typeText, fuelType === t && styles.typeTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Vehicle Type</Text>
          <VehicleTypeSelect value={vehicleType} onChange={setVehicleType} />
        </View>

        <TouchableOpacity style={[styles.saveBtn, loading && { opacity: 0.6 }]} onPress={handleSave} disabled={loading} activeOpacity={0.8}>
          {loading ? <ActivityIndicator color="#fff" /> : <><Text style={styles.saveBtnText}>Save Vehicle</Text><Ionicons name="checkmark-circle" size={18} color="#fff" /></>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 56, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, letterSpacing: -0.3 },
  scroll: { padding: 20 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.dangerLight, padding: 12, borderRadius: 12, marginBottom: 16 },
  errorText: { color: COLORS.danger, fontSize: 14, flex: 1 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 8 },
  input: { backgroundColor: COLORS.bg, borderRadius: 14, borderWidth: 1.5, borderColor: COLORS.border, padding: 14, fontSize: 15, color: COLORS.text },
  hint: { fontSize: 12, color: COLORS.textLight, marginTop: 6, lineHeight: 16 },
  row: { flexDirection: 'row' },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: COLORS.bg, borderWidth: 1.5, borderColor: COLORS.border },
  typeActive: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
  typeText: { fontSize: 13, fontWeight: '500', color: COLORS.textSecondary },
  typeTextActive: { color: '#fff', fontWeight: '600' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.primary, padding: 16, borderRadius: 14, marginTop: 8, ...SHADOWS.medium },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

export default AddVehicleScreen;
