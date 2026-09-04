import * as Linking from 'expo-linking'

// Deep-link config for the website↔app handoff (e.g. the "Open the App" button
// on the website's post-checkout page). Linking.createURL('/') resolves to the
// right prefix automatically for whichever environment is actually running —
// an exp:// dev-server URL under Expo Go (what every current tester uses,
// since there's no standalone build yet), or the uniblueprint:// scheme once
// a real build exists (app.json's "scheme"). Both work with the same config,
// so this isn't dead code waiting on a store release — it's live today.
//
// https:// prefixes are listed for forward-compatibility (so a share link
// typed as a normal https URL still opens the app once it's installed), but
// won't actually open the app from a browser tap until universal links are
// verified with Apple/Google — that needs Desmond's Apple Team ID and Android
// signing cert fingerprint hosted as apple-app-site-association / assetlinks.json
// on the website, which isn't available in this environment. Until then these
// prefixes are inert on web but harmless.
//
// Only route names that exist in the tree RootNavigator actually mounts at
// deep-link time will match — an auth-only path (sign-in, sign-up) resolves
// while signed out, an app path (profile, foundation, ...) resolves once
// signed in. There's no redirect-after-auth handoff yet (tapping a "profile"
// link while signed out just lands on the sign-in screen, not back on the
// original target after signing in) — a reasonable v2, not built here.
export const linking = {
  prefixes: [
    Linking.createURL('/'),
    'uniblueprint://',
    'https://uniblueprint.ie',
    'https://www.uniblueprint.ie',
  ],
  config: {
    screens: {
      // Auth stack — mounted while signed out
      Welcome:        'welcome',
      SignIn:         'sign-in',
      SignUp:         'sign-up',
      ForgotPassword: 'forgot-password',
      VerifyEmail:    'verify-email',

      // Main tabs — mounted while signed in. Each tab is its own Stack.Navigator,
      // so paths nest under the tab name that owns them.
      Home: {
        screens: {
          HomeMain:      'home',
          Foundation:    'foundation',
          Elevation:     'elevation',
          CampusConnect: 'campus-connect',
          CourseConnect: 'course-connect',
          Lifestyle:     'lifestyle',
          Budgeting:     'budgeting',
        },
      },
      AdBoard: {
        screens: { AdBoardMain: 'ad-board' },
      },
      Messages: {
        screens: { MessagesMain: 'messages' },
      },
      Directory: {
        screens: { DirectoryMain: 'directory' },
      },
      Profile: {
        screens: {
          ProfileMain: { path: 'profile', alias: ['subscription', 'pro'] }, // several paths, same destination — membership status lives on Profile
          PrivacyData: 'privacy',
          BlueprintTour: 'tour',
        },
      },
    },
  },
}
