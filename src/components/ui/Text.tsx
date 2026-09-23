import type { ReactNode } from 'react';
import { Text } from 'react-native';

export const Title = ({ children, light = false, className = '' }: { children: ReactNode; light?: boolean; className?: string }) => (
  <Text className={`font-display text-[32px] leading-[38px] ${light ? 'text-white' : 'text-ink'} ${className}`}>{children}</Text>
);

export const Heading = ({ children, light = false, className = '' }: { children: ReactNode; light?: boolean; className?: string }) => (
  <Text className={`font-display text-xl ${light ? 'text-white' : 'text-ink'} ${className}`}>{children}</Text>
);

export const Body = ({ children, light = false, className = '' }: { children: ReactNode; light?: boolean; className?: string }) => (
  <Text className={`font-body text-base leading-6 ${light ? 'text-white/85' : 'text-ink/80'} ${className}`}>{children}</Text>
);

export const Label = ({ children, light = false, className = '' }: { children: ReactNode; light?: boolean; className?: string }) => (
  <Text className={`font-body-black text-xs uppercase tracking-[2px] ${light ? 'text-white/70' : 'text-mist'} ${className}`}>
    {children}
  </Text>
);
