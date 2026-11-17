export function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60)     return 'Just now'
  if (diff < 3600)   return `${Math.floor(diff / 60)}m`
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h`
  if (diff < 172800) return 'Yesterday'
  return new Date(dateStr).toLocaleDateString('en-IE', { day: 'numeric', month: 'short' })
}

export function roomInitials(name) {
  if (!name) return '?'
  const words = name.trim().split(' ').filter(Boolean)
  if (words.length === 1) return words[0][0].toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}
