import React, { useEffect } from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../context/AuthContext';
import AppNavigator from '../navigation/AppNavigator';
import CompletionPopup from '../components/CompletionPopup';
import NewBookingPopup from '../components/NewBookingPopup';
import CancellationPopup from '../components/CancellationPopup';

export default function App() {
  return (
    <AuthProvider>
      <View style={styles.container}>
        <StatusBar style="dark" />
        <AppNavigator />
        <CompletionPopup />
        <NewBookingPopup />
        <CancellationPopup />
      </View>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
