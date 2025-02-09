import { View } from "react-native";
import { format } from "date-fns";

import { Text } from "@/components/ui/text";
import { H3, Muted } from "@/components/ui/typography";
import { Card } from "@/components/ui/card";

export type Plan = {
  id: string;
  description: string;
  start_date: string;
  number_of_weeks: number;
  created_by: string;
  last_update: string;
  time_created: string;
};

interface PlanCardProps {
  plan: Plan;
}

export function PlanCard({ plan }: PlanCardProps) {
  return (
    <Card className="p-4">
      <View className="space-y-2">
        <H3>{format(new Date(plan.start_date), 'MMM d, yyyy')}</H3>
        <Text className="text-base">{plan.description}</Text>
        <Muted>{plan.number_of_weeks} weeks</Muted>
      </View>
    </Card>
  );
} 