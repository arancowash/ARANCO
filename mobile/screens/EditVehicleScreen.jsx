import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { vehicleAPI } from '../services/api';
import { COLORS, SHADOWS } from '../utils/theme';
import { MAKES, getModels, OTHER } from '../utils/vehicleCatalog';
import { normalizePlate, isValidPlate, PLATE_FORMAT_MSG, PLATE_HINT } from '../utils/validation';
import Dropdown from '../components/Dropdown';
import VehicleTypeSelect from '../components/VehicleTypeSelect';

const MAKE_OPTIONS = [...MAKES, OTHER];

const initialSelections = (make = '', model = '') => {
  const knownMake = MAKES.includes(make);
  const models = knownMake ? getModels(make) : [];
  const knownModel = models.includes(model);
  return {
    make: make ? (knownMake ? make : OTHER) : '',
    customMake: make && !knownMake ? make : '',
    model: model ? (knownModel ? model : OTHER) : '',
    customModel: model && !knownModel ? model : '',
  };
};

const EditVehicleScreen = ({ route, navigation }) => {
  const { vehicleId, vehicle: vehicleParam } = route.params;
  const [vehicle, setVehicle] = useState(vehicleParam || null);
  const [form, setForm] = useState({
    registrationNumber: vehicleParam?.registrationNumber || vehicleParam?.licensePlate || '',
    variant: vehicleParam?.variant || '',
    vehicleType: vehicleParam?.vehicleType || 'Sedan', fuelType: vehicleParam?.fuelType || '',
    color: vehicleParam?.color || '', year: String(vehicleParam?.year || ''),
    ...initialSelections(vehicleParam?.make, vehicleParam?.model),
  });
  const [loading, setLoading] = useState(!vehicleParam);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!vehicleParam && vehicleId) {
      vehicleAPI.getOne(vehicleId).then(res => {
        const v = res.data.data.vehicle || res.data.data;
        setVehicle(v);
        setForm({ registrationNumber: v.registrationNumber || v.licensePlate || '', variant: v.variant || '', vehicleType: v.vehicleType || 'Sedan', fuelType: v.fuelType || '', color: v.color || '', year: String(v.year || ''), ...initialSelections(v.make, v.model) });
      }).catch(() => {}).finally(() => setLoading(false));
    }
  }, [vehicleId, vehicleParam]);

  const finalMake = form.make === OTHER ? form.customMake.trim() : form.make;
  const finalModel = form.make === OTHER ? form.customModel.trim() : (form.model === OTHER ? form.customModel.trim() : form.model);

  const handleSubmit = async () => {
    const plate = normalizePlate(form.registrationNumber);
    if (!finalMake || !finalModel || !plate) { setError('Please fill all required fields'); return; }
    if (!isValidPlate(plate)) { setError(PLATE_FORMAT_MSG); return; }
    setLoading(true); setError('');
    try {
      const { customMake, customModel, ...rest } = form;
      await vehicleAPI.update(vehicle._id, { ...rest, registrationNumber: plate, make: finalMake, model: finalModel, year: parseInt(form.year) || undefined });
      navigation.goBack();
    } catch (err) { setError(err.response?.data?.message || 'Failed to update vehicle'); } finally { setLoading(false); }
  };

  const update = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const handleMakeChange = (val) => setForm(p => ({ ...p, make: val, model: '', customModel: '', ...(val !== OTHER ? { customMake: '' } : {}) }));

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Vehicle</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {error ? <View style={styles.errorBox}><Ionicons name="alert-circle" size={18} color={COLORS.danger} /><Text style={styles.errorText}>{error}</Text></View> : null}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Registration Number *</Text>
          <TextInput style={[styles.input, { textTransform: 'uppercase', fontFamily: 'monospace', letterSpacing: 1 }]} placeholder="KL07AB1234" placeholderTextColor={COLORS.textLight} value={form.registrationNumber} onChangeText={v => update('registrationNumber', v.toUpperCase())} autoCapitalize="characters" />
          <Text style={styles.hint}>{PLATE_HINT}</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Make *</Text>
          <Dropdown label="Select Make" value={form.make} options={MAKE_OPTIONS} onChange={handleMakeChange} placeholder="Select make" />
          {form.make === OTHER && (
            <TextInput style={[styles.input, { marginTop: 8 }]} placeholder="Type make" placeholderTextColor={COLORS.textLight} value={form.customMake} onChangeText={v => update('customMake', v)} autoCapitalize="words" />
          )}
        </View>

        {!!form.make && (form.make !== OTHER || !!form.customMake.trim()) && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Model *</Text>
            {form.make === OTHER ? (
              <TextInput style={styles.input} placeholder="Type model" placeholderTextColor={COLORS.textLight} value={form.customModel} onChangeText={v => update('customModel', v)} autoCapitalize="words" />
            ) : (
              <>
                <Dropdown label="Select Model" value={form.model} options={[...getModels(form.make), OTHER]} onChange={v => update('model', v)} placeholder="Select model" />
                {form.model === OTHER && (
                  <TextInput style={[styles.input, { marginTop: 8 }]} placeholder="Type model" placeholderTextColor={COLORS.textLight} value={form.customModel} onChangeText={v => update('customModel', v)} autoCapitalize="words" />
                )}
              </>
            )}
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Variant</Text>
          <TextInput style={styles.input} value={form.variant} onChangeText={v => update('variant', v)} />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Vehicle Type</Text>
          <VehicleTypeSelect value={form.vehicleType} onChange={v => update('vehicleType', v)} />
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Color</Text>
            <TextInput style={styles.input} value={form.color} onChangeText={v => update('color', v)} />
          </View>
          <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
            <Text style={styles.label}>Year</Text>
            <TextInput style={styles.input} value={form.year} onChangeText={v => update('year', v)} keyboardType="numeric" maxLength={4} />
          </View>
        </View>

        <TouchableOpacity style={[styles.saveBtn, loading && { opacity: 0.6 }]} onPress={handleSubmit} disabled={loading} activeOpacity={0.8}>
          {loading ? <ActivityIndicator color="#fff" /> : <><Text style={styles.saveBtnText}>Update Vehicle</Text><Ionicons name="checkmark-circle" size={18} color="#fff" /></>}
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
  scroll: { padding: 20, paddingBottom: 40 },
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

export default EditVehicleScreen;
