import 'react-native-gesture-handler'
import 'react-native-url-polyfill/auto'
import { enableFreeze } from 'react-native-screens'
import { registerRootComponent } from 'expo'
import App from './App'

// Required for navigation/index.jsx's `freezeOnBlur: true` to actually do
// anything — it's the opt-in global switch for react-native-screens' freeze
// machinery (built on react-freeze). Without this call, freezeOnBlur is a
// silent no-op: no error, no warning, screens just never freeze. Must run
// before the app mounts its first screen, so it belongs here, not in App.jsx.
enableFreeze(true)

registerRootComponent(App)
