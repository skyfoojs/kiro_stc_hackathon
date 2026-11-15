import { Eye, EyeOff } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, type TextInputProps, View } from 'react-native';

import { colors, ICON_STROKE, radius, space, type } from '@/constants/theme';

type Props = Omit<TextInputProps, 'style'> & { label: string; secret?: boolean };

export function TextField({ label, secret, ...input }: Props) {
  const [hidden, setHidden] = useState(true);
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.box, focused && styles.boxFocused]}>
        <TextInput
          {...input}
          accessibilityLabel={label}
          secureTextEntry={secret && hidden}
          placeholderTextColor={colors.inkSubtle}
          onFocus={(e) => {
            setFocused(true);
            input.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            input.onBlur?.(e);
          }}
          style={styles.input}
        />
        {secret && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
            hitSlop={12}
            onPress={() => setHidden((h) => !h)}
          >
            {hidden ? (
              <Eye color={colors.inkMuted} size={20} strokeWidth={ICON_STROKE} />
            ) : (
              <EyeOff color={colors.inkMuted} size={20} strokeWidth={ICON_STROKE} />
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.xs + 2 },
  label: { ...type.caption, color: colors.inkMuted, textTransform: 'uppercase', letterSpacing: 0.6 },
  box: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: space.lg,
  },
  boxFocused: { borderColor: colors.ink },
  input: { flex: 1, ...type.body, color: colors.ink, paddingVertical: space.md },
});
