import React from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  Platform,
  useColorScheme,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '../components/themed-text';
import { ThemedView } from '../components/themed-view';
import { Collapsible } from '../components/ui/collapsible';
import { BottomTabInset, MaxContentWidth, Spacing, Colors } from '../constants/theme';
import { useTheme } from '../hooks/use-theme';

export default function ExploreScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
  };
  const theme = useTheme();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const services = [
    { id: '1', title: 'UberX', desc: 'Viajes cotidianos asequibles', icon: 'car-outline' },
    { id: '2', title: 'Uber Comfort', desc: 'Autos nuevos con choferes top', icon: 'sparkles-outline' },
    { id: '3', title: 'Uber Black', desc: 'Vehículos de lujo prémium', icon: 'ribbon-outline' },
    { id: '4', title: 'Uber Flash / Envío', desc: 'Envía paquetes en minutos', icon: 'paper-plane-outline' },
    { id: '5', title: 'Uber Moto', desc: 'Esquiva el tráfico rápido', icon: 'bicycle-outline' },
    { id: '6', title: 'Reserva anticipada', desc: 'Agenda viajes hasta con 30 días', icon: 'time-outline' },
  ];

  const contentPlatformStyle = Platform.select({
    android: {
      paddingTop: insets.top,
      paddingLeft: insets.left,
      paddingRight: insets.right,
      paddingBottom: insets.bottom,
    },
    web: {
      paddingTop: Spacing.six,
      paddingBottom: Spacing.four,
    },
    ios: {
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
    }
  });

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentInset={insets}
      contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}
      showsVerticalScrollIndicator={false}
    >
      <ThemedView style={styles.container}>
        {/* Title Header */}
        <View style={styles.titleContainer}>
          <ThemedText type="subtitle" style={styles.mainTitle}>
            Explorar Servicios
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.mainDesc}>
            Encuentra todos los servicios de transporte, logística y beneficios exclusivos que Uber Clone tiene para ti.
          </ThemedText>
        </View>

        {/* Promo Banner Card */}
        <ThemedView type="backgroundElement" style={styles.promoCard}>
          <View style={styles.promoContent}>
            <View style={styles.promoBadge}>
              <ThemedText style={styles.promoBadgeText} type="smallBold">
                PROMO
              </ThemedText>
            </View>
            <ThemedText type="smallBold" style={styles.promoTitle}>
              Consigue 20% de descuento en tu primer viaje Comfort
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.promoDesc}>
              Viaja en vehículos espaciosos y silenciosos con conductores altamente calificados.
            </ThemedText>
          </View>
          <View style={[styles.promoIconBg, { backgroundColor: colors.text }]}>
            <Ionicons name="sparkles" size={24} color={colors.background} />
          </View>
        </ThemedView>

        {/* Services List / Grid */}
        <ThemedText type="smallBold" style={styles.sectionHeader}>
          Todos los servicios
        </ThemedText>

        <View style={styles.servicesGrid}>
          {services.map((service) => (
            <ThemedView
              key={service.id}
              type="backgroundElement"
              style={styles.serviceCard}
            >
              <View style={[styles.serviceIconContainer, { backgroundColor: colors.background }]}>
                <Ionicons name={service.icon as any} size={24} color={colors.text} />
              </View>
              <View style={styles.serviceTextContainer}>
                <ThemedText type="smallBold">{service.title}</ThemedText>
                <ThemedText style={styles.serviceDesc} themeColor="textSecondary">
                  {service.desc}
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </ThemedView>
          ))}
        </View>

        {/* Dynamic Interactive Collapsibles */}
        <ThemedText type="smallBold" style={styles.sectionHeader}>
          Preguntas frecuentes y Seguridad
        </ThemedText>

        <View style={styles.sectionsWrapper}>
          <Collapsible title="¿Cómo reservo un viaje con anticipación?">
            <ThemedText type="small" style={styles.collapsibleText}>
              Puedes agendar un viaje seleccionando el icono de &quot;Reservar&quot; en la pantalla de inicio. Configura tu fecha y hora de salida hasta con 30 días de anticipación. Te asignaremos un conductor prioritario y te notificaremos cuando esté en camino.
            </ThemedText>
          </Collapsible>

          <Collapsible title="Medidas de seguridad durante tus viajes">
            <ThemedText type="small" style={styles.collapsibleText}>
              Tu seguridad es nuestra prioridad. Cada viaje incluye herramientas integradas como: compartir tu viaje con contactos de confianza en tiempo real, verificación por PIN de 4 dígitos para asegurar que abordas el auto correcto, y acceso directo a asistencia de emergencia.
            </ThemedText>
          </Collapsible>

          <Collapsible title="Ventajas de la suscripción Uber One">
            <ThemedText type="small" style={styles.collapsibleText}>
              Con Uber One, disfrutas de entregas sin costo de envío en pedidos seleccionados de restaurantes y supermercados, hasta un 5% de descuento en viajes de Uber calificados, y soporte prioritario 24/7 con los conductores mejores valorados de la red.
            </ThemedText>
          </Collapsible>
        </View>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  container: {
    maxWidth: MaxContentWidth,
    flexGrow: 1,
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  titleContainer: {
    gap: Spacing.one,
    paddingVertical: Spacing.three,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  mainDesc: {
    fontSize: 14,
    lineHeight: 20,
  },
  promoCard: {
    flexDirection: 'row',
    padding: Spacing.three,
    borderRadius: 16,
    alignItems: 'center',
    gap: Spacing.three,
    marginVertical: Spacing.one,
  },
  promoContent: {
    flex: 1,
    gap: Spacing.one,
  },
  promoBadge: {
    backgroundColor: '#FF3D00',
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: 4,
  },
  promoBadgeText: {
    fontSize: 10,
    color: '#FFFFFF',
  },
  promoTitle: {
    fontSize: 15,
    lineHeight: 20,
  },
  promoDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  promoIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: Spacing.two,
    marginBottom: Spacing.one,
  },
  servicesGrid: {
    gap: Spacing.two,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: 12,
    gap: Spacing.three,
  },
  serviceIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceTextContainer: {
    flex: 1,
    gap: 2,
  },
  serviceDesc: {
    fontSize: 12,
  },
  sectionsWrapper: {
    gap: Spacing.two,
    marginBottom: Spacing.four,
  },
  collapsibleText: {
    lineHeight: 20,
    marginTop: Spacing.one,
  },
});
