import { useEffect, useRef, useState } from 'react'
import { View, TouchableOpacity, ScrollView, Animated, StyleSheet } from 'react-native'
import { ChevronLeft, ChevronRight } from 'lucide-react-native'
import UBPLogo from '../ui/UBPLogo'
import { colors, radius, shadows } from '../../constants/theme'

// ── SidebarRail — the old narrow, icon-only nav rail, desktop/web only ─────
//
// Distinct from (and rendered alongside) two other Home surfaces that stay
// completely unchanged: the "Quick Access" overview toggle, and the wide
// icon+label drawer opened by the ☰ hamburger (SidebarDrawer.jsx). This is
// a third, always-on-by-default rail — a slim always-visible companion to
// those, not a replacement for either.
//
// `items` is expected to be the same 8 destinations, same order, as
// SidebarDrawer's ITEMS list, so the two nav surfaces read as one system —
// just icon-only here instead of icon+label.
//
// Collapsing is handled by a small dedicated handle on the rail itself
// (not the ☰ hamburger, which stays wired exactly as it already is — it
// opens the wide drawer everywhere in the app, Home included, and
// overloading it with a second, Home-only meaning would make its behavior
// inconsistent from screen to screen). The handle is the same control both
// ways: it reads as "collapse" when expanded and "re-expand" when
// collapsed, so there's always a visible affordance back.
const EXPANDED_WIDTH  = 78
const COLLAPSED_WIDTH = 22
const ICON_SIZE   = 19
const CIRCLE_SIZE = 42

export default function SidebarRail({ items, activeKey, onNavigate }) {
  const [collapsed, setCollapsed] = useState(false)
  const widthAnim   = useRef(new Animated.Value(EXPANDED_WIDTH)).current
  const contentFade = useRef(new Animated.Value(1)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(widthAnim, {
        toValue: collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH,
        duration: 260,
        useNativeDriver: false,
      }),
      Animated.timing(contentFade, {
        toValue: collapsed ? 0 : 1,
        duration: collapsed ? 130 : 200,
        delay: collapsed ? 0 : 100,
        useNativeDriver: false,
      }),
    ]).start()
  }, [collapsed, widthAnim, contentFade])

  return (
    <Animated.View style={[styles.rail, { width: widthAnim }]}>
      <Animated.View style={[styles.body, { opacity: contentFade }]} pointerEvents={collapsed ? 'none' : 'auto'}>
        <View style={styles.logoWrap}>
          <UBPLogo height={26} color={colors.cream} onPress={() => onNavigate({ action: 'home' })} />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.itemsCol}
        >
          {items.map(item => {
            const isActive = item.key === activeKey
            return (
              <TouchableOpacity
                key={item.key}
                activeOpacity={0.7}
                onPress={() => onNavigate(item)}
                accessibilityRole="button"
                accessibilityLabel={item.label.replace('\n', ' ')}
                accessibilityState={{ selected: isActive }}
                style={styles.itemOuter}
              >
                <View style={[styles.iconCircle, isActive && styles.iconCircleActive]}>
                  <item.Icon
                    size={ICON_SIZE}
                    color={isActive ? colors.goldLight : 'rgba(245,240,232,0.55)'}
                    strokeWidth={isActive ? 2.1 : 1.7}
                  />
                </View>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </Animated.View>

      <TouchableOpacity
        style={styles.handle}
        activeOpacity={0.8}
        onPress={() => setCollapsed(c => !c)}
        accessibilityRole="button"
        accessibilityLabel={collapsed ? 'Expand navigation rail' : 'Collapse navigation rail'}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        {collapsed
          ? <ChevronRight size={12} color={colors.navy} strokeWidth={2.6} />
          : <ChevronLeft size={12} color={colors.navy} strokeWidth={2.6} />}
      </TouchableOpacity>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  rail: {
    backgroundColor: colors.navy,
    borderRightWidth: 1,
    borderRightColor: 'rgba(245,240,232,0.09)',
    zIndex: 20,
    elevation: 20,
  },
  body: { flex: 1 },
  logoWrap: {
    paddingTop: 16, paddingBottom: 14, paddingHorizontal: 10,
    alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: 'rgba(245,240,232,0.09)',
  },
  itemsCol: {
    alignItems: 'center',
    paddingTop: 12, paddingBottom: 20,
    gap: 4,
  },
  itemOuter: { alignItems: 'center', justifyContent: 'center', padding: 4 },
  iconCircle: {
    width: CIRCLE_SIZE, height: CIRCLE_SIZE, borderRadius: radius.circle,
    alignItems: 'center', justifyContent: 'center',
  },
  iconCircleActive: {
    backgroundColor: 'rgba(201,162,75,0.20)',
    borderWidth: 1, borderColor: 'rgba(201,162,75,0.45)',
  },
  // Pinned to the rail's own right edge and tracks it through the width
  // animation (it's positioned relative to `rail`, not the screen), so it
  // reads as one continuous affordance whether the rail is expanding or
  // collapsing, not a control that jumps at the end of the animation.
  handle: {
    position: 'absolute',
    top: '50%', marginTop: -14,
    right: -13,
    width: 26, height: 28,
    borderRadius: radius.circle,
    backgroundColor: colors.goldLight,
    borderWidth: 1.5, borderColor: colors.cream,
    alignItems: 'center', justifyContent: 'center',
    ...shadows.elevated,
  },
})
