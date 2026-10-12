import { TouchableOpacity, Text, View, StyleSheet, ActivityIndicator } from 'react-native'
import { fonts, radius } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'

const VARIANT_STYLE = {
  primary: 'primary',
  secondary: 'secondary',
  destructive: 'destructive',
}

export default function Button({ label, onPress, variant = 'primary', loading = false, disabled = false, icon: Icon, style }) {
  const { colors, isDark } = useTheme()
  const v = VARIANT_STYLE[variant] || 'primary'
  const labelColor = v === 'secondary' ? colors.textPrimary : v === 'destructive' ? colors.destructive : colors.accentFg

  const variantStyle = {
    primary: { backgroundColor: colors.accentBg },
    secondary: {
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.border,
    },
    // A soft red tint + outline, not a solid fill — matches the destructive
    // treatment already established elsewhere (ProfileScreen's sign-out row,
    // EvidenceBankScreen's error/retry styling) and reads right for both a
    // routine action (Sign Out) and a serious one (Delete Account) without
    // the latter needing an even heavier, one-off style of its own.
    destructive: {
      backgroundColor: isDark ? 'rgba(248,113,113,0.12)' : 'rgba(220,38,38,0.08)',
      borderWidth: 1.5,
      borderColor: isDark ? 'rgba(248,113,113,0.4)' : 'rgba(220,38,38,0.35)',
    },
  }[v]

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      style={[
        styles.base,
        variantStyle,
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={labelColor} />
      ) : (
        <View style={styles.content}>
          {!!Icon && <Icon size={16} color={labelColor} strokeWidth={2} />}
          <Text style={[styles.label, { color: labelColor }]}>
            {label}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  disabled: {
    opacity: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
  },
})
