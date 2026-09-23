import { TextInput, View } from 'react-native';
import { Label } from './Text';

interface Props {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'number-pad' | 'decimal-pad';
  maxLength?: number;
}

export function Field({ label, value, onChangeText, placeholder, multiline, keyboardType = 'default', maxLength = 500 }: Props) {
  return (
    <View className="mb-4">
      <Label className="mb-2">{label}</Label>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9A9CB5"
        multiline={multiline}
        keyboardType={keyboardType}
        maxLength={maxLength}
        className={`rounded-2xl border border-ink/10 bg-white px-4 py-3 font-body text-base text-ink ${multiline ? 'min-h-[96px]' : ''}`}
        style={multiline ? { textAlignVertical: 'top' } : undefined}
      />
    </View>
  );
}
