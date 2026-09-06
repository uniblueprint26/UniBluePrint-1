/**
 * FileUploader — pick / upload a PDF or image document.
 *
 * Sibling to ImageUploader, but for Course Connect's Shared Notes and Past
 * Papers boards, which need real documents (PDF scans, photographed pages)
 * rather than a square profile-style photo. No client-side compression —
 * files are uploaded as-is (subject to the size cap below).
 *
 * Props:
 *   bucket       — Supabase Storage bucket name
 *   storagePath  — path within the bucket; the actual object key gets the
 *                  picked file's extension appended, e.g. `${storagePath}.pdf`
 *   onUpload     — (url: string, meta: { name, mimeType, sizeBytes }) => void
 *   label        — optional label above the picker
 */
import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import * as DocumentPicker from 'expo-document-picker'
import { FileText, Image as ImageIcon, Upload, X, CheckCircle2 } from 'lucide-react-native'
import { supabase } from '../../lib/supabase'
import { colors, fonts, radius } from '../../constants/theme'

const MAX_BYTES = 15 * 1024 * 1024 // 15 MB — notes/papers are often scanned PDFs

function extFromNameOrType(name, mimeType) {
  const fromName = (name || '').split('.').pop()?.toLowerCase()
  if (fromName && fromName.length <= 5) return fromName
  if ((mimeType || '').includes('pdf')) return 'pdf'
  if ((mimeType || '').includes('png')) return 'png'
  return 'jpg'
}

export default function FileUploader({ bucket, storagePath, onUpload, label = 'File' }) {
  const [picked, setPicked] = useState(null) // { uri, name, mimeType, size }
  const [uploading, setUploading] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)
  const [uploadedName, setUploadedName] = useState(null)

  async function pick() {
    setErrorMsg(null)
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
      copyToCacheDirectory: true,
      multiple: false,
    })
    if (result.canceled || !result.assets?.length) return
    const asset = result.assets[0]
    if (asset.size && asset.size > MAX_BYTES) {
      setErrorMsg('File is over 15 MB — please choose a smaller file.')
      return
    }
    setPicked(asset)
    setUploadedName(null)
  }

  async function upload() {
    if (!picked || uploading) return
    setUploading(true)
    setErrorMsg(null)
    try {
      const response = await fetch(picked.uri)
      const blob = await response.blob()
      if (blob.size > MAX_BYTES) {
        setErrorMsg('File is over 15 MB — please choose a smaller file.')
        setUploading(false)
        return
      }
      const ext = extFromNameOrType(picked.name, picked.mimeType)
      const path = `${storagePath}.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from(bucket)
        .upload(path, blob, { contentType: picked.mimeType || 'application/octet-stream', upsert: true })
      if (uploadErr) throw uploadErr
      const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path)
      setUploadedName(picked.name)
      setPicked(null)
      onUpload(publicUrl, { name: picked.name, mimeType: picked.mimeType, sizeBytes: blob.size })
    } catch {
      setErrorMsg('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  function cancelPick() {
    setPicked(null)
    setErrorMsg(null)
  }

  const isPdf = mt => (mt || '').includes('pdf')

  return (
    <View style={s.root}>
      {!!label && <Text style={s.label}>{label}</Text>}

      {uploadedName ? (
        <View style={s.doneRow}>
          <CheckCircle2 size={16} color={colors.success} />
          <Text style={s.doneText} numberOfLines={1}>{uploadedName}</Text>
          <TouchableOpacity onPress={pick} activeOpacity={0.8}>
            <Text style={s.changeText}>Change</Text>
          </TouchableOpacity>
        </View>
      ) : picked ? (
        <View style={s.pickedBox}>
          <View style={s.pickedRow}>
            {isPdf(picked.mimeType) ? <FileText size={18} color={colors.navy} /> : <ImageIcon size={18} color={colors.navy} />}
            <Text style={s.pickedName} numberOfLines={1}>{picked.name}</Text>
          </View>
          {uploading ? (
            <View style={s.row}>
              <ActivityIndicator size="small" color={colors.navy} />
              <Text style={s.statusText}>Uploading…</Text>
            </View>
          ) : (
            <View style={s.row}>
              <TouchableOpacity style={s.uploadBtn} onPress={upload} activeOpacity={0.8}>
                <Upload size={13} color={colors.cream} strokeWidth={2} />
                <Text style={s.uploadBtnText}>Upload</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.cancelBtn} onPress={cancelPick} activeOpacity={0.8}>
                <X size={13} color={colors.muted} strokeWidth={2} />
                <Text style={s.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ) : (
        <TouchableOpacity style={s.pickBtn} onPress={pick} activeOpacity={0.8}>
          <Upload size={14} color={colors.navy} strokeWidth={2} />
          <Text style={s.pickBtnText}>Choose PDF or image</Text>
        </TouchableOpacity>
      )}

      {!!errorMsg && <Text style={s.errorText}>{errorMsg}</Text>}
    </View>
  )
}

const s = StyleSheet.create({
  root: { gap: 8 },
  label: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  pickBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.cream, borderRadius: radius.card, borderWidth: 1, borderColor: 'rgba(30,58,95,0.15)',
    paddingVertical: 14,
  },
  pickBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.navy },
  pickedBox: { backgroundColor: colors.cream, borderRadius: radius.card, padding: 12, gap: 10 },
  pickedRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pickedName: { flex: 1, fontFamily: fonts.sans, fontSize: 13, color: colors.navy },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.navy, borderRadius: radius.pill, paddingHorizontal: 16, paddingVertical: 9 },
  uploadBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.cream },
  cancelBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: radius.pill, borderWidth: 1, borderColor: 'rgba(30,58,95,0.15)', paddingHorizontal: 14, paddingVertical: 9 },
  cancelBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.muted },
  statusText: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted },
  doneRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.cream, borderRadius: radius.card, padding: 12 },
  doneText: { flex: 1, fontFamily: fonts.sans, fontSize: 13, color: colors.navy },
  changeText: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.navy },
  errorText: { fontFamily: fonts.sans, fontSize: 12, color: colors.destructive },
})
