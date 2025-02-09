import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ActivityIndicator, View } from "react-native";
import * as z from "zod";

import { SafeAreaView } from "@/components/safe-area-view";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormInput } from "@/components/ui/form";
import { Text } from "@/components/ui/text";
import { H1 } from "@/components/ui/typography";
import { useSupabase } from "@/context/supabase-provider";
import { supabase } from "@/config/supabase";
import { router } from "expo-router";

const formSchema = z.object({
  description: z.string().min(1, "Description is required"),
  start_date: z.string().min(1, "Start date is required"),
  number_of_weeks: z.string().min(1, "Number of weeks is required"),
});

export default function CreatePlan() {
  const { user } = useSupabase();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
      start_date: new Date().toISOString().split('T')[0],
      number_of_weeks: "",
    },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('plan')
        .insert([
          {
            description: data.description,
            start_date: data.start_date,
            number_of_weeks: parseInt(data.number_of_weeks),
            created_by: user?.id,
            last_update: now,
            time_created: now,
          },
        ]);

      if (error) throw error;

      form.reset();
      router.back();
    } catch (error: any) {
      console.error('Error creating plan:', error.message);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background p-4" edges={["bottom"]}>
      <View className="flex-1 gap-4">
        <H1>Create Plan</H1>
        <Form {...form}>
          <View className="gap-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormInput
                  label="Description"
                  placeholder="Plan description"
                  {...field}
                />
              )}
            />
            <FormField
              control={form.control}
              name="start_date"
              render={({ field }) => (
                <FormInput
                  label="Start Date"
                  placeholder="YYYY-MM-DD"
                  {...field}
                />
              )}
            />
            <FormField
              control={form.control}
              name="number_of_weeks"
              render={({ field }) => (
                <FormInput
                  label="Number of Weeks"
                  placeholder="Enter number of weeks"
                  keyboardType="numeric"
                  {...field}
                />
              )}
            />
          </View>
        </Form>
      </View>
      <Button
        size="default"
        variant="default"
        onPress={form.handleSubmit(onSubmit)}
        disabled={form.formState.isSubmitting}
      >
        {form.formState.isSubmitting ? (
          <ActivityIndicator size="small" />
        ) : (
          <Text>Create Plan</Text>
        )}
      </Button>
    </SafeAreaView>
  );
} 