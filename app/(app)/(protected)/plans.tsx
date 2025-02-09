import { useEffect, useState } from "react";
import { View, ScrollView } from "react-native";
import { router } from "expo-router";

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

  useEffect(() => {
    fetchPlans();
  }, []);

  async function fetchPlans() {
    try {
      const { data, error } = await supabase
        .from('plan')
        .select('*')
        .eq('created_by', user?.id)
        .order('start_date', { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  }

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
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
} 