import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import AddVenueScreen from '../../venues/add';

export default function AddVenueToEventScreen() {
  const { eventId } = useLocalSearchParams();
  
  return <AddVenueScreen eventId={eventId as string} />;
} 