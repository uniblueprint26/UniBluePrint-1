import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native'
import { colors, fonts, radius } from '../../constants/theme'

export default function Button({ label, onPress, variant = 'primary', loading = false, disabled = false, style }) {
  const isPrimary = variant === 'primary'

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.base,
        isPrimary ? styles.primary : styles.secondary,
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={isPrimary ? colors.cream : colors.navy} />
      ) : (
        <Text style={[styles.label, isPrimary ? styles.labelPrimary : styles.labelSecondary]}>
          {label}
        </Text>
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
  disabled: {
    opacity: 0.5,
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
})
