import { Image } from 'expo-image';
import * as React from 'react';

import { Button } from './button';
import { Text } from './text';

import { cn } from '@/lib/utils';

export interface GoogleButtonProps extends React.ComponentPropsWithoutRef<typeof Button> {
  text?: string;
}

const GoogleButton = React.forwardRef<
  React.ElementRef<typeof Button>,
  GoogleButtonProps
>(({ className, text = "Continue with Google", ...props }, ref) => {
  return (
    <Button
      variant="outline"
      ref={ref}
      className={cn("gap-2", className)}
      {...props}
    >
      <Image
        source={require("@/assets/google.png")}
        className="w-5 h-5"
        contentFit="contain"
      />
      <Text className="text-sm font-semibold">{text}</Text>
    </Button>
  );
});

GoogleButton.displayName = "GoogleButton";

export { GoogleButton }; 