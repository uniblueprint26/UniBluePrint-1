import { TouchableOpacity, Text, View, StyleSheet, ActivityIndicator } from 'react-native'
import { colors, fonts, radius } from '../../constants/theme'

const VARIANT_STYLE = {
  primary: 'primary',
  secondary: 'secondary',
  destructive: 'destructive',
}

export default function Button({ label, onPress, variant = 'primary', loading = false, disabled = false, icon: Icon, style }) {
  const v = VARIANT_STYLE[variant] || 'primary'
  const labelColor = v === 'secondary' ? colors.navy : v === 'destructive' ? colors.destructive : colors.cream

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      style={[
        styles.base,
        styles[v],
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={labelColor} />
      ) : (
        <View style={styles.content}>
          {!!Icon && <Icon size={16} color={labelColor} strokeWidth={2} />}
          <Text style={[styles.label, styles[`label${v[0].toUpperCase()}${v.slice(1)}`]]}>
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
  primary: {
    backgroundColor: colors.navy,
  },
  secondary: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: 'rgba(30,58,95,0.15)',
  },
  // A soft red tint + outline, not a solid fill — matches the destructive
  // treatment already established elsewhere (ProfileScreen's sign-out row,
  // EvidenceBankScreen's error/retry styling) and reads right for both a
  // routine action (Sign Out) and a serious one (Delete Account) without
  // the latter needing an even heavier, one-off style of its own.
  destructive: {
    backgroundColor: 'rgba(220,38,38,0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(220,38,38,0.35)',
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
  labelPrimary: {
    color: colors.cream,
  },
  labelSecondary: {
    color: colors.navy,
  },
  labelDestructive: {
    color: colors.destructive,
  },
})
