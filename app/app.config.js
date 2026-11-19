// Expo app config. This replaces app.json (every value from it is kept below).
// It is a .js file so secrets come from the environment and never from the repo.
//
// Environment variables (set them in EAS, see docs/release/release-checklist.md):
//   EXPO_PUBLIC_SUPABASE_URL        the Supabase project URL
//   EXPO_PUBLIC_SUPABASE_ANON_KEY   the Supabase anon (public) key
//   GOOGLE_MAPS_ANDROID_API_KEY     Google Maps SDK for Android key (partner map)
// Optional:
//   EXPO_PUBLIC_SENTRY_DSN          crash reporting, a no-op when unset
//   GOOGLE_SERVICES_JSON            path to google-services.json (an EAS file
//                                   variable), needed for push notifications on Android
//
// A production EAS build (EAS_BUILD_PROFILE === 'production') stops with a clear
// error if one of the three required variables is missing. Without this check
// src/lib/supabase.js would quietly fall back to its placeholder URL and the
// store build would ship pointing at nothing.

const IS_PRODUCTION_BUILD = process.env.EAS_BUILD_PROFILE === 'production'

const REQUIRED_FOR_PRODUCTION = [
  'EXPO_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_SUPABASE_ANON_KEY',
  'GOOGLE_MAPS_ANDROID_API_KEY',
]

if (IS_PRODUCTION_BUILD) {
  const missing = REQUIRED_FOR_PRODUCTION.filter(name => !String(process.env[name] || '').trim())
  if (missing.length > 0) {
    throw new Error(
      `Production build stopped. These environment variables are missing: ${missing.join(', ')}. ` +
      'Set them for the production profile in EAS (eas env:create, or expo.dev > Project > Environment variables) and build again. ' +
      'See docs/release/release-checklist.md.'
    )
  }
}

const googleMapsKey = String(process.env.GOOGLE_MAPS_ANDROID_API_KEY || '').trim()

const PHOTO_LIBRARY_TEXT =
  'UniBlueprint needs access to your photo library so you can choose a profile picture or an image for an ad post.'
const LOCATION_TEXT =
  'UniBlueprint uses your location, only when you tap "Find Near Me", to show Lifestyle partners and coaches near you on the map.'

module.exports = {
  name: 'UniBlueprint',
  slug: 'uniblueprint',
  scheme: 'uniblueprint',
  version: '1.0.0',
  sdkVersion: '58.0.0',
  orientation: 'portrait',
  // "automatic" so the in-app Appearance setting (System, Light, Dark) can follow
  // the phone. It was "light", which locks the whole app to light on iOS and
  // makes System mean Light. See src/context/ThemeContext.jsx.
  userInterfaceStyle: 'automatic',
  icon: './assets/icon.png',
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.uniblueprint.app',
    infoPlist: {
      NSPhotoLibraryUsageDescription: PHOTO_LIBRARY_TEXT,
      NSLocationWhenInUseUsageDescription: LOCATION_TEXT,
    },
    config: {
      usesNonExemptEncryption: false,
    },
    // What the app collects, as Apple's privacy manifest wants it. Everything is
    // linked to the account and none of it is used for tracking.
    //   Email, name, user id: sign up and the account.
    //   Photos or videos: profile picture, post photos, clips.
    //   Other user content: posts, comments, profile text, listings.
    //   Other data types: date of birth, course, college and interests on the profile.
    //   Emails or text messages: chat messages between members.
    //   Device ID: the push notification token, saved so we can notify the person.
    //   Crash data: only when a Sentry DSN is set (EXPO_PUBLIC_SENTRY_DSN).
    // Location is read on the phone only when the person taps Find Near Me, to
    // sort partners by distance. It is never sent to a server, so it is not
    // listed as collected. If that ever changes, add PreciseLocation here.
    privacyManifests: {
      NSPrivacyTracking: false,
      NSPrivacyTrackingDomains: [],
      NSPrivacyCollectedDataTypes: [
        collected('NSPrivacyCollectedDataTypeEmailAddress'),
        collected('NSPrivacyCollectedDataTypeName'),
        collected('NSPrivacyCollectedDataTypeUserID'),
        collected('NSPrivacyCollectedDataTypePhotosorVideos'),
        collected('NSPrivacyCollectedDataTypeOtherUserContent'),
        collected('NSPrivacyCollectedDataTypeOtherDataTypes'),
        collected('NSPrivacyCollectedDataTypeEmailsOrTextMessages'),
        collected('NSPrivacyCollectedDataTypeDeviceID'),
        collected('NSPrivacyCollectedDataTypeCrashData'),
      ],
      NSPrivacyAccessedAPITypes: [
        {
          NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryUserDefaults',
          NSPrivacyAccessedAPITypeReasons: ['CA92.1'],
        },
        {
          NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryFileTimestamp',
          NSPrivacyAccessedAPITypeReasons: ['C617.1'],
        },
      ],
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#F5F0E8',
    },
    package: 'com.uniblueprint.app',
    // Only location (Find Near Me). Photo picking uses the system picker. Camera,
    // microphone and write storage are never used, so they are blocked even if a
    // library asks for them.
    permissions: [
      'ACCESS_COARSE_LOCATION',
      'ACCESS_FINE_LOCATION',
    ],
    blockedPermissions: [
      'android.permission.CAMERA',
      'android.permission.RECORD_AUDIO',
      'android.permission.WRITE_EXTERNAL_STORAGE',
    ],
    // Push notifications on Android need Firebase. Add the file as an EAS file
    // variable named GOOGLE_SERVICES_JSON.
    ...(process.env.GOOGLE_SERVICES_JSON ? { googleServicesFile: process.env.GOOGLE_SERVICES_JSON } : {}),
    // The key comes from the environment. With no key (local development) the
    // block is left out, so no placeholder text is ever written into the app.
    ...(googleMapsKey ? { config: { googleMaps: { apiKey: googleMapsKey } } } : {}),
  },
  web: {
    bundler: 'metro',
  },
  extra: {
    eas: {
      projectId: '69a062e2-f045-44c6-aeed-81e557ab3575',
    },
  },
  owner: 'uniblueprint',
  plugins: [
    'expo-font',
    'expo-status-bar',
    [
      'expo-splash-screen',
      {
        image: './assets/splash.png',
        backgroundColor: '#1E3A5F',
        resizeMode: 'contain',
      },
    ],
    [
      'expo-notifications',
      {
        color: '#1E3A5F',
        // aps-environment: "production" for store builds, "development" otherwise.
        mode: IS_PRODUCTION_BUILD ? 'production' : 'development',
      },
    ],
    [
      'expo-location',
      {
        locationWhenInUsePermission: LOCATION_TEXT,
      },
    ],
    [
      // Photo library only. No camera and no microphone strings or permissions.
      'expo-image-picker',
      {
        photosPermission: PHOTO_LIBRARY_TEXT,
        cameraPermission: false,
        microphonePermission: false,
      },
    ],
    '@sentry/react-native',
  ],
}

function collected(type) {
  return {
    NSPrivacyCollectedDataType: type,
    NSPrivacyCollectedDataTypeLinked: true,
    NSPrivacyCollectedDataTypeTracking: false,
    NSPrivacyCollectedDataTypePurposes: ['NSPrivacyCollectedDataTypePurposeAppFunctionality'],
  }
}
