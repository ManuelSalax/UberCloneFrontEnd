import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../store';
import {
  loadSession,
  loginUser,
  registerUser,
  clearError,
  User,
} from '../store/authSlice';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { Colors, Spacing } from '../constants/theme';

type AuthScreenState = 'welcome' | 'login' | 'register';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const { isAuthenticated, isInitialized, loading, error } = useAppSelector(
    (state) => state.auth
  );
  
  const [screenState, setScreenState] = useState<AuthScreenState>('welcome');
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  // Inputs for login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Inputs for registration
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regGender, setRegGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [regLanguage, setRegLanguage] = useState<'es' | 'en'>('es');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Attempt to restore user session on startup
  useEffect(() => {
    dispatch(loadSession());
  }, [dispatch]);

  // Clean errors when switching screens
  useEffect(() => {
    dispatch(clearError());
  }, [screenState, dispatch]);

  const handleLogin = () => {
    if (!loginEmail || !loginPassword) return;
    dispatch(loginUser({ email: loginEmail, password: loginPassword }));
  };

  const handleRegister = () => {
    if (!regFullName || !regEmail || !regPassword || !regPhone) return;
    dispatch(
      registerUser({
        fullName: regFullName,
        email: regEmail,
        password: regPassword,
        phone: regPhone,
        gender: regGender,
        language: regLanguage,
        profileImage: '',
      })
    );
  };

  // 1. Initial Load state
  if (!isInitialized) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.text} />
        <ThemedText style={{ marginTop: Spacing.two }} type="small">
          Cargando Uber Clone...
        </ThemedText>
      </View>
    );
  }

  // 2. Render children if already authenticated
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // 3. Render Auth Screens
  return (
    <SafeAreaView style={[styles.mainContainer, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {screenState === 'welcome' && (
          <View style={styles.welcomeContainer}>
            <View style={styles.logoSection}>
              <ThemedText style={styles.uberLogo} type="title">
                Uber
              </ThemedText>
              <ThemedText style={styles.uberSubtitle} type="small">
                CLONE
              </ThemedText>
            </View>

            <View style={styles.welcomeInfo}>
              <ThemedText style={styles.welcomeTitle} type="subtitle">
                Muévete con total seguridad
              </ThemedText>
              <ThemedText style={styles.welcomeDesc} themeColor="textSecondary">
                La forma más fácil y rápida de pedir un viaje en tu ciudad con un diseño prémium de vanguardia.
              </ThemedText>
            </View>

            <View style={styles.buttonSection}>
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: colors.text }]}
                onPress={() => setScreenState('login')}
              >
                <ThemedText style={[styles.buttonText, { color: colors.background }]} type="smallBold">
                  Iniciar Sesión
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.secondaryButton, { borderColor: colors.textSecondary }]}
                onPress={() => setScreenState('register')}
              >
                <ThemedText style={[styles.buttonText, { color: colors.text }]} type="smallBold">
                  Registrarse
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {(screenState === 'login' || screenState === 'register') && (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Back Button */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setScreenState('welcome')}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>

            <ThemedText style={styles.formTitle} type="subtitle">
              {screenState === 'login' ? 'Bienvenido de nuevo' : 'Crear Cuenta'}
            </ThemedText>

            {error && (
              <ThemedView type="backgroundElement" style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={20} color="#ff3333" />
                <ThemedText style={styles.errorText} type="small">
                  {error}
                </ThemedText>
              </ThemedView>
            )}

            {screenState === 'login' ? (
              /* LOGIN FORM */
              <View style={styles.formFields}>
                <View style={styles.inputContainer}>
                  <ThemedText style={styles.inputLabel} type="smallBold">
                    Correo Electrónico
                  </ThemedText>
                  <TextInput
                    style={[styles.input, { borderColor: colors.backgroundElement, color: colors.text }]}
                    placeholder="ejemplo@correo.com"
                    placeholderTextColor={colors.textSecondary}
                    value={loginEmail}
                    onChangeText={setLoginEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <ThemedText style={styles.inputLabel} type="smallBold">
                    Contraseña
                  </ThemedText>
                  <View style={styles.passwordWrapper}>
                    <TextInput
                      style={[styles.input, styles.passwordInput, { borderColor: colors.backgroundElement, color: colors.text }]}
                      placeholder="Ingresa tu contraseña"
                      placeholderTextColor={colors.textSecondary}
                      value={loginPassword}
                      onChangeText={setLoginPassword}
                      secureTextEntry={!showLoginPassword}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      style={styles.eyeIcon}
                      onPress={() => setShowLoginPassword(!showLoginPassword)}
                    >
                      <Ionicons
                        name={showLoginPassword ? 'eye-off' : 'eye'}
                        size={20}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.primaryButton, styles.submitBtn, { backgroundColor: colors.text }]}
                  onPress={handleLogin}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.background} />
                  ) : (
                    <ThemedText style={[styles.buttonText, { color: colors.background }]} type="smallBold">
                      Ingresar
                    </ThemedText>
                  )}
                </TouchableOpacity>

                <View style={styles.switchView}>
                  <ThemedText type="small" themeColor="textSecondary">
                    ¿No tienes una cuenta?{' '}
                  </ThemedText>
                  <TouchableOpacity onPress={() => setScreenState('register')}>
                    <ThemedText type="smallBold" style={{ textDecorationLine: 'underline' }}>
                      Regístrate
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              /* REGISTER FORM */
              <View style={styles.formFields}>
                <View style={styles.inputContainer}>
                  <ThemedText style={styles.inputLabel} type="smallBold">
                    Nombre Completo
                  </ThemedText>
                  <TextInput
                    style={[styles.input, { borderColor: colors.backgroundElement, color: colors.text }]}
                    placeholder="Victor Manuel Salas"
                    placeholderTextColor={colors.textSecondary}
                    value={regFullName}
                    onChangeText={setRegFullName}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <ThemedText style={styles.inputLabel} type="smallBold">
                    Correo Electrónico
                  </ThemedText>
                  <TextInput
                    style={[styles.input, { borderColor: colors.backgroundElement, color: colors.text }]}
                    placeholder="ejemplo@correo.com"
                    placeholderTextColor={colors.textSecondary}
                    value={regEmail}
                    onChangeText={setRegEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <ThemedText style={styles.inputLabel} type="smallBold">
                    Contraseña
                  </ThemedText>
                  <View style={styles.passwordWrapper}>
                    <TextInput
                      style={[styles.input, styles.passwordInput, { borderColor: colors.backgroundElement, color: colors.text }]}
                      placeholder="Mínimo 6 caracteres"
                      placeholderTextColor={colors.textSecondary}
                      value={regPassword}
                      onChangeText={setRegPassword}
                      secureTextEntry={!showRegPassword}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      style={styles.eyeIcon}
                      onPress={() => setShowRegPassword(!showRegPassword)}
                    >
                      <Ionicons
                        name={showRegPassword ? 'eye-off' : 'eye'}
                        size={20}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <ThemedText style={styles.inputLabel} type="smallBold">
                    Celular
                  </ThemedText>
                  <TextInput
                    style={[styles.input, { borderColor: colors.backgroundElement, color: colors.text }]}
                    placeholder="3001234567"
                    placeholderTextColor={colors.textSecondary}
                    value={regPhone}
                    onChangeText={setRegPhone}
                    keyboardType="phone-pad"
                  />
                </View>

                {/* Gender Picker */}
                <View style={styles.inputContainer}>
                  <ThemedText style={styles.inputLabel} type="smallBold">
                    Género
                  </ThemedText>
                  <View style={styles.selectorRow}>
                    {(['Male', 'Female', 'Other'] as const).map((gender) => (
                      <TouchableOpacity
                        key={gender}
                        style={[
                          styles.selectorItem,
                          { borderColor: colors.backgroundElement },
                          regGender === gender && [styles.selectorActive, { backgroundColor: colors.text, borderColor: colors.text }],
                        ]}
                        onPress={() => setRegGender(gender)}
                      >
                        <ThemedText
                          type="small"
                          style={[
                            styles.selectorText,
                            regGender === gender && { color: colors.background },
                          ]}
                        >
                          {gender === 'Male' ? 'Hombre' : gender === 'Female' ? 'Mujer' : 'Otro'}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Language Picker */}
                <View style={styles.inputContainer}>
                  <ThemedText style={styles.inputLabel} type="smallBold">
                    Idioma
                  </ThemedText>
                  <View style={styles.selectorRow}>
                    {(['es', 'en'] as const).map((lang) => (
                      <TouchableOpacity
                        key={lang}
                        style={[
                          styles.selectorItem,
                          { borderColor: colors.backgroundElement },
                          regLanguage === lang && [styles.selectorActive, { backgroundColor: colors.text, borderColor: colors.text }],
                        ]}
                        onPress={() => setRegLanguage(lang)}
                      >
                        <ThemedText
                          type="small"
                          style={[
                            styles.selectorText,
                            regLanguage === lang && { color: colors.background },
                          ]}
                        >
                          {lang === 'es' ? 'Español' : 'Inglés'}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.primaryButton, styles.submitBtn, { backgroundColor: colors.text }]}
                  onPress={handleRegister}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.background} />
                  ) : (
                    <ThemedText style={[styles.buttonText, { color: colors.background }]} type="smallBold">
                      Registrarse ahora
                    </ThemedText>
                  )}
                </TouchableOpacity>

                <View style={styles.switchView}>
                  <ThemedText type="small" themeColor="textSecondary">
                    ¿Ya tienes una cuenta?{' '}
                  </ThemedText>
                  <TouchableOpacity onPress={() => setScreenState('login')}>
                    <ThemedText type="smallBold" style={{ textDecorationLine: 'underline' }}>
                      Inicia Sesión
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeContainer: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    justifyContent: 'space-between',
    paddingVertical: Spacing.five,
  },
  logoSection: {
    marginTop: Spacing.six,
    alignItems: 'center',
  },
  uberLogo: {
    fontSize: 54,
    fontWeight: '800',
    letterSpacing: -2,
    lineHeight: 58,
  },
  uberSubtitle: {
    letterSpacing: 6,
    fontSize: 12,
    fontWeight: '700',
    marginTop: -4,
  },
  welcomeInfo: {
    gap: Spacing.two,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
  },
  welcomeDesc: {
    fontSize: 16,
    lineHeight: 22,
  },
  buttonSection: {
    gap: Spacing.two,
  },
  primaryButton: {
    height: 56,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  secondaryButton: {
    height: 56,
    borderRadius: 8,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  buttonText: {
    fontSize: 16,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.five,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginBottom: Spacing.three,
  },
  formTitle: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: Spacing.three,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: 8,
    gap: Spacing.two,
    marginBottom: Spacing.three,
    borderLeftWidth: 4,
    borderLeftColor: '#ff3333',
  },
  errorText: {
    color: '#ff3333',
    flex: 1,
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
  passwordWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  passwordInput: {
    width: '100%',
    paddingRight: 50,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    height: '100%',
    justifyContent: 'center',
  },
  submitBtn: {
    marginTop: Spacing.three,
  },
  switchView: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.two,
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
});
