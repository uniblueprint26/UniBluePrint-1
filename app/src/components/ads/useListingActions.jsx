import { useState, useCallback } from 'react'
import { Linking, Platform } from 'react-native'
import { useAuth } from '../../context/AuthContext'
import { useReport } from '../safety/ReportProvider'
import { openInHomeStack } from '../../navigation/helpers'
import PostListingSheet from './PostListingSheet'
import PostAdModal from './PostAdModal'
import PartnerContactModal from './PartnerContactModal'
import ListingDetailModal from './ListingDetailModal'

/**
 * useListingActions — everything a tap on the Ad Board can do, shared by the
 * Ad Board tab and the basket screens: open a listing (partner card, a paid
 * ad's own link, or a detail card that can message the poster), open a UBP
 * card in the app feature it points to, and the Post a listing flow.
 *
 * Returns the handlers plus `modals`, the elements to render once per screen.
 */
export default function useListingActions(navigation, { onAdClosed } = {}) {
  const { user } = useAuth()
  const { openReport } = useReport()
  const [postOpen, setPostOpen] = useState(false)
  const [adOpen, setAdOpen] = useState(false)
  const [detail, setDetail] = useState(null)
  const [contactAd, setContactAd] = useState(null)

  const openLink = useCallback(url => {
    if (!url) return
    if (Platform.OS === 'web') window.open(url, '_blank')
    else Linking.openURL(url)
  }, [])

  const openPost = useCallback(() => setPostOpen(true), [])

  function openItem(item) {
    if (item.action === 'link') return openLink(item.link)
    if (item.action === 'partner') {
      return setContactAd({
        id: item.id,
        brand: item.partner?.name || item.title,
        title: item.title,
        description: item.description,
        partnerSlug: item.partner?.slug || null,
        hasContact: !!item.partner?.slug,
      })
    }
    setDetail(item)
  }

  // A "Posted by UBP" card: open the feature of the app it comes from.
  function openUbpCard(card) {
    const a = card.action || {}
    if (a.type === 'post') return setPostOpen(true)
    if (a.type === 'weekly') return navigation.navigate('WeeklyBlueprint')
    if (a.type === 'home') return openInHomeStack(navigation, a.route, a.params)
    if (a.type === 'web') return openLink(a.url)
  }

  function openBoard(item) {
    const b = item.board
    if (!b) return
    setDetail(null)
    navigation.navigate('BoardDetail', { boardKey: b.key, ...(b.registry !== 'campus' ? { registry: b.registry } : {}) })
  }

  function messagePoster(item) {
    const b = item.board
    setDetail(null)
    navigation.navigate('ChatRoom', {
      contextType: 'board',
      contextId: `${b?.key || item.source}-${item.id}`,
      roomName: item.title,
      subtitle: b?.title || 'Ad Board',
      posterId: item.ownerId,
      posterName: item.posterName,
    })
  }

  // Report (and block the poster) through the shared sheet. The detail card
  // closes first so the two sheets never sit on top of each other.
  function report(item) {
    setDetail(null)
    setTimeout(() => openReport({
      contentType: item.source || 'ad_listing',
      contentId: item.id,
      reportedUserId: item.ownerId || null,
      userName: item.posterName || null,
      noun: 'listing',
    }), 350)
  }

  function pickPost(option) {
    setPostOpen(false)
    if (option.paid) { setAdOpen(true); return }
    const { boardKey, registry } = option.route
    navigation.navigate('BoardDetail', { boardKey, openPostForm: true, ...(registry ? { registry } : {}) })
  }

  // Rides and lost property live in Campus Connect, not here.
  function goCampusConnect() {
    setPostOpen(false)
    openInHomeStack(navigation, 'CampusConnect')
  }

  const modals = (
    <>
      <PostListingSheet visible={postOpen} onClose={() => setPostOpen(false)} onPick={pickPost} onCampusConnect={goCampusConnect} />
      <PostAdModal visible={adOpen} onClose={() => { setAdOpen(false); onAdClosed?.() }} />
      <PartnerContactModal ad={contactAd} visible={!!contactAd} onClose={() => setContactAd(null)} />
      <ListingDetailModal
        item={detail}
        visible={!!detail}
        isOwn={!!detail && !!user?.id && detail.ownerId === user.id}
        onClose={() => setDetail(null)}
        onMessage={messagePoster}
        onOpenLink={openLink}
        onOpenBoard={openBoard}
        onReport={report}
      />
    </>
  )

  return { openItem, openUbpCard, openPost, openLink, modals }
}
