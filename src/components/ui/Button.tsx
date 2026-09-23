import { Pressable, Text } from 'react-native';
import { tap } from '../../services/haptics';

type Variant = 'sun' | 'dark' | 'ghost' | 'soft' | 'sage';

const STYLES: Record<Variant, { box: string; text: string }> = {
  sun: { box: 'bg-sun', text: 'text-ink' },
  dark: { box: 'bg-ink', text: 'text-cream' },
  ghost: { box: 'bg-white/15 border border-white/30', text: 'text-white' },
  soft: { box: 'bg-cloud', text: 'text-ink' },
  sage: { box: 'bg-sage', text: 'text-white' },
};

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: string;
  disabled?: boolean;
  className?: string;
}

export function Button({ label, onPress, variant = 'sun', icon, disabled, className = '' }: Props) {
  const s = STYLES[variant];
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={() => {
        tap();
        onPress();
      }}
      className={`min-h-[52px] flex-row items-center justify-center rounded-full px-6 active:opacity-80 ${s.box} ${
        disabled ? 'opacity-40' : ''
      } ${className}`}
    >
      {icon ? <Text className="mr-2 text-lg">{icon}</Text> : null}
      <Text className={`font-body-black text-base ${s.text}`}>{label}</Text>
    </Pressable>
  );
}
