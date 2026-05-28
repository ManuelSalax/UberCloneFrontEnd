import React, { useEffect } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchProfile, logoutUser } from '../store/authSlice';
import { ThemedText } from '../components/themed-text';
import { ThemedView } from '../components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing, Colors } from '../constants/theme';

export default function ProfileScreen() {
  const dispatch = useAppDispatch();
  const { user, loading } = useAppSelector((state) => state.auth);
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  // Reload profile from backend whenever user opens this tab to keep it fresh
  useEffect(() => {
    dispatch(fetchProfile());
  }, [dispatch]);

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  const getGenderLabel = (g?: string) => {
    if (!g) return 'No especificado';
    if (g === 'Male') return 'Hombre';
    if (g === 'Female') return 'Mujer';
    return 'Otro';
  };

  const getLanguageLabel = (l?: string) => {
    if (!l) return 'Español';
    if (l === 'es') return 'Español (es)';
    return 'Inglés (en)';
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header Dashboard Banner */}
          <ThemedView type="backgroundElement" style={styles.profileHeaderCard}>
            <View style={styles.profileHeaderTop}>
              {user?.profileImage ? (
                <Image source={{ uri: user.profileImage }} style={styles.avatarImage} />
              ) : (
                <View style={[styles.avatarPlaceholderBg, { backgroundColor: colors.text }]}>
                  <ThemedText style={{ color: colors.background, fontSize: 24, fontWeight: '700' }}>
                    {getInitials(user?.fullName || '')}
                  </ThemedText>
                </View>
              )}
              
              <View style={styles.headerInfoText}>
                <ThemedText type="smallBold" style={styles.fullNameText}>
                  {user?.fullName || 'Cargando...'}
                </ThemedText>
                <View style={styles.activePill}>
                  <View style={styles.activeDot} />
                  <ThemedText style={{ fontSize: 11, color: '#4CAF50', fontWeight: 'bold' }}>
                    CUENTA ACTIVA
                  </ThemedText>
                </View>
              </View>
            </View>
          </ThemedView>

          {/* Account Information Section */}
          <ThemedText type="smallBold" style={styles.sectionTitle}>
            Detalles de la cuenta
          </ThemedText>

          <ThemedView type="backgroundElement" style={styles.infoCard}>
            {/* Email Row */}
            <View style={[styles.infoRow, { borderBottomColor: colors.background }]}>
              <View style={styles.infoIconCol}>
                <Ionicons name="mail-outline" size={20} color={colors.textSecondary} />
              </View>
              <View style={styles.infoTextCol}>
                <ThemedText themeColor="textSecondary" style={styles.infoLabel}>
                  Correo electrónico
                </ThemedText>
                <ThemedText type="smallBold" style={styles.infoValue}>
                  {user?.email || '-'}
                </ThemedText>
              </View>
            </View>

            {/* Phone Row */}
            <View style={[styles.infoRow, { borderBottomColor: colors.background }]}>
              <View style={styles.infoIconCol}>
                <Ionicons name="call-outline" size={20} color={colors.textSecondary} />
              </View>
              <View style={styles.infoTextCol}>
                <ThemedText themeColor="textSecondary" style={styles.infoLabel}>
                  Celular
                </ThemedText>
                <ThemedText type="smallBold" style={styles.infoValue}>
                  {user?.phone || '-'}
                </ThemedText>
              </View>
            </View>

            {/* Gender Row */}
            <View style={[styles.infoRow, { borderBottomColor: colors.background }]}>
              <View style={styles.infoIconCol}>
                <Ionicons name="people-outline" size={20} color={colors.textSecondary} />
              </View>
              <View style={styles.infoTextCol}>
                <ThemedText themeColor="textSecondary" style={styles.infoLabel}>
                  Género
                </ThemedText>
                <ThemedText type="smallBold" style={styles.infoValue}>
                  {getGenderLabel(user?.gender)}
                </ThemedText>
              </View>
            </View>

            {/* Language Row */}
            <View style={styles.infoRow}>
              <View style={styles.infoIconCol}>
                <Ionicons name="globe-outline" size={20} color={colors.textSecondary} />
              </View>
              <View style={styles.infoTextCol}>
                <ThemedText themeColor="textSecondary" style={styles.infoLabel}>
                  Idioma de preferencia
                </ThemedText>
                <ThemedText type="smallBold" style={styles.infoValue}>
                  {getLanguageLabel(user?.language)}
                </ThemedText>
              </View>
            </View>
          </ThemedView>

          {/* Actions List */}
          <ThemedText type="smallBold" style={styles.sectionTitle}>
            Configuración y Soporte
          </ThemedText>

          <View style={styles.actionList}>
            {/* Edit Profile Action */}
            <TouchableOpacity
              style={[styles.actionRow, { borderBottomColor: colors.backgroundElement }]}
              onPress={() => router.push('/edit-profile')}
            >
              <View style={styles.actionRowLeft}>
                <Ionicons name="create-outline" size={22} color={colors.text} />
                <ThemedText type="smallBold">Editar perfil</ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </TouchableOpacity>

            {/* Help Action */}
            <TouchableOpacity
              style={[styles.actionRow, { borderBottomColor: colors.backgroundElement }]}
            >
              <View style={styles.actionRowLeft}>
                <Ionicons name="help-circle-outline" size={22} color={colors.text} />
                <ThemedText type="smallBold">Ayuda y Soporte</ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </TouchableOpacity>

            {/* Terms Action */}
            <TouchableOpacity
              style={[styles.actionRow, { borderBottomColor: colors.backgroundElement }]}
            >
              <View style={styles.actionRowLeft}>
                <Ionicons name="document-text-outline" size={22} color={colors.text} />
                <ThemedText type="smallBold">Términos y Condiciones</ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Logout Button */}
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FF3B30" />
            ) : (
              <>
                <Ionicons name="log-out-outline" size={20} color="#FF3B30" style={{ marginRight: 8 }} />
                <ThemedText style={styles.logoutText} type="smallBold">
                  Cerrar Sesión
                </ThemedText>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.three,
  },
  profileHeaderCard: {
    padding: Spacing.four,
    borderRadius: 16,
    marginVertical: Spacing.one,
  },
  profileHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarPlaceholderBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfoText: {
    flex: 1,
    gap: Spacing.one - 2,
  },
  fullNameText: {
    fontSize: 20,
    fontWeight: '700',
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CAF50',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: Spacing.two,
    marginBottom: Spacing.one,
  },
  infoCard: {
    borderRadius: 16,
    padding: Spacing.three,
    gap: 0,
  },
  infoRow: {
    flexDirection: 'row',
    paddingVertical: Spacing.two + 2,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  infoIconCol: {
    width: 36,
    justifyContent: 'center',
  },
  infoTextCol: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
  },
  actionList: {
    gap: 0,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
  },
  actionRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  logoutButton: {
    height: 54,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 59, 48, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: Spacing.four,
    backgroundColor: 'rgba(255, 59, 48, 0.05)',
  },
  logoutText: {
    color: '#FF3B30',
    fontSize: 16,
  },
});
