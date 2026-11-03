import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../utils/theme';

const Dropdown = ({ label, value, options, onChange, placeholder = 'Select an option' }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const showSearch = options.length > 7;

  const filtered = useMemo(() => {
    const sorted = [...options].sort((a, b) => {
      const aOther = a === 'Other';
      const bOther = b === 'Other';
      if (aOther !== bOther) return aOther ? 1 : -1;
      return a.localeCompare(b);
    });
    const q = query.trim().toLowerCase();
    return q ? sorted.filter(o => o.toLowerCase().includes(q)) : sorted;
  }, [options, query]);

  const openDropdown = () => { setQuery(''); setOpen(true); };

  return (
    <>
      <TouchableOpacity style={styles.field} activeOpacity={0.7} onPress={openDropdown}>
        <Text style={[styles.fieldValue, !value && styles.fieldPlaceholder]} numberOfLines={1}>{value || placeholder}</Text>
        <Ionicons name="chevron-down" size={18} color={COLORS.textSecondary} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setOpen(false)} />
          <View style={styles.dialog} onStartShouldSetResponder={() => true}>
            <View style={styles.dialogHeader}>
              <Text style={styles.dialogTitle} numberOfLines={1}>{label || placeholder}</Text>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setOpen(false)}>
                <Ionicons name="close" size={20} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {showSearch && (
              <View style={styles.searchBox}>
                <Ionicons name="search" size={16} color={COLORS.textLight} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search..."
                  placeholderTextColor={COLORS.textLight}
                  value={query}
                  onChangeText={setQuery}
                  autoFocus
                />
                {query ? (
                  <TouchableOpacity onPress={() => setQuery('')}>
                    <Ionicons name="close-circle" size={16} color={COLORS.textLight} />
                  </TouchableOpacity>
                ) : null}
              </View>
            )}

            <ScrollView style={styles.list} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 8 }}>
              {filtered.length === 0 ? (
                <Text style={styles.emptyText}>No matches found</Text>
              ) : filtered.map(opt => {
                const selected = opt === value;
                return (
                  <TouchableOpacity key={opt} style={[styles.option, selected && styles.optionActive]} activeOpacity={0.7} onPress={() => { onChange(opt); setOpen(false); }}>
                    <Text style={[styles.optionText, selected && styles.optionTextActive]} numberOfLines={1}>{opt}</Text>
                    {selected && <Ionicons name="checkmark-circle" size={18} color={COLORS.primaryAccent} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  field: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.bg, borderRadius: 14, borderWidth: 1.5, borderColor: COLORS.border, padding: 14, gap: 8 },
  fieldValue: { fontSize: 15, color: COLORS.text, flex: 1 },
  fieldPlaceholder: { color: COLORS.textLight },
  overlay: { flex: 1, backgroundColor: 'rgba(15,43,70,0.45)', justifyContent: 'center', paddingHorizontal: 24 },
  dialog: { backgroundColor: COLORS.white, borderRadius: 20, maxHeight: '80%', borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOWS.medium, overflow: 'hidden' },
  dialogHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  dialogTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, flex: 1, letterSpacing: -0.2 },
  closeBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, margin: 12, marginBottom: 4, paddingHorizontal: 12, backgroundColor: COLORS.bg, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 15, color: COLORS.text },
  list: { marginTop: 8, paddingHorizontal: 8 },
  option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 13, paddingHorizontal: 12, borderRadius: 12, gap: 8 },
  optionActive: { backgroundColor: COLORS.accentLight },
  optionText: { fontSize: 15, color: COLORS.text, flex: 1 },
  optionTextActive: { fontWeight: '700', color: COLORS.primary },
  emptyText: { textAlign: 'center', color: COLORS.textLight, fontSize: 14, paddingVertical: 24 },
});

export default Dropdown;
