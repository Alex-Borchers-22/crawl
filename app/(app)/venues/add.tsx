import { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Dimensions, StyleSheet, Pressable, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { supabase } from '../../../lib/supabase';
import MapView, { Marker, Callout, CalloutSubview } from 'react-native-maps';
import { GooglePlacesAutocomplete, GooglePlacesAutocompleteRef } from 'react-native-google-places-autocomplete';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { Linking } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface Location {
  latitude: number;
  longitude: number;
  name?: string;
  address?: string;
  placeId?: string;
  phoneNumber?: string;
  website?: string;
  rating?: number;
  priceLevel?: number;
  openingHours?: string[];
  photos?: Array<{
    height: number;
    width: number;
    html_attributions: string[];
    photo_reference: string;
  }>;
  reviews?: Array<{
    author_name: string;
    rating: number;
    text: string;
    time: number;
  }>;
  url?: string;
  userRatingsTotal?: number;
}

interface MapEvent {
  nativeEvent: {
    coordinate: {
      latitude: number;
      longitude: number;
    };
  };
}

const VENUE_TYPES = [
  'bar',
  'restaurant',
  'club',
  'pub',
  'cafe',
  'brewery',
  'other'
];

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.02;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

export default function AddVenueScreen() {
  const router = useRouter();
  const [showMap, setShowMap] = useState(true);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [venueType, setVenueType] = useState(VENUE_TYPES[0]);
  const [loading, setLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [showCallout, setShowCallout] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [initialRegion, setInitialRegion] = useState<null | {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  }>(null);
  const mapRef = useRef<MapView | null>(null);
  const searchBarRef = useRef<GooglePlacesAutocompleteRef | null>(null);

  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          alert('Permission to access location was denied. You can still use the map but it won\'t center on your location.');
          // Set a default region if permission is denied
          setInitialRegion({
            latitude: 0,
            longitude: 0,
            latitudeDelta: LATITUDE_DELTA,
            longitudeDelta: LONGITUDE_DELTA,
          });
          return;
        }

        // Get last known location first for immediate display
        let lastKnownLocation = await Location.getLastKnownPositionAsync();
        if (lastKnownLocation) {
          setInitialRegion({
            latitude: lastKnownLocation.coords.latitude,
            longitude: lastKnownLocation.coords.longitude,
            latitudeDelta: LATITUDE_DELTA,
            longitudeDelta: LONGITUDE_DELTA,
          });
        }

        // Then get current location for accuracy
        let currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        
        const region = {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        };

        setInitialRegion(region);
        mapRef.current?.animateToRegion(region, 1000);
      } catch (error) {
        console.error('Error getting location:', error);
        // Set a default region if there's an error
        setInitialRegion({
          latitude: 0,
          longitude: 0,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        });
      }
    })();
  }, []);

  const handleMapPress = (event: MapEvent) => {
    const { coordinate } = event.nativeEvent;
    setSelectedLocation({
      latitude: coordinate.latitude,
      longitude: coordinate.longitude
    });
    setShowCallout(true);
  };

  const handlePlaceSelect = (data: any, details: any) => {
    const location: Location = {
      latitude: details.geometry.location.lat,
      longitude: details.geometry.location.lng,
      name: details.name,
      address: details.formatted_address,
      placeId: details.place_id,
      phoneNumber: details.formatted_phone_number,
      website: details.website,
      rating: details.rating,
      priceLevel: details.price_level,
      openingHours: details.current_opening_hours?.weekday_text || details.opening_hours?.weekday_text,
      photos: details.photos,
      reviews: details.reviews,
      url: details.url,
      userRatingsTotal: details.user_ratings_total
    };
    
    console.log('data', data);
    console.log('details', details);
    console.log('location', location);

    setSelectedLocation(location);
    setInitialRegion({
      latitude: location.latitude,
      longitude: location.longitude,
      latitudeDelta: LATITUDE_DELTA,
      longitudeDelta: LONGITUDE_DELTA,
    });

    // Center map on selected location
    mapRef.current?.animateToRegion({
      latitude: location.latitude,
      longitude: location.longitude,
      latitudeDelta: LATITUDE_DELTA,
      longitudeDelta: LONGITUDE_DELTA,
    }, 1000);

    setShowCallout(true);
    setShowDetails(true);
  };

  const handleConfirmLocation = () => {
    if (selectedLocation) {
      setName(selectedLocation.name || '');
      setAddress(selectedLocation.address || '');
      setShowMap(false);
    } else {
      alert('Please select a location on the map first');
    }
  };

  const handleReturnToMap = () => {
    setShowMap(true);
  };

  const clearSearch = () => {
    searchBarRef.current?.clear();
    searchBarRef.current?.blur();
  };

  async function handleAddVenue() {
    if (!name.trim() || !address.trim() || !selectedLocation) {
      alert('Please fill in all required fields and select a location');
      return;
    }

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        alert('Please sign in to add a venue');
        return;
      }

      const { error } = await supabase.from('venues').insert({
        name: name.trim(),
        address: address.trim(),
        venue_type: venueType,
        status: 'pending',
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        place_id: selectedLocation.placeId
      });

      if (error) throw error;
      
      router.back();
    } catch (error) {
      console.error('Error adding venue:', error);
      alert('Error adding venue. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (showMap) {
    return (
      <View style={styles.container}>
        <View style={styles.searchContainer}>
          <View style={styles.searchWrapper}>
            <GooglePlacesAutocomplete
              ref={searchBarRef}
              placeholder='Search for a place'
              onPress={handlePlaceSelect}
              query={{
                key: process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY,
                language: 'en',
              }}
              styles={{
                container: {
                  flex: 1,
                  position: 'relative',
                  zIndex: 1,
                },
                textInput: styles.searchInput,
                listView: {
                  position: 'absolute',
                  top: 45,
                  left: 0,
                  right: 0,
                  backgroundColor: 'white',
                  borderRadius: 5,
                  zIndex: 1000,
                  elevation: 3,
                },
              }}
              enablePoweredByContainer={false}
              fetchDetails={true}
            />
            <TouchableOpacity 
              style={styles.clearButton} 
              onPress={clearSearch}
            >
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        {initialRegion && (
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={initialRegion}
            onPress={handleMapPress}
            showsUserLocation={true}
            showsMyLocationButton={true}
          >
            {selectedLocation && (
              <Marker
                coordinate={{
                  latitude: selectedLocation.latitude,
                  longitude: selectedLocation.longitude
                }}
              >
                <Callout tooltip onPress={handleConfirmLocation}>
                  <View style={styles.calloutContainer}>
                    <View style={styles.callout}>
                      <Text style={styles.calloutTitle}>
                        {selectedLocation.name || 'Selected Location'}
                      </Text>
                      <Text style={styles.calloutAddress}>
                        {selectedLocation.address || 'Address not available'}
                      </Text>
                      <TouchableOpacity
                        style={styles.confirmButton}
                        onPress={handleConfirmLocation}
                      >
                        <Text style={styles.confirmButtonText}>
                          Confirm Location
                        </Text>
                      </TouchableOpacity>
                    </View>
                    {/* <View style={styles.calloutArrow} /> */}
                  </View>
                </Callout>
              </Marker>
            )}
          </MapView>
        )}
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <View className="p-6">
        <View className="space-y-4">
          <View className="flex-row justify-between items-center mb-4">
            <TouchableOpacity
              onPress={() => setShowMap(true)}
              className="bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded-lg"
            >
              <Text className="text-gray-700 dark:text-gray-300">Back to Map</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-purple-600 px-4 py-2 rounded-lg"
              onPress={handleAddVenue}
              disabled={loading}
            >
              <Text className="text-white">
                {loading ? 'Adding...' : 'Add Venue'}
              </Text>
            </TouchableOpacity>
          </View>

          {selectedLocation && (
            <View className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4">
              <Text className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {selectedLocation.name}
              </Text>
              <Text className="text-gray-600 dark:text-gray-400 mb-4">
                {selectedLocation.address}
              </Text>

              {selectedLocation.rating && (
                <View className="flex-row items-center mb-2">
                  <MaterialIcons name="star" size={20} color="#F59E0B" />
                  <Text className="ml-1 text-gray-700 dark:text-gray-300">
                    {selectedLocation.rating} ({selectedLocation.userRatingsTotal} reviews)
                  </Text>
                </View>
              )}

              {selectedLocation.priceLevel && (
                <View className="flex-row items-center mb-2">
                  <MaterialIcons name="attach-money" size={20} color="#6B7280" />
                  <Text className="ml-1 text-gray-700 dark:text-gray-300">
                    {'$'.repeat(selectedLocation.priceLevel)}
                  </Text>
                </View>
              )}

              {selectedLocation.phoneNumber && (
                <View className="flex-row items-center mb-2">
                  <MaterialIcons name="phone" size={20} color="#6B7280" />
                  <Text className="ml-1 text-gray-700 dark:text-gray-300">
                    {selectedLocation.phoneNumber}
                  </Text>
                </View>
              )}

              {selectedLocation.openingHours && (
                <View className="mb-4">
                  <Text className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Opening Hours
                  </Text>
                  {selectedLocation.openingHours.map((hours, index) => (
                    <Text 
                      key={index} 
                      className="text-gray-600 dark:text-gray-400"
                    >
                      {hours}
                    </Text>
                  ))}
                </View>
              )}

              {(selectedLocation.website || selectedLocation.url) && (
                <View className="flex-row flex-wrap gap-2 mb-4">
                  {selectedLocation.website && (
                    <TouchableOpacity
                      className="bg-blue-500 px-4 py-2 rounded-lg"
                      onPress={() => Linking.openURL(selectedLocation.website!)}
                    >
                      <Text className="text-white">Website</Text>
                    </TouchableOpacity>
                  )}
                  {selectedLocation.url && (
                    <TouchableOpacity
                      className="bg-red-500 px-4 py-2 rounded-lg"
                      onPress={() => Linking.openURL(selectedLocation.url!)}
                    >
                      <Text className="text-white">View on Google Maps</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {selectedLocation.reviews && selectedLocation.reviews.length > 0 && (
                <View>
                  <Text className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Recent Reviews
                  </Text>
                  {selectedLocation.reviews.slice(0, 3).map((review, index) => (
                    <View key={index} className="mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                      <View className="flex-row items-center mb-1">
                        <Text className="font-medium text-gray-900 dark:text-gray-100">
                          {review.author_name}
                        </Text>
                        <View className="flex-row ml-2">
                          {[...Array(5)].map((_, i) => (
                            <MaterialIcons
                              key={i}
                              name="star"
                              size={16}
                              color={i < review.rating ? '#F59E0B' : '#D1D5DB'}
                            />
                          ))}
                        </View>
                      </View>
                      <Text className="text-gray-600 dark:text-gray-400">
                        {review.text}
                      </Text>
                      <Text className="text-gray-500 dark:text-gray-500 text-sm mt-1">
                        {new Date(review.time * 1000).toLocaleDateString()}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          <View>
            <Text className="text-gray-700 dark:text-gray-300 mb-1 font-medium">
              Venue Type
            </Text>
            <View className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <Picker
                selectedValue={venueType}
                onValueChange={(itemValue) => setVenueType(itemValue)}
                style={{ color: '#374151' }}
              >
                {VENUE_TYPES.map((type) => (
                  <Picker.Item
                    key={type}
                    label={type.charAt(0).toUpperCase() + type.slice(1)}
                    value={type}
                  />
                ))}
              </Picker>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  searchContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 20,
    left: 10,
    right: 10,
    zIndex: 1,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 5,
    position: 'relative',
    ...Platform.select({
      ios: {
        zIndex: 999,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  searchInput: {
    height: 45,
    fontSize: 16,
    backgroundColor: 'white',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingRight: 35, // Make room for the clear button
  },
  clearButton: {
    position: 'absolute',
    right: 10,
    top: 12,
    zIndex: 2,
    padding: 5,
  },
  calloutContainer: {
    width: 250,
    backgroundColor: 'transparent',
  },
  callout: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  calloutArrow: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    borderTopColor: 'white',
    borderWidth: 16,
    alignSelf: 'center',
    marginTop: -32,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1F2937',
  },
  calloutAddress: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 12,
  },
  confirmButton: {
    backgroundColor: '#6366F1',
    padding: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  confirmButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 14,
  },
  locationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  locationAddress: {
    fontSize: 14,
    color: '#4B5563',
    marginTop: 2,
  },
  editText: {
    color: '#3B82F6',
    fontWeight: 'bold',
  },
}); 