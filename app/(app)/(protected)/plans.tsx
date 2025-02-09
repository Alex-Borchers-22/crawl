import { useEffect, useState } from "react";
import { View, ScrollView } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useCallback } from "react";

import { SafeAreaView } from "@/components/safe-area-view";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { H1 } from "@/components/ui/typography";
import { PlanCard, type Plan } from "@/components/plan-card";
import { useSupabase } from "@/context/supabase-provider";
import { supabase } from "@/config/supabase";

export default function Plans() {
  const { user } = useSupabase();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPlans = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('plan')
        .select('*')
        .eq('created_by', user?.id)
        .order('start_date', { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Fetch when component mounts
  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  // Fetch when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchPlans();
    }, [fetchPlans])
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row justify-between items-center p-4">
        <H1>Plans</H1>
        <Button 
          variant="default"
          onPress={() => router.push("/create-plan")}
        >
          <Text>New Plan</Text>
        </Button>
      </View>
      <ScrollView className="flex-1 p-4">
        <View className="space-y-4">
          {isLoading ? (
            <Text className="text-center text-muted-foreground">Loading plans...</Text>
          ) : plans.length === 0 ? (
            <Text className="text-center text-muted-foreground">No plans found. Create one to get started!</Text>
          ) : (
            plans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
} 