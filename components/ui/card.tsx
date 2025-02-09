import * as React from "react";
import { View } from "react-native";

import { cn } from "@/lib/utils";

const Card = React.forwardRef<
  React.ElementRef<typeof View>,
  React.ComponentPropsWithoutRef<typeof View>
>(({ className, ...props }, ref) => (
  <View
    className={cn("rounded-lg border border-border bg-card", className)}
    ref={ref}
    {...props}
  />
));
Card.displayName = "Card";

export { Card }; 