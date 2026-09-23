import type { ReactNode } from 'react';
import { View } from 'react-native';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <View className={`mb-4 rounded-[28px] bg-cream/95 p-5 ${className}`}>{children}</View>;
}
