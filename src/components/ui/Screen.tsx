import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SKY_GRADIENTS } from '../../theme/sky';

interface Props {
  children: ReactNode;
  /** Sunshine level index 0-6; picks the sky colours. */
  level?: number;
  footer?: ReactNode;
  scroll?: boolean;
}

/** Full-height sky background with a centred column that stays phone-width on big screens. */
export function Screen({ children, level = 2, footer, scroll = true }: Props) {
  const colors = SKY_GRADIENTS[Math.max(0, Math.min(level, SKY_GRADIENTS.length - 1))];
  const body = <View className="w-full max-w-[480px] self-center px-5 pb-28 pt-2">{children}</View>;
  return (
    <LinearGradient colors={colors} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        {scroll ? <ScrollView keyboardShouldPersistTaps="handled">{body}</ScrollView> : body}
        {footer}
      </SafeAreaView>
    </LinearGradient>
  );
}
