import { useState, useEffect } from 'react'
import { View, TouchableOpacity, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { SquarePen } from 'lucide-react-native'
import AppHeader, { PageTitle } from '../components/ui/AppHeader'
import SegmentedControl from '../components/messages/SegmentedControl'
import ChatsTab from '../components/messages/ChatsTab'
import RequestsTab from '../components/messages/RequestsTab'
import NewMessageSheet from '../components/messages/NewMessageSheet'
import DirectoryBrowser from '../components/directory/DirectoryBrowser'
import { useChatRooms } from '../components/messages/useChatRooms'
import { useMessageRequests } from '../components/messages/useMessageRequests'
import { useFollows } from '../components/messages/useFollows'
import { useDirectoryData } from '../components/directory/useDirectoryData'
import { useTheme } from '../context/ThemeContext'
import SlowLoad from '../components/ui/SlowLoad'

// Messages: Chats, Discover (find people, follow them) and Requests (nobody
// can message you until you accept). People used to live in the Directory
// tab; Discover embeds the same list, search and filters.

export default function MessagesScreen({ navigation, route }) {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const [tab, setTab] = useState(route?.params?.tab || 'chats')
  const [composeVisible, setComposeVisible] = useState(false)
  // The tab can be set again from a notification tap while this screen is open.
  useEffect(() => { if (route?.params?.tab) setTab(route.params.tab) }, [route?.params?.tab])

  const { rooms, loading: roomsLoading, failed: roomsFailed, reload: reloadRooms } = useChatRooms()
  const requestsState = useMessageRequests()
  const follows = useFollows()
  // One Directory fetch feeds both Discover and the Requests suggestions.
  const directory = useDirectoryData()

  const bottomPad = insets.bottom + 32

  function openRoom(room) {
    navigation.navigate('ChatRoom', {
      contextType: room.contextType,
      contextId:   room.contextId,
      roomName:    room.name,
      subtitle:    null,
      // For a direct room, re-pass the resolved peer so the chat can still
      // add them if an earlier join never completed.
      posterId:    room.contextType === 'direct' ? room.otherUserId : null,
      posterName:  room.contextType === 'direct' ? room.name        : null,
    })
  }

  // The full profile screen lives in the Directory stack (hidden tab), so
  // open it through there. DirectoryScreen sends Back to Messages.
  function openProfile(student) {
    if (!student) return
    try {
      if (navigation.getState?.()?.routeNames?.includes('StudentProfile')) {
        navigation.navigate('StudentProfile', { student })
        return
      }
    } catch {}
    navigation.getParent()?.navigate('Directory', {
      screen: 'DirectoryMain',
      params: { openStudent: student, from: 'messages' },
    })
  }

  const tabs = [
    { key: 'chats', label: 'Chats' },
    { key: 'discover', label: 'Discover' },
    { key: 'requests', label: 'Requests', badge: requestsState.requests.length },
  ]

  return (
    <View style={[s.screen, { backgroundColor: colors.background }]}>
      <AppHeader navigation={navigation} />
      <PageTitle
        title="Messages"
        right={
          <TouchableOpacity
            style={[s.compose, { backgroundColor: colors.tabFill }]}
            activeOpacity={0.8}
            onPress={() => setComposeVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Start a new conversation"
          >
            <SquarePen size={20} color={colors.textPrimary} strokeWidth={1.8} />
          </TouchableOpacity>
        }
      />
      <SegmentedControl tabs={tabs} value={tab} onChange={setTab} />

      <View style={s.body}>
        {tab === 'chats' && (
          <ChatsTab
            rooms={rooms}
            loading={roomsLoading}
            failed={roomsFailed}
            onRetry={reloadRooms}
            onOpenRoom={openRoom}
            onFindPeople={() => setTab('discover')}
            bottomPad={bottomPad}
          />
        )}
        {tab === 'discover' && (
          <DirectoryBrowser data={directory} follows={follows} onOpenProfile={openProfile} bottomPad={bottomPad} />
        )}
        {tab === 'requests' && (
          <RequestsTab
            navigation={navigation}
            requestsState={requestsState}
            directory={directory}
            follows={follows}
            onOpenProfile={openProfile}
            bottomPad={bottomPad}
          />
        )}
      </View>

      <SlowLoad loading={tab === 'chats' && roomsLoading} />

      <NewMessageSheet
        visible={composeVisible}
        onClose={() => setComposeVisible(false)}
        onOpenChat={params => { setComposeVisible(false); navigation.navigate('ChatRoom', params) }}
      />
    </View>
  )
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  body: { flex: 1, paddingTop: 8 },
  compose: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
})
