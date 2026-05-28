import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Platform,
  useColorScheme,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { useAppSelector } from '../store';
import api from '../services/api';
import { ThemedText } from '../components/themed-text';
import { ThemedView } from '../components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing, Colors } from '../constants/theme';

type ActiveCategory = 'ride' | 'package' | 'reserve' | 'transit';

interface MockDriver {
  id: string;
  name: string;
  distance: string;
  rating: string;
  price: string;
  vehicleType: 'Economy' | 'XL' | 'Premium';
  rawFare: number;
}

export default function HomeScreen() {
  const { user } = useAppSelector((state) => state.auth);
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  // Active Category State
  const [activeCategory, setActiveCategory] = useState<ActiveCategory>('ride');

  // Package section states
  const [packageType, setPackageType] = useState<'send' | 'receive'>('send');
  const [packageSize, setPackageSize] = useState<'small' | 'medium'>('small');

  // Reserve section states
  const [reserveDate, setReserveDate] = useState('Mañana, 29 de Mayo');
  const [reserveTime, setReserveTime] = useState('08:30 AM');
  const [isReserving, setIsReserving] = useState(false);
  const [reserveSuccess, setReserveSuccess] = useState(false);

  // Transit section states
  const [transitDestination, setTransitDestination] = useState('');

  // PAYMENT & BOOKING INTEGRATION STATES
  const [selectedDriver, setSelectedDriver] = useState<MockDriver | null>(null);
  const [checkoutVisible, setCheckoutVisible] = useState(false);
  const [bookingStep, setBookingStep] = useState<'idle' | 'creating_trip' | 'creating_payment' | 'ready'>('idle');
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [createdTripId, setCreatedTripId] = useState<string | null>(null);

  // Greeting based on time
  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return 'Buenos días';
    if (hours < 18) return 'Buenas tardes';
    return 'Buenas noches';
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

  const categories = [
    { id: 'ride', label: 'Viaje', icon: 'car-sport' },
    { id: 'package', label: 'Paquete', icon: 'cube' },
    { id: 'reserve', label: 'Reservar', icon: 'calendar' },
    { id: 'transit', label: 'Tránsito', icon: 'train' },
  ];

  const recentDestinations = [
    { id: '1', title: 'Trabajo', subtitle: 'Avenida El Dorado #68c-10', icon: 'briefcase' },
    { id: '2', title: 'Centro Comercial Andino', subtitle: 'Carrera 11 #82-71', icon: 'cart' },
    { id: '3', title: 'Aeropuerto El Dorado', subtitle: 'Muelle Internacional T1', icon: 'airplane' },
  ];

  const mockDrivers: MockDriver[] = [
    { id: '1', name: 'Carlos (UberX)', distance: '2 min de distancia', rating: '4.9 ★', price: '$12,500', vehicleType: 'Economy', rawFare: 12500 },
    { id: '2', name: 'Laura (Comfort)', distance: '4 min de distancia', rating: '4.8 ★', price: '$15,800', vehicleType: 'XL', rawFare: 15800 },
    { id: '3', name: 'Diego (Uber Black)', distance: '6 min de distancia', rating: '5.0 ★', price: '$24,000', vehicleType: 'Premium', rawFare: 24000 },
  ];

  const handleConfirmReservation = () => {
    setIsReserving(true);
    setTimeout(() => {
      setIsReserving(false);
      setReserveSuccess(true);
      setTimeout(() => {
        setReserveSuccess(false);
      }, 3000);
    }, 1500);
  };

  // REAL BACKEND TRIP BOOKING & MERCADO PAGO INTEGRATION
  const handleInitiateBooking = async () => {
    if (!selectedDriver) return;

    try {
      setBookingError(null);
      setBookingStep('creating_trip');

      // 1. Create a real Trip in backend MongoDB
      const tripResponse = await api.post('/trips', {
        pickupLocation: 'Mi Ubicación Actual',
        destinationLocation: 'Aeropuerto El Dorado (Muelle T1)',
        pickupCoordinates: { latitude: 4.711, longitude: -74.0721 },
        destinationCoordinates: { latitude: 4.701, longitude: -74.0821 },
        vehicleType: selectedDriver.vehicleType,
      });

      const tripData = tripResponse.data.trip;
      const tripId = tripData._id;
      setCreatedTripId(tripId);

      setBookingStep('creating_payment');

      // 2. Create the Mercado Pago payment preference
      const paymentResponse = await api.post('/payments/create', {
        tripId: tripId,
      });

      const { initPoint, sandboxInitPoint } = paymentResponse.data;
      const checkoutUrl = initPoint || sandboxInitPoint;

      setBookingStep('ready');

      // 3. Open the secure Mercado Pago checkout screen inside a Native / Web browser sheet!
      if (checkoutUrl) {
        const result = await WebBrowser.openBrowserAsync(checkoutUrl);
        
        // When the WebBrowser finishes/closes, verify payment status with backend
        setBookingStep('creating_payment');
        setTimeout(async () => {
          try {
            const tripDetails = await api.get(`/trips/${tripId}`);
            if (tripDetails.data.trip.status === 'Completed') {
              setPaymentSuccess(true);
              setCheckoutVisible(false);
              setSelectedDriver(null);
              setTimeout(() => setPaymentSuccess(false), 5000);
            } else {
              // Simulated Fallback check
              setBookingError('La pasarela de pago aún está pendiente. Simula la transacción para completar tu viaje.');
              setBookingStep('idle');
            }
          } catch (e) {
            // Treat as pending
            setBookingError('La pasarela de pago aún está pendiente. Simula la transacción para completar tu viaje.');
            setBookingStep('idle');
          }
        }, 1500);
      }
    } catch (err: any) {
      console.error('Booking or Payment initiation error:', err);
      const msg = err.response?.data?.message || 'Error al iniciar la pasarela de pagos. Por favor intenta de nuevo.';
      setBookingError(msg);
      setBookingStep('idle');
    }
  };

  const handleSelectDriver = (driver: MockDriver) => {
    setSelectedDriver(driver);
    setBookingStep('idle');
    setBookingError(null);
    setCheckoutVisible(true);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <ThemedText type="small" themeColor="textSecondary">
                {getGreeting()},
              </ThemedText>
              <ThemedText style={styles.userName} type="subtitle">
                {user?.fullName || 'Usuario'} 👋
              </ThemedText>
            </View>

            {/* Profile Avatar Badge */}
            {user?.profileImage ? (
              <Image source={{ uri: user.profileImage }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.text }]}>
                <ThemedText style={{ color: colors.background, fontWeight: '700' }} type="small">
                  {getInitials(user?.fullName || '')}
                </ThemedText>
              </View>
            )}
          </View>

          {/* Quick Categories Bar */}
          <View style={styles.categoryGrid}>
            {categories.map((cat) => {
              const isActive = activeCategory === cat.id;
              const bgColor = isActive ? colors.text : colors.backgroundElement;
              const textClr = isActive ? colors.background : colors.text;

              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.categoryCard, { backgroundColor: bgColor }]}
                  activeOpacity={0.8}
                  onPress={() => setActiveCategory(cat.id as ActiveCategory)}
                >
                  <View style={styles.categoryIconWrapper}>
                    <Ionicons name={cat.icon as any} size={26} color={textClr} />
                  </View>
                  <ThemedText
                    type="smallBold"
                    style={[styles.categoryLabel, { color: textClr }]}
                  >
                    {cat.label}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </View>

          {paymentSuccess && (
            <ThemedView type="backgroundElement" style={styles.alertSuccessGlobal}>
              <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
              <View style={{ flex: 1 }}>
                <ThemedText type="smallBold" style={{ color: '#4CAF50' }}>
                  ¡Viaje agendado y Pagado con Éxito!
                </ThemedText>
                <ThemedText style={{ color: '#4CAF50', fontSize: 12 }}>
                  Tu conductor está en camino. Puedes monitorearlo en el mapa en vivo.
                </ThemedText>
              </View>
            </ThemedView>
          )}

          {/* DYNAMIC VIEW CONTENT BASED ON ACTIVE CATEGORY */}

          {activeCategory === 'ride' && (
            /* =======================================
               VIAJE (RIDE) SUB-VIEW 
               ======================================= */
            <View style={styles.tabContentWrapper}>
              {/* "Where to?" Search Card */}
              <View style={[styles.searchCard, { backgroundColor: colors.backgroundElement }]}>
                <Ionicons name="search" size={22} color={colors.text} style={styles.searchIcon} />
                <TextInput
                  style={[styles.searchInput, { color: colors.text }]}
                  placeholder="¿A dónde vamos?"
                  placeholderTextColor={colors.textSecondary}
                  editable={false}
                />
                <View style={[styles.nowBadge, { backgroundColor: colors.background }]}>
                  <Ionicons name="time" size={16} color={colors.text} />
                  <ThemedText type="smallBold" style={styles.nowText}>
                    Ahora
                  </ThemedText>
                  <Ionicons name="chevron-down" size={14} color={colors.text} />
                </View>
              </View>

              {/* Real-time Map Visual Overlay */}
              <View style={[styles.mapContainer, { borderColor: colors.backgroundElement }]}>
                <ThemedView type="backgroundSelected" style={styles.mockMapBackground}>
                  <View style={styles.mapGridLineH1} />
                  <View style={styles.mapGridLineH2} />
                  <View style={styles.mapGridLineV1} />
                  <View style={styles.mapGridLineV2} />
                  
                  <View style={[styles.userMapPin, { backgroundColor: colors.text }]}>
                    <View style={styles.userMapPinInner} />
                  </View>

                  <View style={[styles.driverPin, { top: '25%', left: '20%' }]}>
                    <Ionicons name="car-sport" size={18} color="#000000" />
                  </View>
                  <View style={[styles.driverPin, { top: '65%', left: '75%' }]}>
                    <Ionicons name="car-sport" size={18} color="#000000" />
                  </View>
                  <View style={[styles.driverPin, { top: '40%', left: '80%' }]}>
                    <Ionicons name="car-sport" size={18} color="#000000" />
                  </View>

                  <View style={styles.mapFloatingHeader}>
                    <ThemedText type="smallBold" style={styles.mapTitle}>
                      Conductores en tiempo real
                    </ThemedText>
                    <View style={styles.liveIndicator}>
                      <View style={styles.liveDot} />
                      <ThemedText style={{ fontSize: 9, color: '#4CAF50', fontWeight: 'bold' }}>
                        EN VIVO
                      </ThemedText>
                    </View>
                  </View>
                </ThemedView>
              </View>

              {/* Suggested Fares */}
              <View style={styles.sectionHeader}>
                <ThemedText type="smallBold" style={styles.sectionTitle}>
                  Tarifas sugeridas cerca de ti
                </ThemedText>
              </View>

              <View style={styles.driverList}>
                {mockDrivers.map((driver) => (
                  <TouchableOpacity
                    key={driver.id}
                    onPress={() => handleSelectDriver(driver)}
                  >
                    <ThemedView
                      type="backgroundElement"
                      style={styles.driverRow}
                    >
                      <View style={driver.id === selectedDriver?.id ? styles.driverActiveBorder : null} />
                      <View style={styles.driverRowLeft}>
                        <View style={[styles.driverIconBg, { backgroundColor: colors.background }]}>
                          <Ionicons name="car-sport" size={22} color={colors.text} />
                        </View>
                        <View>
                          <ThemedText type="smallBold">{driver.name}</ThemedText>
                          <View style={styles.driverMetaRow}>
                            <ThemedText style={styles.driverDistance} themeColor="textSecondary">
                              {driver.distance}
                            </ThemedText>
                            <ThemedText style={styles.driverRating}>
                              {driver.rating}
                            </ThemedText>
                          </View>
                        </View>
                      </View>
                      <ThemedText type="smallBold" style={styles.driverPrice}>
                        {driver.price}
                      </ThemedText>
                    </ThemedView>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Recent Travels */}
              <View style={styles.sectionHeader}>
                <ThemedText type="smallBold" style={styles.sectionTitle}>
                  Viajes recientes
                </ThemedText>
              </View>

              <View style={styles.recentList}>
                {recentDestinations.map((dest) => (
                  <TouchableOpacity
                    key={dest.id}
                    style={[styles.recentRow, { borderBottomColor: colors.backgroundElement }]}
                  >
                    <View style={styles.recentRowLeft}>
                      <View style={[styles.recentIconBg, { backgroundColor: colors.backgroundElement }]}>
                        <Ionicons name={dest.icon as any} size={18} color={colors.text} />
                      </View>
                      <View style={styles.recentTextContainer}>
                        <ThemedText type="smallBold">{dest.title}</ThemedText>
                        <ThemedText style={styles.recentSubtitle} themeColor="textSecondary">
                          {dest.subtitle}
                        </ThemedText>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {activeCategory === 'package' && (
            /* =======================================
               PAQUETE (PACKAGE) SUB-VIEW
               ======================================= */
            <View style={styles.tabContentWrapper}>
              <ThemedView type="backgroundElement" style={styles.featureHighlightCard}>
                <View style={styles.featureLeftInfo}>
                  <ThemedText type="smallBold" style={styles.featureTitle}>
                    Uber Flash
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.featureDesc}>
                    Envía o recibe llaves, regalos, documentos y más, sin salir de tu ubicación.
                  </ThemedText>
                </View>
                <View style={[styles.featureIconContainer, { backgroundColor: colors.background }]}>
                  <Ionicons name="cube-outline" size={32} color={colors.text} />
                </View>
              </ThemedView>

              {/* Send / Receive Toggle */}
              <View style={styles.toggleRow}>
                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
                    { borderColor: colors.backgroundElement },
                    packageType === 'send' && [styles.toggleActive, { backgroundColor: colors.text, borderColor: colors.text }],
                  ]}
                  onPress={() => setPackageType('send')}
                >
                  <Ionicons name="arrow-up-circle" size={18} color={packageType === 'send' ? colors.background : colors.text} />
                  <ThemedText
                    type="smallBold"
                    style={[styles.toggleBtnText, { color: packageType === 'send' ? colors.background : colors.text }]}
                  >
                    Enviar
                  </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
                    { borderColor: colors.backgroundElement },
                    packageType === 'receive' && [styles.toggleActive, { backgroundColor: colors.text, borderColor: colors.text }],
                  ]}
                  onPress={() => setPackageType('receive')}
                >
                  <Ionicons name="arrow-down-circle" size={18} color={packageType === 'receive' ? colors.background : colors.text} />
                  <ThemedText
                    type="smallBold"
                    style={[styles.toggleBtnText, { color: packageType === 'receive' ? colors.background : colors.text }]}
                  >
                    Recibir
                  </ThemedText>
                </TouchableOpacity>
              </View>

              {/* Package Details Form */}
              <ThemedText type="smallBold" style={styles.sectionTitle}>
                Tamaño del paquete
              </ThemedText>

              <View style={styles.packageSizeGrid}>
                <TouchableOpacity
                  style={[
                    styles.sizeCard,
                    { borderColor: colors.backgroundElement },
                    packageSize === 'small' && [styles.sizeCardActive, { borderColor: colors.text, borderWidth: 2 }],
                  ]}
                  onPress={() => setPackageSize('small')}
                >
                  <Ionicons name="mail" size={24} color={colors.text} />
                  <View style={{ flex: 1 }}>
                    <ThemedText type="smallBold">Pequeño</ThemedText>
                    <ThemedText style={styles.sizeCardSubText} themeColor="textSecondary">
                      Cabe en una mochila (ej. llaves, documentos)
                    </ThemedText>
                  </View>
                  <ThemedText type="smallBold" style={styles.sizePrice}>
                    $6,000
                  </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.sizeCard,
                    { borderColor: colors.backgroundElement },
                    packageSize === 'medium' && [styles.sizeCardActive, { borderColor: colors.text, borderWidth: 2 }],
                  ]}
                  onPress={() => setPackageSize('medium')}
                >
                  <Ionicons name="cube" size={24} color={colors.text} />
                  <View style={{ flex: 1 }}>
                    <ThemedText type="smallBold">Mediano</ThemedText>
                    <ThemedText style={styles.sizeCardSubText} themeColor="textSecondary">
                      Cabe en el maletero (ej. cajas, ropa, comida)
                    </ThemedText>
                  </View>
                  <ThemedText type="smallBold" style={styles.sizePrice}>
                    $10,500
                  </ThemedText>
                </TouchableOpacity>
              </View>

              {/* How it works Stepper */}
              <ThemedText type="smallBold" style={styles.sectionTitle}>
                ¿Cómo funciona?
              </ThemedText>
              
              <ThemedView type="backgroundElement" style={styles.stepperContainer}>
                <View style={styles.stepRow}>
                  <View style={[styles.stepCircle, { backgroundColor: colors.text }]}>
                    <ThemedText style={{ color: colors.background }} type="smallBold">1</ThemedText>
                  </View>
                  <View style={styles.stepTextWrapper}>
                    <ThemedText type="smallBold">Prepara tu paquete</ThemedText>
                    <ThemedText style={styles.stepSub} themeColor="textSecondary">
                      Sella bien el contenido y escribe claramente los datos de entrega.
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.stepConnector} />

                <View style={styles.stepRow}>
                  <View style={[styles.stepCircle, { backgroundColor: colors.text }]}>
                    <ThemedText style={{ color: colors.background }} type="smallBold">2</ThemedText>
                  </View>
                  <View style={styles.stepTextWrapper}>
                    <ThemedText type="smallBold">El conductor lo recoge</ThemedText>
                    <ThemedText style={styles.stepSub} themeColor="textSecondary">
                      Un socio de entrega llegará directamente a tu puerta por el paquete.
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.stepConnector} />

                <View style={styles.stepRow}>
                  <View style={[styles.stepCircle, { backgroundColor: colors.text }]}>
                    <ThemedText style={{ color: colors.background }} type="smallBold">3</ThemedText>
                  </View>
                  <View style={styles.stepTextWrapper}>
                    <ThemedText type="smallBold">Entrega en tiempo real</ThemedText>
                    <ThemedText style={styles.stepSub} themeColor="textSecondary">
                      Comparte el enlace de seguimiento con el destinatario para monitorear el viaje.
                    </ThemedText>
                  </View>
                </View>
              </ThemedView>

              <TouchableOpacity style={[styles.actionSubmitBtn, { backgroundColor: colors.text }]}>
                <ThemedText style={[styles.actionSubmitText, { color: colors.background }]} type="smallBold">
                  Confirmar Envío Express
                </ThemedText>
              </TouchableOpacity>
            </View>
          )}

          {activeCategory === 'reserve' && (
            /* =======================================
               RESERVAR (RESERVE) SUB-VIEW
               ======================================= */
            <View style={styles.tabContentWrapper}>
              <ThemedView type="backgroundElement" style={styles.featureHighlightCard}>
                <View style={styles.featureLeftInfo}>
                  <ThemedText type="smallBold" style={styles.featureTitle}>
                    Uber Reserve
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.featureDesc}>
                    Reserva tu viaje con anticipación y disfruta de total tranquilidad con conductor prioritario.
                  </ThemedText>
                </View>
                <View style={[styles.featureIconContainer, { backgroundColor: colors.background }]}>
                  <Ionicons name="calendar-outline" size={32} color={colors.text} />
                </View>
              </ThemedView>

              {reserveSuccess && (
                <ThemedView type="backgroundElement" style={styles.alertSuccess}>
                  <Ionicons name="checkmark-circle" size={22} color="#4CAF50" />
                  <ThemedText style={{ color: '#4CAF50', flex: 1 }} type="smallBold">
                    ¡Reserva agendada con éxito! Te avisaremos cuando tu conductor esté asignado.
                  </ThemedText>
                </ThemedView>
              )}

              {/* Selector Row */}
              <ThemedText type="smallBold" style={styles.sectionTitle}>
                Configurar fecha y hora de recogida
              </ThemedText>

              <ThemedView type="backgroundElement" style={styles.selectorCardGrid}>
                {/* Date Selector */}
                <TouchableOpacity style={[styles.pickerRow, { borderBottomColor: colors.background }]}>
                  <Ionicons name="calendar" size={20} color={colors.textSecondary} />
                  <View style={{ flex: 1 }}>
                    <ThemedText themeColor="textSecondary" style={{ fontSize: 11 }}>Fecha del Viaje</ThemedText>
                    <ThemedText type="smallBold">{reserveDate}</ThemedText>
                  </View>
                  <Ionicons name="pencil" size={16} color={colors.textSecondary} />
                </TouchableOpacity>

                {/* Time Selector */}
                <TouchableOpacity style={styles.pickerRow}>
                  <Ionicons name="time" size={20} color={colors.textSecondary} />
                  <View style={{ flex: 1 }}>
                    <ThemedText themeColor="textSecondary" style={{ fontSize: 11 }}>Hora de Recogida</ThemedText>
                    <ThemedText type="smallBold">{reserveTime}</ThemedText>
                  </View>
                  <Ionicons name="pencil" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              </ThemedView>

              {/* Advantages List */}
              <ThemedText type="smallBold" style={styles.sectionTitle}>
                Beneficios de Reservar
              </ThemedText>

              <View style={styles.advantagesList}>
                <View style={styles.advantageItem}>
                  <Ionicons name="checkmark-circle-outline" size={22} color="#4CAF50" />
                  <View style={{ flex: 1 }}>
                    <ThemedText type="smallBold">Tarifa Fija Garantizada</ThemedText>
                    <ThemedText style={styles.advSub} themeColor="textSecondary">
                      El precio se fija al momento de hacer la reserva y no cambiará por tráfico.
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.advantageItem}>
                  <Ionicons name="checkmark-circle-outline" size={22} color="#4CAF50" />
                  <View style={{ flex: 1 }}>
                    <ThemedText type="smallBold">Conductor Asignado Antes</ThemedText>
                    <ThemedText style={styles.advSub} themeColor="textSecondary">
                      Aseguras tu chofer con antelación para mayor puntualidad.
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.advantageItem}>
                  <Ionicons name="checkmark-circle-outline" size={22} color="#4CAF50" />
                  <View style={{ flex: 1 }}>
                    <ThemedText type="smallBold">15 min de Espera Gratis</ThemedText>
                    <ThemedText style={styles.advSub} themeColor="textSecondary">
                      El socio conductor llegará con tiempo y te esperará hasta 15 minutos sin costo extra.
                    </ThemedText>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.actionSubmitBtn, { backgroundColor: colors.text }]}
                onPress={handleConfirmReservation}
                disabled={isReserving || reserveSuccess}
              >
                {isReserving ? (
                  <ActivityIndicator color={colors.background} />
                ) : (
                  <ThemedText style={[styles.actionSubmitText, { color: colors.background }]} type="smallBold">
                    Confirmar Reserva Anticipada
                  </ThemedText>
                )}
              </TouchableOpacity>
            </View>
          )}

          {activeCategory === 'transit' && (
            /* =======================================
               TRANSITO (TRANSIT) SUB-VIEW
               ======================================= */
            <View style={styles.tabContentWrapper}>
              <ThemedView type="backgroundElement" style={styles.featureHighlightCard}>
                <View style={styles.featureLeftInfo}>
                  <ThemedText type="smallBold" style={styles.featureTitle}>
                    Uber Tránsito
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.featureDesc}>
                    Consulta horarios, rutas y tiempos de espera exactos del transporte público de tu ciudad.
                  </ThemedText>
                </View>
                <View style={[styles.featureIconContainer, { backgroundColor: colors.background }]}>
                  <Ionicons name="subway-outline" size={32} color={colors.text} />
                </View>
              </ThemedView>

              {/* Router Input Search */}
              <ThemedView type="backgroundElement" style={styles.routeFinder}>
                <View style={styles.routeFinderRow}>
                  <View style={styles.dotStart} />
                  <TextInput
                    style={[styles.routeInput, { color: colors.text }]}
                    placeholder="Ubicación Actual"
                    placeholderTextColor={colors.textSecondary}
                    editable={false}
                  />
                </View>
                <View style={styles.finderLine} />
                <View style={styles.routeFinderRow}>
                  <View style={styles.dotEnd} />
                  <TextInput
                    style={[styles.routeInput, { color: colors.text }]}
                    placeholder="¿A dónde vas?"
                    placeholderTextColor={colors.textSecondary}
                    value={transitDestination}
                    onChangeText={setTransitDestination}
                  />
                </View>
              </ThemedView>

              {/* Transit Options List */}
              <ThemedText type="smallBold" style={styles.sectionTitle}>
                Rutas y conexiones sugeridas
              </ThemedText>

              <View style={styles.transitOptionsList}>
                <ThemedView type="backgroundElement" style={styles.transitOptionRow}>
                  <View style={styles.transitRowTop}>
                    <View style={styles.transitIconTitleRow}>
                      <View style={[styles.transitLogoBg, { backgroundColor: '#E53935' }]}>
                        <ThemedText style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '900' }}>T</ThemedText>
                      </View>
                      <ThemedText type="smallBold">TransMilenio Linea H</ThemedText>
                    </View>
                    <ThemedText type="smallBold" style={styles.transitPrice}>$2,950</ThemedText>
                  </View>
                  <View style={styles.transitRowBottom}>
                    <Ionicons name="walk" size={14} color={colors.textSecondary} />
                    <ThemedText style={styles.transitMeta} themeColor="textSecondary">
                      Camina 3 min • Salida en 4 min • Duración: 24 min
                    </ThemedText>
                  </View>
                </ThemedView>

                <ThemedView type="backgroundElement" style={styles.transitOptionRow}>
                  <View style={styles.transitRowTop}>
                    <View style={styles.transitIconTitleRow}>
                      <View style={[styles.transitLogoBg, { backgroundColor: '#1E88E5' }]}>
                        <ThemedText style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '900' }}>B</ThemedText>
                      </View>
                      <ThemedText type="smallBold">Bus SITP Urbano C135</ThemedText>
                    </View>
                    <ThemedText type="smallBold" style={styles.transitPrice}>$2,950</ThemedText>
                  </View>
                  <View style={styles.transitRowBottom}>
                    <Ionicons name="walk" size={14} color={colors.textSecondary} />
                    <ThemedText style={styles.transitMeta} themeColor="textSecondary">
                      Camina 6 min • Salida en 8 min • Duración: 43 min
                    </ThemedText>
                  </View>
                </ThemedView>
              </View>

              {/* Transit Map Mock */}
              <View style={[styles.transitMapMock, { borderColor: colors.backgroundElement }]}>
                <ThemedView type="backgroundSelected" style={styles.mockTransitLayout}>
                  <View style={styles.transitPathLine} />
                  
                  <View style={[styles.transitStationDot, { left: '20%', top: '50%' }]}>
                    <View style={styles.transitInnerStationDot} />
                  </View>
                  <View style={[styles.transitStationDot, { left: '50%', top: '50%' }]}>
                    <View style={styles.transitInnerStationDot} />
                  </View>
                  <View style={[styles.transitStationDot, { left: '80%', top: '50%' }]}>
                    <View style={styles.transitInnerStationDot} />
                  </View>
                  
                  <ThemedText style={[styles.stationLabel, { left: '10%', top: '65%' }]}>
                    Portal Norte
                  </ThemedText>
                  <ThemedText style={[styles.stationLabel, { left: '44%', top: '65%' }]}>
                    Calle 72
                  </ThemedText>
                  <ThemedText style={[styles.stationLabel, { left: '72%', top: '65%' }]}>
                    Héroes
                  </ThemedText>
                </ThemedView>
              </View>
            </View>
          )}

        </ScrollView>
      </SafeAreaView>

      {/* =======================================
         REAL MERCADO PAGO CHECKOUT MODAL SHEET
         ======================================= */}
      {selectedDriver && (
        <Modal
          visible={checkoutVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setCheckoutVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <ThemedView type="background" style={[styles.checkoutSheet, { borderColor: colors.backgroundElement }]}>
              {/* Close Bar indicator */}
              <View style={[styles.closeBar, { backgroundColor: colors.backgroundElement }]} />

              <View style={styles.sheetHeader}>
                <ThemedText type="subtitle" style={styles.sheetTitle}>
                  Detalle del Viaje
                </ThemedText>
                <TouchableOpacity style={styles.closeBtnIcon} onPress={() => setCheckoutVisible(false)}>
                  <Ionicons name="close-circle" size={26} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {bookingError && (
                <ThemedView type="backgroundElement" style={styles.alertError}>
                  <Ionicons name="alert-circle" size={20} color="#ff3333" />
                  <ThemedText style={{ color: '#ff3333', flex: 1 }} type="small">
                    {bookingError}
                  </ThemedText>
                </ThemedView>
              )}

              {/* Graphic Travel Route */}
              <ThemedView type="backgroundElement" style={styles.sheetRouteCard}>
                <View style={styles.routeItemRow}>
                  <View style={[styles.routeDot, { backgroundColor: '#2196F3' }]} />
                  <View style={{ flex: 1 }}>
                    <ThemedText style={styles.routeLabel} themeColor="textSecondary">Punto de Recogida</ThemedText>
                    <ThemedText type="smallBold">Mi Ubicación Actual (Bogotá)</ThemedText>
                  </View>
                </View>
                <View style={styles.routeConnectorLine} />
                <View style={styles.routeItemRow}>
                  <View style={[styles.routeDot, { backgroundColor: '#E53935' }]} />
                  <View style={{ flex: 1 }}>
                    <ThemedText style={styles.routeLabel} themeColor="textSecondary">Destino Final</ThemedText>
                    <ThemedText type="smallBold">Aeropuerto El Dorado (Muelle T1)</ThemedText>
                  </View>
                </View>
              </ThemedView>

              {/* Service & Price details */}
              <View style={styles.priceSummaryRow}>
                <View style={styles.summaryLeft}>
                  <View style={[styles.summaryIconBg, { backgroundColor: colors.backgroundElement }]}>
                    <Ionicons name="car-sport" size={24} color={colors.text} />
                  </View>
                  <View>
                    <ThemedText type="smallBold">{selectedDriver.name}</ThemedText>
                    <ThemedText style={{ fontSize: 11 }} themeColor="textSecondary">
                      {selectedDriver.distance}
                    </ThemedText>
                  </View>
                </View>
                <ThemedText type="subtitle" style={styles.summaryPrice}>
                  {selectedDriver.price}
                </ThemedText>
              </View>

              {/* Payment Method Selector (Mercado Pago Brand Style) */}
              <ThemedText type="smallBold" style={{ fontSize: 14, marginVertical: Spacing.one }}>
                Método de Pago
              </ThemedText>
              <ThemedView type="backgroundElement" style={styles.mpMethodCard}>
                <View style={styles.mpMethodLeft}>
                  <View style={styles.mpLogoCircle}>
                    <ThemedText style={styles.mpLogoChar}>m</ThemedText>
                  </View>
                  <View>
                    <ThemedText type="smallBold">Mercado Pago</ThemedText>
                    <ThemedText style={{ fontSize: 11 }} themeColor="textSecondary">
                      Billetera digital y pasarela de pago segura
                    </ThemedText>
                  </View>
                </View>
                <Ionicons name="checkmark-circle" size={20} color="#009ee3" />
              </ThemedView>

              {/* Checkout CTA actions */}
              <View style={styles.sheetActionsRow}>
                {bookingStep === 'idle' ? (
                  <TouchableOpacity
                    style={[styles.mpPayBtn, { backgroundColor: '#009ee3' }]}
                    onPress={handleInitiateBooking}
                  >
                    <Ionicons name="wallet" size={22} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <ThemedText style={styles.mpPayText} type="smallBold">
                      Confirmar y Pagar con Mercado Pago
                    </ThemedText>
                  </TouchableOpacity>
                ) : (
                  <View style={[styles.loadingButtonWrapper, { backgroundColor: colors.backgroundElement }]}>
                    <ActivityIndicator size="small" color={colors.text} style={{ marginRight: 10 }} />
                    <ThemedText type="smallBold">
                      {bookingStep === 'creating_trip' && 'Creando viaje en base de datos...'}
                      {bookingStep === 'creating_payment' && 'Preparando Mercado Pago...'}
                      {bookingStep === 'ready' && 'Abriendo pasarela segura...'}
                    </ThemedText>
                  </View>
                )}
              </View>
            </ThemedView>
          </View>
        </Modal>
      )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 28,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
    marginVertical: Spacing.one,
  },
  categoryCard: {
    flex: 1,
    height: 96,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.two,
  },
  categoryIconWrapper: {
    marginBottom: Spacing.one,
  },
  categoryLabel: {
    fontSize: 12,
  },
  tabContentWrapper: {
    gap: Spacing.three,
  },
  searchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 54,
    borderRadius: 27,
    paddingHorizontal: Spacing.three,
    marginVertical: Spacing.one,
  },
  searchIcon: {
    marginRight: Spacing.two,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  nowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.one - 2,
    paddingHorizontal: Spacing.two,
    borderRadius: 15,
  },
  nowText: {
    fontSize: 12,
  },
  mapContainer: {
    height: 180,
    borderRadius: 16,
    borderWidth: 1.5,
    overflow: 'hidden',
    marginVertical: Spacing.one,
  },
  mockMapBackground: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  mapGridLineH1: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '30%',
    height: 4,
    backgroundColor: '#ffffff',
    opacity: 0.8,
  },
  mapGridLineH2: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '70%',
    height: 6,
    backgroundColor: '#ffffff',
    opacity: 0.8,
  },
  mapGridLineV1: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '35%',
    width: 4,
    backgroundColor: '#ffffff',
    opacity: 0.8,
  },
  mapGridLineV2: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '70%',
    width: 5,
    backgroundColor: '#ffffff',
    opacity: 0.8,
  },
  userMapPin: {
    position: 'absolute',
    top: '55%',
    left: '48%',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  userMapPinInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },
  driverPin: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  mapFloatingHeader: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  mapTitle: {
    fontSize: 10,
    color: '#000000',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CAF50',
  },
  sectionHeader: {
    marginTop: Spacing.two,
    marginBottom: Spacing.one,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  driverList: {
    gap: Spacing.two,
  },
  driverRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  driverActiveBorder: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 4,
    backgroundColor: '#009ee3',
  },
  driverRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  driverIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  driverDistance: {
    fontSize: 12,
  },
  driverRating: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFB300',
  },
  driverPrice: {
    fontSize: 16,
    fontWeight: '700',
  },
  recentList: {
    gap: 0,
  },
  recentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
  },
  recentRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    flex: 1,
  },
  recentIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recentTextContainer: {
    flex: 1,
  },
  recentSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },

  /* PACKAGE STYLES */
  featureHighlightCard: {
    flexDirection: 'row',
    padding: Spacing.three + 2,
    borderRadius: 16,
    alignItems: 'center',
    gap: Spacing.three,
  },
  featureLeftInfo: {
    flex: 1,
    gap: Spacing.one - 2,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  featureDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  featureIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginVertical: Spacing.one,
  },
  toggleBtn: {
    flex: 1,
    height: 48,
    borderWidth: 1.5,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.one,
  },
  toggleActive: {
    borderWidth: 1.5,
  },
  toggleBtnText: {
    fontSize: 14,
  },
  packageSizeGrid: {
    gap: Spacing.two,
  },
  sizeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: Spacing.three,
  },
  sizeCardActive: {
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  sizeCardSubText: {
    fontSize: 11,
    marginTop: 2,
  },
  sizePrice: {
    fontSize: 16,
    fontWeight: '700',
  },
  stepperContainer: {
    borderRadius: 16,
    padding: Spacing.three + 2,
  },
  stepRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    alignItems: 'flex-start',
  },
  stepCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepTextWrapper: {
    flex: 1,
    gap: 2,
  },
  stepSub: {
    fontSize: 11,
  },
  stepConnector: {
    width: 2,
    height: 20,
    backgroundColor: '#CCCCCC',
    marginLeft: 12,
    marginVertical: 4,
  },
  actionSubmitBtn: {
    height: 54,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  actionSubmitText: {
    fontSize: 16,
  },

  /* RESERVE STYLES */
  alertSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: 8,
    gap: Spacing.two,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  alertSuccessGlobal: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: 12,
    gap: Spacing.three,
    marginVertical: Spacing.one,
    borderLeftWidth: 5,
    borderLeftColor: '#4CAF50',
  },
  selectorCardGrid: {
    borderRadius: 16,
    padding: Spacing.three,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.two + 2,
    borderBottomWidth: 1,
    gap: Spacing.three,
  },
  advantagesList: {
    gap: Spacing.three,
  },
  advantageItem: {
    flexDirection: 'row',
    gap: Spacing.three,
    alignItems: 'flex-start',
  },
  advSub: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },

  /* TRANSIT STYLES */
  routeFinder: {
    borderRadius: 16,
    padding: Spacing.three,
  },
  routeFinderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  dotStart: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2196F3',
    marginLeft: 6,
  },
  dotEnd: {
    width: 8,
    height: 8,
    backgroundColor: '#000000',
    marginLeft: 6,
  },
  routeInput: {
    flex: 1,
    height: 44,
    fontSize: 15,
    fontWeight: '600',
  },
  finderLine: {
    width: 2,
    height: 16,
    backgroundColor: '#CCCCCC',
    marginLeft: 19,
  },
  transitOptionsList: {
    gap: Spacing.two,
  },
  transitOptionRow: {
    padding: Spacing.three,
    borderRadius: 12,
    gap: Spacing.two,
  },
  transitRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transitIconTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  transitLogoBg: {
    width: 20,
    height: 20,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transitPrice: {
    fontSize: 15,
  },
  transitRowBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  transitMeta: {
    fontSize: 11,
  },
  transitMapMock: {
    height: 120,
    borderRadius: 12,
    borderWidth: 1.5,
    overflow: 'hidden',
    marginTop: Spacing.one,
  },
  mockTransitLayout: {
    flex: 1,
    justifyContent: 'center',
    position: 'relative',
  },
  transitPathLine: {
    height: 6,
    backgroundColor: '#E53935',
    position: 'absolute',
    left: '10%',
    right: '10%',
    top: '50%',
    marginTop: -3,
  },
  transitStationDot: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E53935',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -8,
  },
  transitInnerStationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E53935',
  },
  stationLabel: {
    position: 'absolute',
    fontSize: 9,
    fontWeight: '700',
    color: '#333333',
  },

  /* CHECKOUT MODAL STYLES */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  checkoutSheet: {
    width: '100%',
    maxWidth: MaxContentWidth,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1.5,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Platform.OS === 'ios' ? Spacing.five : Spacing.four,
    gap: Spacing.three,
  },
  closeBar: {
    width: 44,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: Spacing.one,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  closeBtnIcon: {
    padding: 2,
  },
  alertError: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: 8,
    gap: Spacing.two,
    borderLeftWidth: 4,
    borderLeftColor: '#ff3333',
  },
  sheetRouteCard: {
    borderRadius: 16,
    padding: Spacing.three,
    position: 'relative',
  },
  routeItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  routeLabel: {
    fontSize: 10,
    marginBottom: 1,
  },
  routeConnectorLine: {
    width: 2,
    height: 24,
    backgroundColor: '#CCCCCC',
    marginLeft: 5,
    marginVertical: 2,
  },
  priceSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.one,
  },
  summaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  summaryIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryPrice: {
    fontSize: 22,
    fontWeight: '800',
  },
  mpMethodCard: {
    borderRadius: 12,
    padding: Spacing.three,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 158, 227, 0.2)',
  },
  mpMethodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  mpLogoCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#009ee3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mpLogoChar: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 18,
    marginTop: -4,
  },
  sheetActionsRow: {
    marginTop: Spacing.one,
  },
  mpPayBtn: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    width: '100%',
    shadowColor: '#009ee3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  mpPayText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  loadingButtonWrapper: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    width: '100%',
  },
});
