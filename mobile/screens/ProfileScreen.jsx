import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { COLORS, SHADOWS } from '../utils/theme';

const ProfileScreen = ({ navigation }) => {
  const { user, updateUser, logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [mobile, setMobile] = useState(user?.mobile || '');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const handleUpdate = async () => {
    if (!fullName || !mobile) { setMsg({ type: 'error', text: 'Name and phone are required' }); return; }
    setLoading(true);
    try {
      await updateUser({ fullName, mobile });
      setMsg({ type: 'success', text: 'Profile updated!' });
      setEditing(false);
      setTimeout(() => setMsg({ type: '', text: '' }), 2000);
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Update failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.fullName?.charAt(0) || 'U'}</Text>
          </View>
          <Text style={styles.userName}>{user?.fullName}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <View style={styles.roleBadge}>
            <Ionicons name="shield-checkmark" size={14} color={COLORS.primaryAccent} />
            <Text style={styles.roleText}>{user?.role === 'admin' ? 'Admin' : user?.role === 'staff' ? 'Staff' : 'Customer'}</Text>
          </View>
        </View>

        {msg.text ? (
          <View style={[styles.msgBox, { backgroundColor: msg.type === 'error' ? COLORS.dangerLight : COLORS.successLight }]}>
            <Ionicons name={msg.type === 'error' ? 'alert-circle' : 'checkmark-circle'} size={18} color={msg.type === 'error' ? COLORS.danger : COLORS.success} />
            <Text style={[styles.msgText, { color: msg.type === 'error' ? COLORS.danger : COLORS.success }]}>{msg.text}</Text>
          </View>
        ) : null}

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Personal Information</Text>
            {!editing && (
              <TouchableOpacity onPress={() => { setEditing(true); setMsg({ type: '', text: '' }); }} style={styles.editBtn}>
                <Ionicons name="create-outline" size={18} color="#fff" />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>FULL NAME</Text>
            {editing ? (
              <TextInput style={styles.fieldInput} value={fullName} onChangeText={setFullName} />
            ) : (
              <Text style={styles.fieldValue}>{user?.fullName}</Text>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>EMAIL</Text>
            <Text style={[styles.fieldValue, { color: COLORS.textLight }]}>{user?.email}</Text>
          </View>

          <View style={[styles.field, { borderBottomWidth: 0 }]}>
            <Text style={styles.fieldLabel}>PHONE</Text>
            {editing ? (
              <TextInput style={styles.fieldInput} value={mobile} onChangeText={setMobile} keyboardType="phone-pad" />
            ) : (
              <Text style={styles.fieldValue}>{user?.mobile || 'Not set'}</Text>
            )}
          </View>
        </View>

        {editing && (
          <View style={styles.editBtns}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => { setEditing(false); setFullName(user?.fullName || ''); setMobile(user?.mobile || ''); }}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.saveBtn, loading && { opacity: 0.6 }]} onPress={handleUpdate} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.logoutCard} onPress={handleLogout} activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flexGrow: 1, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 56, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, letterSpacing: -0.3 },
  avatarSection: { alignItems: 'center', paddingVertical: 28, backgroundColor: COLORS.white, marginBottom: 12 },
  avatar: { width: 80, height: 80, borderRadius: 24, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 12, ...SHADOWS.medium },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: '700' },
  userName: { fontSize: 20, fontWeight: '700', color: COLORS.text, marginBottom: 4, letterSpacing: -0.3 },
  userEmail: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 8 },
  roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  roleText: { fontSize: 12, fontWeight: '600', color: '#fff' },
  msgBox: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginTop: 12, padding: 12, borderRadius: 12 },
  msgText: { fontSize: 14, fontWeight: '500', flex: 1 },
  card: { backgroundColor: COLORS.white, marginHorizontal: 16, marginTop: 12, borderRadius: 16, ...SHADOWS.small, borderWidth: 1, borderColor: COLORS.borderLight, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  cardTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  editBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center' },
  field: { padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  fieldLabel: { fontSize: 11, fontWeight: '600', color: COLORS.textLight, marginBottom: 6, letterSpacing: 0.8 },
  fieldValue: { fontSize: 15, color: COLORS.text, fontWeight: '500' },
  fieldInput: { fontSize: 15, color: COLORS.text, borderBottomWidth: 1.5, borderBottomColor: COLORS.primary, paddingBottom: 4 },
  editBtns: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginTop: 12 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 14, borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center' },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: COLORS.textSecondary },
  saveBtn: { flex: 1, padding: 14, borderRadius: 14, backgroundColor: COLORS.primary, alignItems: 'center' },
  saveBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  logoutCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 16, marginTop: 20, padding: 16, borderRadius: 16, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.dangerLight },
  logoutText: { fontSize: 15, fontWeight: '600', color: COLORS.danger },
});

export default ProfileScreen;
