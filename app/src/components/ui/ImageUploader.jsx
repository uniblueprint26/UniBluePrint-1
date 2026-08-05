/**
 * ImageUploader — shared pick / compress / upload component.
 *
 * Used in four contexts:
 *   profile-pictures  — ProfileScreen "Edit Profile" (self-serve, fixed path, upsert)
 *   coach-photos      — admin/operations only, no mobile UI yet
 *   partner-logos     — admin/operations only, no mobile UI yet
 *   ad-images         — PostAdModal (self-serve, timestamp path)
 *
 * Props:
 *   bucket       — Supabase Storage bucket name
 *   storagePath  — path within the bucket, e.g. `${userId}/avatar.jpg`
 *   currentUrl   — existing public URL shown as preview (file deleted before re-upload
 *                  when path changes; with fixed paths + upsert, deletion is skipped)
 *   onUpload     — (url: string) => void — called with public URL on success
 *   label        — optional label above the picker (default 'Photo')
 *   size         — preview circle diameter in px (default 80)
 */

import { useState } from 'react'
import {
  View, Text, TouchableOpacity, Image, StyleSheet,
  ActivityIndicator, Alert, Platform,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator'
import { Camera, Upload, X, RefreshCw } from 'lucide-react-native'
import { supabase } from '../../lib/supabase'
import { colors, fonts, radius } from '../../constants/theme'

// ── Config ────────────────────────────────────────────────────────────────────

// Max longest-edge dimension after resize, per bucket
const MAX_DIM = {
  'profile-pictures': 600,
  'coach-photos':     800,
  'partner-logos':    400,
  'ad-images':        1200,
}

const MAX_BYTES = 5 * 1024 * 1024  // 5 MB

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Extract the storage object path from a Supabase public URL.
 * e.g. https://xxx.supabase.co/storage/v1/object/public/profile-pictures/uid/avatar.jpg
 *   → "uid/avatar.jpg"
 * Returns null if the URL doesn't match the expected pattern.
 */
function pathFromPublicUrl(url, bucket) {
  try {
    const marker = `/object/public/${bucket}/`
    const idx    = url.indexOf(marker)
    return idx === -1 ? null : url.slice(idx + marker.length)
  } catch {
    return null
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ImageUploader({
  bucket,
  storagePath,
  currentUrl  = null,
  onUpload,
  label       = 'Photo',
  size        = 80,
}) {
  const [localUri,  setLocalUri]  = useState(null)   // picked, awaiting user confirmation
  const [uploading, setUploading] = useState(false)
  const [errorMsg,  setErrorMsg]  = useState(null)
  const [uploaded,  setUploaded]  = useState(false)  // true once this session uploaded

  // ── Pick ────────────────────────────────────────────────────────────────────

  async function pickImage() {
    // Request media library permission on native
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert(
          'Permission required',
          'Please allow access to your photo library in Settings to upload an image.',
          [{ text: 'OK' }],
        )
        return
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes:    ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect:        [1, 1],
      quality:       0.9,
    })

    if (result.canceled || !result.assets?.length) return

    const asset = result.assets[0]

    // Pre-pick size check (fileSize may not be present on all devices)
    if (asset.fileSize && asset.fileSize > MAX_BYTES) {
      Alert.alert('File too large', 'Please choose an image under 5 MB.')
      return
    }

    // File type check — reject anything that isn't jpg/png/webp
    const mime = (asset.mimeType || '').toLowerCase()
    const uri  = (asset.uri     || '').toLowerCase()
    const validType =
      mime.startsWith('image/jpeg') || mime.startsWith('image/png') || mime.startsWith('image/webp') ||
      uri.endsWith('.jpg') || uri.endsWith('.jpeg') || uri.endsWith('.png') || uri.endsWith('.webp')

    if (!validType) {
      Alert.alert('Unsupported format', 'Please choose a JPG, PNG, or WebP image.')
      return
    }

    // Show local preview; user must confirm before upload
    setLocalUri(asset.uri)
    setErrorMsg(null)
    setUploaded(false)
  }

  // ── Upload ──────────────────────────────────────────────────────────────────

  async function uploadImage() {
    if (!localUri || uploading) return
    setUploading(true)
    setErrorMsg(null)

    try {
      // 1. Resize and compress
      const maxDim    = MAX_DIM[bucket] ?? 800
      const processed = await manipulateAsync(
        localUri,
        [{ resize: { width: maxDim } }],
        { compress: 0.82, format: SaveFormat.JPEG },
      )

      // 2. Read as blob for upload
      const response = await fetch(processed.uri)
      const blob     = await response.blob()

      // 3. Post-compression size guard
      if (blob.size > MAX_BYTES) {
        setErrorMsg('Image is still over 5 MB after compression. Please choose a smaller image.')
        setUploading(false)
        return
      }

      // 4. Best-effort cleanup of previous file when the path will change.
      //    For fixed-path uploads (profile avatars using upsert), skip deletion —
      //    upsert overwrites in place and there is nothing to clean up.
      if (currentUrl && !uploaded) {
        const oldPath = pathFromPublicUrl(currentUrl, bucket)
        const newPath = storagePath
        if (oldPath && oldPath !== newPath) {
          // Ignore errors — cleanup failure must not block the new upload
          await supabase.storage.from(bucket).remove([oldPath]).catch(() => {})
        }
      }

      // 5. Upload (upsert overwrites files at the same path)
      const { error: uploadErr } = await supabase.storage
        .from(bucket)
        .upload(storagePath, blob, { contentType: 'image/jpeg', upsert: true })

      if (uploadErr) throw uploadErr

      // 6. Resolve public URL and report back
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(storagePath)

      setUploaded(true)
      setLocalUri(null)
      onUpload(publicUrl)

    } catch {
      setErrorMsg('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  function cancelPick() {
    setLocalUri(null)
    setErrorMsg(null)
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  // Preview hierarchy: local pick → current remote URL → empty
  const previewUri = localUri ?? (uploaded ? null : currentUrl) ?? null

  return (
    <View style={s.root}>
      {!!label && <Text style={s.label}>{label}</Text>}

      {/* Preview circle — tap to pick when idle */}
      <TouchableOpacity
        style={[s.circle, { width: size, height: size, borderRadius: size / 2 }]}
        onPress={!localUri && !uploading ? pickImage : undefined}
        activeOpacity={0.75}
      >
        {previewUri ? (
          <Image
            source={{ uri: previewUri }}
            style={{ width: size, height: size }}
            resizeMode="cover"
          />
        ) : (
          <Camera size={size * 0.36} color={colors.muted} strokeWidth={1.4} />
        )}
      </TouchableOpacity>

      {/* Confirm row — shown after picking, before upload */}
      {localUri && !uploading && (
        <View style={s.row}>
          <TouchableOpacity style={s.uploadBtn} onPress={uploadImage} activeOpacity={0.8}>
            <Upload size={13} color={colors.cream} strokeWidth={2} />
            <Text style={s.uploadBtnText}>Upload</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.cancelBtn} onPress={cancelPick} activeOpacity={0.8}>
            <X size={13} color={colors.muted} strokeWidth={2} />
            <Text style={s.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Upload progress */}
      {uploading && (
        <View style={s.row}>
          <ActivityIndicator size="small" color={colors.navy} />
          <Text style={s.statusText}>Uploading…</Text>
        </View>
      )}

      {/* Error with retry */}
      {!!errorMsg && !uploading && (
        <View style={s.errorWrap}>
          <Text style={s.errorText}>{errorMsg}</Text>
          <TouchableOpacity onPress={uploadImage} activeOpacity={0.8}>
            <Text style={s.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Pick / change button — shown when idle (no local pick in progress) */}
      {!localUri && !uploading && (
        <TouchableOpacity style={s.changeBtn} onPress={pickImage} activeOpacity={0.8}>
          <RefreshCw size={12} color={colors.navy} strokeWidth={2} />
          <Text style={s.changeBtnText}>
            {currentUrl || uploaded ? 'Change photo' : 'Choose photo'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root:  { alignItems: 'center', gap: 12 },
  label: {
    fontFamily: fonts.sansSemiBold, fontSize: 11,
    color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.7,
  },

  circle: {
    backgroundColor: 'rgba(30,58,95,0.06)',
    borderWidth: 1.5, borderColor: 'rgba(30,58,95,0.12)',
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },

  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },

  uploadBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.navy, borderRadius: radius.pill,
    paddingHorizontal: 18, paddingVertical: 9,
  },
  uploadBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.cream },

  cancelBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: radius.pill,
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.15)',
    paddingHorizontal: 14, paddingVertical: 9,
  },
  cancelBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.muted },

  statusText: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted },

  errorWrap: { alignItems: 'center', gap: 6 },
  errorText: {
    fontFamily: fonts.sans, fontSize: 13, color: '#DC2626',
    textAlign: 'center', lineHeight: 19,
  },
  retryText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.navy },

  changeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: radius.pill,
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.15)',
    paddingHorizontal: 16, paddingVertical: 8,
  },
  changeBtnText: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.navy },
})
