import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAppDispatch, useAppSelector } from '../store';
import { updateProfile, clearError } from '../store/authSlice';
import { ThemedText } from '../components/themed-text';
import { ThemedView } from '../components/themed-view';
import { Spacing, Colors } from '../constants/theme';

export default function EditProfileScreen() {
  const dispatch = useAppDispatch();
  const { user, loading, error } = useAppSelector((state) => state.auth);
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  // State inputs
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>(user?.gender || 'Male');
  const [language, setLanguage] = useState<'es' | 'en'>(user?.language || 'es');
  const [profileImage, setProfileImage] = useState(user?.profileImage || '');

  const [success, setSuccess] = useState(false);

  // Clean errors when opening screen
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  const handleSave = async () => {
    if (!fullName || !phone) return;

    dispatch(clearError());
    setSuccess(false);

    const resultAction = await dispatch(
      updateProfile({
        fullName,
        phone,
        gender,
        language,
        profileImage,
      })
    );

    if (updateProfile.fulfilled.match(resultAction)) {
      setSuccess(true);
      // Wait for a brief second to let user see success, then route back
      setTimeout(() => {
        router.back();
      }, 1200);
    }
  };

  return (
    <SafeAreaView style={[styles.mainContainer, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <ThemedText style={styles.headerTitle} type="smallBold">
              Editar Perfil
            </ThemedText>
            <View style={{ width: 44 }} /> {/* Balancing placeholder */}
          </View>

          {error && (
            <ThemedView type="backgroundElement" style={styles.alertBannerError}>
              <Ionicons name="alert-circle" size={20} color="#ff3333" />
              <ThemedText style={{ color: '#ff3333', flex: 1 }} type="small">
                {error}
              </ThemedText>
            </ThemedView>
          )}

          {success && (
            <ThemedView type="backgroundElement" style={styles.alertBannerSuccess}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <ThemedText style={{ color: '#4CAF50', flex: 1 }} type="smallBold">
                ¡Perfil guardado con éxito!
              </ThemedText>
            </ThemedView>
          )}

          {/* Form Fields */}
          <View style={styles.formFields}>
            <View style={styles.inputContainer}>
              <ThemedText style={styles.inputLabel} type="smallBold">
                Nombre Completo
              </ThemedText>
              <TextInput
                style={[styles.input, { borderColor: colors.backgroundElement, color: colors.text }]}
                placeholder="Victor Manuel Salas"
                placeholderTextColor={colors.textSecondary}
                value={fullName}
                onChangeText={setFullName}
              />
            </View>

            <View style={styles.inputContainer}>
              <ThemedText style={styles.inputLabel} type="smallBold">
                Celular
              </ThemedText>
              <TextInput
                style={[styles.input, { borderColor: colors.backgroundElement, color: colors.text }]}
                placeholder="3001234567"
                placeholderTextColor={colors.textSecondary}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputContainer}>
              <ThemedText style={styles.inputLabel} type="smallBold">
                Imagen de Perfil (URL)
              </ThemedText>
              <TextInput
                style={[styles.input, { borderColor: colors.backgroundElement, color: colors.text }]}
                placeholder="https://ejemplo.com/mi-avatar.jpg"
                placeholderTextColor={colors.textSecondary}
                value={profileImage}
                onChangeText={setProfileImage}
                autoCapitalize="none"
              />
            </View>

            {/* Gender Picker */}
            <View style={styles.inputContainer}>
              <ThemedText style={styles.inputLabel} type="smallBold">
                Género
              </ThemedText>
              <View style={styles.selectorRow}>
                {(['Male', 'Female', 'Other'] as const).map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[
                      styles.selectorItem,
                      { borderColor: colors.backgroundElement },
                      gender === g && [styles.selectorActive, { backgroundColor: colors.text, borderColor: colors.text }],
                    ]}
                    onPress={() => setGender(g)}
                  >
                    <ThemedText
                      type="small"
                      style={[
                        styles.selectorText,
                        gender === g && { color: colors.background },
                      ]}
                    >
                      {g === 'Male' ? 'Hombre' : g === 'Female' ? 'Mujer' : 'Otro'}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Language Picker */}
            <View style={styles.inputContainer}>
              <ThemedText style={styles.inputLabel} type="smallBold">
                Idioma de la App
              </ThemedText>
              <View style={styles.selectorRow}>
                {(['es', 'en'] as const).map((l) => (
                  <TouchableOpacity
                    key={l}
                    style={[
                      styles.selectorItem,
                      { borderColor: colors.backgroundElement },
                      language === l && [styles.selectorActive, { backgroundColor: colors.text, borderColor: colors.text }],
                    ]}
                    onPress={() => setLanguage(l)}
                  >
                    <ThemedText
                      type="small"
                      style={[
                        styles.selectorText,
                        language === l && { color: colors.background },
                      ]}
                    >
                      {l === 'es' ? 'Español' : 'Inglés'}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: colors.text }]}
              onPress={handleSave}
              disabled={loading || success}
            >
              {loading ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <ThemedText style={[styles.saveBtnText, { color: colors.background }]} type="smallBold">
                  Guardar Cambios
                </ThemedText>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.five,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  alertBannerError: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: 8,
    gap: Spacing.two,
    marginBottom: Spacing.three,
    borderLeftWidth: 4,
    borderLeftColor: '#ff3333',
  },
  alertBannerSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: 8,
    gap: Spacing.two,
    marginBottom: Spacing.three,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  formFields: {
    gap: Spacing.three,
  },
  inputContainer: {
    gap: Spacing.one,
  },
  inputLabel: {
    fontSize: 14,
  },
  input: {
    height: 52,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
  },
  selectorRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  selectorItem: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectorActive: {
    backgroundColor: '#000000',
  },
  selectorText: {
    fontWeight: '600',
  },
  saveBtn: {
    height: 56,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.four,
  },
  saveBtnText: {
    fontSize: 16,
  },
});
