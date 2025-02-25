import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';
import { format } from 'date-fns';
import VenueDetails from '../../../components/VenueDetails';

type Event = {
  id: string;
  title: string;
  event_date: string;
  status: string;
  is_private: boolean;
  is_scavenger_hunt: boolean;
  user_id: string;
};

type Venue = {
  id: string;
  name: string;
  address: string;
  venue_type: string;
  status: string;
  start_time?: string;
  google_place_id?: string;
  upvotes?: number;
  downvotes?: number;
  userVote?: 'upvote' | 'downvote' | null;
};

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const [showVenueDetails, setShowVenueDetails] = useState(false);

  useEffect(() => {
    loadEventDetails();
    getCurrentUser();
  }, [id]);

  async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setUserId(user.id);
  }

  async function loadEventDetails() {
    try {
      // Load event details
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();

      if (eventError) throw eventError;
      setEvent(eventData);

      // Load venues with votes and order by start_time
      const { data: venueData, error: venueError } = await supabase
        .from('venues')
        .select(`
          *,
          venue_votes (vote_type, user_id)
        `)
        .eq('event_id', id)
        .order('start_time', { ascending: true });

      if (venueError) throw venueError;

      const venuesWithVotes = venueData.map((venue: any) => {
        const votes = venue.venue_votes || [];
        const upvotes = votes.filter((v: any) => v.vote_type === 'upvote').length;
        const downvotes = votes.filter((v: any) => v.vote_type === 'downvote').length;
        const userVote = votes.find((v: any) => v.user_id === userId)?.vote_type;

        return {
          ...venue,
          upvotes,
          downvotes,
          userVote,
        };
      });

      setVenues(venuesWithVotes);
    } catch (error) {
      console.error('Error loading event details:', error);
      alert('Error loading event details');
    } finally {
      setLoading(false);
    }
  }

  async function handleVote(venueId: string, voteType: 'upvote' | 'downvote') {
    if (!userId) {
      alert('Please sign in to vote');
      return;
    }

    try {
      const venue = venues.find(v => v.id === venueId);
      const existingVote = venue?.userVote;

      if (existingVote === voteType) {
        // Remove vote
        await supabase
          .from('venue_votes')
          .delete()
          .match({ venue_id: venueId, user_id: userId });
      } else {
        // Upsert vote
        await supabase
          .from('venue_votes')
          .upsert({
            venue_id: venueId,
            event_id: id,
            user_id: userId,
            vote_type: voteType,
          });
      }

      await loadEventDetails();
    } catch (error) {
      console.error('Error voting:', error);
      alert('Error submitting vote');
    }
  }

  // Format time from database format "HH:MM:SS+/-HH:MM" to readable format
  const formatTime = (timeString?: string) => {
    if (!timeString) return '';
    
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

  const handleVenuePress = (venueId: string) => {
    setSelectedVenueId(venueId);
    setShowVenueDetails(true);
  };

  const closeVenueDetails = () => {
    setShowVenueDetails(false);
    setSelectedVenueId(null);
  };

  // Filter venues based on search query
  const filteredVenues = venues.filter(venue => 
    venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    venue.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!event) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>Event not found</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <View className="p-6">
        <View className="mb-6">
          <Text className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {event.title}
          </Text>
          <View className="flex-row items-center mt-2">
            <MaterialIcons name="event" size={16} color="#6b7280" />
            <Text className="ml-1 text-gray-600 dark:text-gray-400">
              {format(new Date(event.event_date), 'MMM d, yyyy h:mm a')}
            </Text>
          </View>
        </View>

        <View className="mb-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Venues
            </Text>
            <TouchableOpacity
              className="bg-purple-600 px-4 py-2 rounded-lg"
              onPress={() => router.push({
                pathname: "/(app)/venues/[eventId]/add",
                params: { eventId: id }
              })}
            >
              <Text className="text-white">Add Venue</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-4"
            placeholder="Search venues..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          {filteredVenues.length === 0 ? (
            <View className="bg-white dark:bg-gray-800 p-4 rounded-lg mb-4 items-center">
              <Text className="text-gray-600 dark:text-gray-400">
                No venues found. Try adding one!
              </Text>
            </View>
          ) : (
            filteredVenues.map((venue) => (
              <TouchableOpacity
                key={venue.id}
                onPress={() => handleVenuePress(venue.id)}
                className="bg-white dark:bg-gray-800 p-4 rounded-lg mb-4"
              >
                <Text className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {venue.name}
                </Text>
                <Text className="text-gray-600 dark:text-gray-400 mb-2">
                  {venue.address}
                </Text>
                
                {venue.start_time && (
                  <View className="flex-row items-center mb-2">
                    <MaterialIcons name="access-time" size={16} color="#6b7280" />
                    <Text className="ml-1 text-gray-600 dark:text-gray-400">
                      Starts at {formatTime(venue.start_time)}
                    </Text>
                  </View>
                )}
                
                <View className="flex-row justify-between items-center mt-2">
                  <View className="flex-row">
                    <TouchableOpacity
                      className="flex-row items-center mr-4"
                      onPress={(e) => {
                        e.stopPropagation();
                        handleVote(venue.id, 'upvote');
                      }}
                    >
                      <MaterialIcons
                        name="thumb-up"
                        size={20}
                        color={venue.userVote === 'upvote' ? '#9333ea' : '#6b7280'}
                      />
                      <Text className="ml-1">{venue.upvotes || 0}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      className="flex-row items-center"
                      onPress={(e) => {
                        e.stopPropagation();
                        handleVote(venue.id, 'downvote');
                      }}
                    >
                      <MaterialIcons
                        name="thumb-down"
                        size={20}
                        color={venue.userVote === 'downvote' ? '#9333ea' : '#6b7280'}
                      />
                      <Text className="ml-1">{venue.downvotes || 0}</Text>
                    </TouchableOpacity>
                  </View>

                  <Text
                    className={`text-sm ${
                      venue.status === 'pending'
                        ? 'text-yellow-600'
                        : venue.status === 'active'
                        ? 'text-green-600'
                        : 'text-gray-600'
                    }`}
                  >
                    {venue.status.charAt(0).toUpperCase() + venue.status.slice(1)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {event.is_scavenger_hunt && (
          <TouchableOpacity
            className="bg-purple-600 p-4 rounded-lg mb-6"
            onPress={() => router.push(`/events/${event.id}/challenges`)}
          >
            <Text className="text-white text-center font-semibold">
              View Scavenger Hunt Challenges
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Venue details modal */}
      <VenueDetails
        venueId={selectedVenueId || undefined}
        visible={showVenueDetails}
        onClose={closeVenueDetails}
        showDateTime={true}
      />
    </ScrollView>
  );
} 