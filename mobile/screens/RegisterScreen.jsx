import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { COLORS, SHADOWS } from '../utils/theme';

const RegisterScreen = ({ navigation }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuth();

  const handleRegister = async () => {
    if (!fullName || !email || !phone || !password || !confirmPassword) {
      setError('Please fill all fields');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await register({ fullName, email, mobile: phone, password, confirmPassword });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color={COLORS.text} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Sign up to get started with ARANCO</Text>
        </View>

        {error ? <View style={styles.errorBox}><Ionicons name="alert-circle" size={18} color={COLORS.danger} /><Text style={styles.errorText}>{error}</Text></View> : null}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full Name</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="person-outline" size={18} color={COLORS.textLight} style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="Enter your full name" placeholderTextColor={COLORS.textLight} value={fullName} onChangeText={setFullName} autoCapitalize="words" />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email Address</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="mail-outline" size={18} color={COLORS.textLight} style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="Enter your email" placeholderTextColor={COLORS.textLight} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone Number</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="call-outline" size={18} color={COLORS.textLight} style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="Enter your phone number" placeholderTextColor={COLORS.textLight} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="lock-closed-outline" size={18} color={COLORS.textLight} style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="Create a password" placeholderTextColor={COLORS.textLight} value={password} onChangeText={setPassword} secureTextEntry={!showPassword} />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
              <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={18} color={COLORS.textLight} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Confirm Password</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="lock-closed-outline" size={18} color={COLORS.textLight} style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="Re-enter password" placeholderTextColor={COLORS.textLight} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showPassword} />
          </View>
        </View>

        <TouchableOpacity style={[styles.button, loading && { opacity: 0.6 }]} onPress={handleRegister} disabled={loading} activeOpacity={0.8}>
          {loading ? <ActivityIndicator color="#fff" /> : <><Text style={styles.buttonText}>Create Account</Text><Ionicons name="arrow-forward" size={18} color="#fff" /></>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.loginBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Text style={styles.loginText}>Already have an account? <Text style={{ fontWeight: '700', color: COLORS.primary }}>Sign In</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  scroll: { flexGrow: 1, padding: 24 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: COLORS.border },
  header: { marginBottom: 28 },
  title: { fontSize: 28, fontWeight: '700', color: COLORS.text, marginBottom: 4, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: COLORS.textSecondary },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.dangerLight, padding: 12, borderRadius: 12, marginBottom: 16 },
  errorText: { color: COLORS.danger, fontSize: 14, flex: 1 },
  inputGroup: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 8 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bg, borderRadius: 14, borderWidth: 1.5, borderColor: COLORS.border },
  inputIcon: { marginLeft: 14 },
  input: { flex: 1, padding: 14, fontSize: 15, color: COLORS.text },
  eyeBtn: { padding: 14 },
  button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.primary, padding: 16, borderRadius: 14, marginTop: 8, ...SHADOWS.medium },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  loginBtn: { padding: 16, alignItems: 'center', marginTop: 4 },
  loginText: { fontSize: 14, color: COLORS.textSecondary },
});

export default RegisterScreen;
