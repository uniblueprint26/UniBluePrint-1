import { useState, useRef } from 'react'
import {
  View, Text, Image, TouchableOpacity, StyleSheet, Modal, ScrollView, useWindowDimensions,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { X } from 'lucide-react-native'
import { fonts, radius } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'

// The pictures of one post, laid out by how many there are (1 to 6):
//
//   1  one wide picture
//   2  two side by side
//   3  one tall on the left, two stacked on the right
//   4  two by two
//   5  two on top, three below
//   6  two rows of three
//
// Tap any picture to open them full screen and swipe through. Old posts with a
// single photo_url come in as a list of one, so they look as they always did.

const GAP = 3
const HEIGHT = 280

export default function PostGallery({ images, style, height = HEIGHT }) {
  const { colors } = useTheme()
  const [viewerAt, setViewerAt] = useState(null)
  const list = (images || []).filter(Boolean).slice(0, 6)
  if (list.length === 0) return null

  const s = styles(colors)

  function tile(uri, index, tileStyle) {
    return (
      <TouchableOpacity
        key={uri + index}
        activeOpacity={0.9}
        style={[s.tile, tileStyle]}
        onPress={() => setViewerAt(index)}
        accessibilityRole="imagebutton"
        accessibilityLabel={`Picture ${index + 1} of ${list.length}. Tap to open`}
      >
        <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      </TouchableOpacity>
    )
  }

  let body
  const n = list.length
  if (n === 1) {
    body = <View style={{ height }}>{tile(list[0], 0, { flex: 1 })}</View>
  } else if (n === 2) {
    body = (
      <View style={[s.row, { height }]}>
        {tile(list[0], 0, { flex: 1 })}
        {tile(list[1], 1, { flex: 1 })}
      </View>
    )
  } else if (n === 3) {
    body = (
      <View style={[s.row, { height }]}>
        {tile(list[0], 0, { flex: 1 })}
        <View style={s.col}>
          {tile(list[1], 1, { flex: 1 })}
          {tile(list[2], 2, { flex: 1 })}
        </View>
      </View>
    )
  } else if (n === 4) {
    body = (
      <View style={[s.stack, { height }]}>
        <View style={s.rowFill}>{tile(list[0], 0, { flex: 1 })}{tile(list[1], 1, { flex: 1 })}</View>
        <View style={s.rowFill}>{tile(list[2], 2, { flex: 1 })}{tile(list[3], 3, { flex: 1 })}</View>
      </View>
    )
  } else if (n === 5) {
    body = (
      <View style={[s.stack, { height }]}>
        <View style={s.rowFill}>{tile(list[0], 0, { flex: 1 })}{tile(list[1], 1, { flex: 1 })}</View>
        <View style={s.rowFill}>{tile(list[2], 2, { flex: 1 })}{tile(list[3], 3, { flex: 1 })}{tile(list[4], 4, { flex: 1 })}</View>
      </View>
    )
  } else {
    body = (
      <View style={[s.stack, { height }]}>
        <View style={s.rowFill}>{tile(list[0], 0, { flex: 1 })}{tile(list[1], 1, { flex: 1 })}{tile(list[2], 2, { flex: 1 })}</View>
        <View style={s.rowFill}>{tile(list[3], 3, { flex: 1 })}{tile(list[4], 4, { flex: 1 })}{tile(list[5], 5, { flex: 1 })}</View>
      </View>
    )
  }

  return (
    <View style={[s.wrap, style]}>
      {body}
      <GalleryViewer images={list} startAt={viewerAt} onClose={() => setViewerAt(null)} />
    </View>
  )
}

// Full screen, swipe left and right, with a counter. Always dark, because
// pictures look best on black.
function GalleryViewer({ images, startAt, onClose }) {
  const insets = useSafeAreaInsets()
  const { width, height } = useWindowDimensions()
  const [page, setPage] = useState(0)
  const ref = useRef(null)
  const open = startAt != null

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      onShow={() => {
        setPage(startAt || 0)
        ref.current?.scrollTo?.({ x: (startAt || 0) * width, animated: false })
      }}
    >
      <View style={v.backdrop}>
        <ScrollView
          ref={ref}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          contentOffset={{ x: (startAt || 0) * width, y: 0 }}
          onMomentumScrollEnd={e => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
          style={{ flex: 1 }}
        >
          {images.map((uri, i) => (
            <View key={uri + i} style={{ width, height, justifyContent: 'center' }}>
              <Image source={{ uri }} style={{ width, height: height * 0.8 }} resizeMode="contain" />
            </View>
          ))}
        </ScrollView>
        <View style={[v.top, { paddingTop: insets.top + 10 }]} pointerEvents="box-none">
          <View style={v.counter}>
            <Text style={v.counterText}>{page + 1} of {images.length}</Text>
          </View>
          <TouchableOpacity
            style={v.close}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close pictures"
            hitSlop={10}
          >
            <X size={18} color="#fff" strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

function styles(colors) {
  return StyleSheet.create({
    wrap: { borderRadius: radius.card, overflow: 'hidden', backgroundColor: colors.border },
    row: { flexDirection: 'row', gap: GAP },
    col: { flex: 1, gap: GAP },
    stack: { gap: GAP },
    rowFill: { flex: 1, flexDirection: 'row', gap: GAP },
    tile: { overflow: 'hidden', backgroundColor: colors.border },
  })
}

const v = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: '#000' },
  top: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  counter: { backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  counterText: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: '#fff' },
  close: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center', justifyContent: 'center',
  },
})
