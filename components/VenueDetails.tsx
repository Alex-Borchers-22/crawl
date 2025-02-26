import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, Linking, Platform } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';

interface VenueDetailsProps {
  venueId?: string;
  googlePlaceId?: string;
  visible: boolean;
  onClose: () => void;
  showDateTime?: boolean;
}

interface VenueData {
  id: string;
  name: string;
  address: string;
  status: string;
  latitude?: number;
  longitude?: number;
  google_place_id?: string;
  start_time?: string;
  event_id?: string;
}

interface PlaceDetails {
  name?: string;
  address?: string;
  phoneNumber?: string;
  website?: string;
  rating?: number;
  priceLevel?: number;
  openingHours?: string[];
  reviews?: Array<{
    author_name: string;
    rating: number;
    text: string;
    time: number;
  }>;
  url?: string;
  userRatingsTotal?: number;
}

export default function VenueDetails({ venueId, googlePlaceId, visible, onClose, showDateTime = false }: VenueDetailsProps) {
  const [venueData, setVenueData] = useState<VenueData | null>(null);
  const [placeDetails, setPlaceDetails] = useState<PlaceDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible && (venueId || googlePlaceId)) {
      fetchVenueData();
    }
  }, [visible, venueId, googlePlaceId]);

  const fetchVenueData = async () => {
    try {
      setLoading(true);
      
      // If we have a venue ID, fetch from our database first
      if (venueId) {
        const { data, error } = await supabase
          .from('venues')
          .select('*')
          .eq('id', venueId)
          .single();
          
        if (error) throw error;
        
        setVenueData(data);
        
        // If this venue has a Google Place ID, fetch additional details
        if (data.google_place_id) {
          await fetchPlaceDetails(data.google_place_id);
        }
      } 
      // If we only have a Google Place ID (no venue ID)
      else if (googlePlaceId) {
        await fetchPlaceDetails(googlePlaceId);
      }
    } catch (error) {
      console.error('Error fetching venue data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlaceDetails = async (placeId: string) => {
    try {
      // Fetch place details using the place ID via Google Places API
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,formatted_phone_number,website,rating,price_level,opening_hours,reviews,url,user_ratings_total&key=${process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY}`
      );
      
      const data = await response.json();
      
      if (data.result) {
        const details = data.result;
        setPlaceDetails({
          name: details.name,
          address: details.formatted_address,
          phoneNumber: details.formatted_phone_number,
          website: details.website,
          rating: details.rating,
          priceLevel: details.price_level,
          openingHours: details.opening_hours?.weekday_text,
          reviews: details.reviews,
          url: details.url,
          userRatingsTotal: details.user_ratings_total
        });
      }
    } catch (error) {
      console.error('Error fetching place details:', error);
    }
  };

  const formatTime = (timeString: string) => {
    try {
      // Parse the time in format "HH:MM:SS+/-HH:MM"
      const [timePart, _] = timeString.split(/[+-]/);
      const [hours, minutes] = timePart.split(':');
      
      // Create a date object with today's date but the time from the string
      const date = new Date();
      date.setHours(parseInt(hours, 10));
      date.setMinutes(parseInt(minutes, 10));
      
      // Return formatted time like "7:30 PM"
      return format(date, 'h:mm a');
    } catch (error) {
      console.error('Error parsing time:', error);
      return timeString;
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView>
            {loading ? (
              <View style={styles.loadingContainer}>
                <Text>Loading venue details...</Text>
              </View>
            ) : (
              <View style={styles.modalBody}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {venueData?.name || placeDetails?.name || 'Venue Details'}
                  </Text>
                  <TouchableOpacity
                    onPress={onClose}
                    style={styles.closeButton}
                  >
                    <Ionicons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.modalAddress}>
                  {venueData?.address || placeDetails?.address || ''}
                </Text>

                {showDateTime && venueData?.start_time && (
                  <View style={styles.infoRow}>
                    <MaterialIcons name="access-time" size={20} color="#6B7280" />
                    <Text style={styles.infoText}>
                      Starts at {formatTime(venueData.start_time)}
                    </Text>
                  </View>
                )}

                {placeDetails?.rating && (
                  <View style={styles.infoRow}>
                    <MaterialIcons name="star" size={20} color="#F59E0B" />
                    <Text style={styles.infoText}>
                      {placeDetails.rating} ({placeDetails.userRatingsTotal} reviews)
                    </Text>
                  </View>
                )}

                {placeDetails?.priceLevel && (
                  <View style={styles.infoRow}>
                    <MaterialIcons name="attach-money" size={20} color="#6B7280" />
                    <Text style={styles.infoText}>
                      {'$'.repeat(placeDetails.priceLevel)}
                    </Text>
                  </View>
                )}

                {placeDetails?.phoneNumber && (
                  <View style={styles.infoRow}>
                    <MaterialIcons name="phone" size={20} color="#6B7280" />
                    <Text style={styles.infoText}>
                      {placeDetails.phoneNumber}
                    </Text>
                  </View>
                )}

                {placeDetails?.openingHours && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Opening Hours</Text>
                    {placeDetails.openingHours.map((hours, index) => (
                      <Text key={index} style={styles.hoursText}>
                        {hours}
                      </Text>
                    ))}
                  </View>
                )}

                {(placeDetails?.website || placeDetails?.url) && (
                  <View style={styles.buttonRow}>
                    {placeDetails.website && (
                      <TouchableOpacity
                        style={[styles.button, styles.websiteButton]}
                        onPress={() => Linking.openURL(placeDetails.website!)}
                      >
                        <Text style={styles.buttonText}>Website</Text>
                      </TouchableOpacity>
                    )}
                    {placeDetails.url && (
                      <TouchableOpacity
                        style={[styles.button, styles.mapsButton]}
                        onPress={() => Linking.openURL(placeDetails.url!)}
                      >
                        <Text style={styles.buttonText}>View on Maps</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {placeDetails?.reviews && placeDetails.reviews.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Recent Reviews</Text>
                    {placeDetails.reviews.slice(0, 3).map((review, index) => (
                      <View key={index} style={styles.review}>
                        <View style={styles.reviewHeader}>
                          <Text style={styles.reviewAuthor}>
                            {review.author_name}
                          </Text>
                          <View style={styles.stars}>
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
                        <Text style={styles.reviewText}>{review.text}</Text>
                        <Text style={styles.reviewDate}>
                          {new Date(review.time * 1000).toLocaleDateString()}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalBody: {
    padding: 20,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
  },
  closeButton: {
    padding: 5,
  },
  modalAddress: {
    fontSize: 16,
    color: '#4B5563',
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#4B5563',
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 10,
  },
  hoursText: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 15,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 120,
  },
  websiteButton: {
    backgroundColor: '#3B82F6',
  },
  mapsButton: {
    backgroundColor: '#EF4444',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  review: {
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  reviewAuthor: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginRight: 10,
  },
  stars: {
    flexDirection: 'row',
  },
  reviewText: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 5,
  },
  reviewDate: {
    fontSize: 12,
    color: '#6B7280',
  },
}); 