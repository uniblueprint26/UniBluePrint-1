/**
 * useDirectoryProfile — the shared "how do other people find me" hook.
 *
 * Sibling to useUserType()/useInterests() in shape (sourced from
 * AuthContext, same immediate-local-update-on-write pattern). Wraps the
 * Directory-discovery self-service fields added by the
 * 20261012110000_directory_discovery migration: the public/private toggle,
 * the free-text bio, the "what are you open to" statuses (see
 * constants/directory.js), and the fixed set of self-reported social
 * links. Used by the Directory Profile settings modal (ProfileScreen.jsx)
 * and by SignUpScreen.jsx's visibility step, so both read/write through one
 * place rather than duplicating the validation AuthContext already does.
 *
 * import { useDirectoryProfile } from '../hooks/useDirectoryProfile'
 * const {
 *   discoverable, bio, statuses, socialLinks, credentials, hideLocation, loading,
 *   setDiscoverable, setBio, setStatuses, setSocialLinks, setCredentials, setHideLocation, save,
 * } = useDirectoryProfile()
 *
 * credentials/hideLocation (profiles.directory_credentials/
 * directory_hide_location — see the
 * 20261015140000_directory_credentials_endorsements migration) are the
 * short self-written credentials list shown on the Directory card and the
 * per-profile "hide my location" toggle, added alongside the fields above.
 *
 * save(fields) accepts any subset of { discoverable, bio, statuses,
 * socialLinks, credentials, hideLocation } in one call (one write, one
 * local update) — the setDiscoverable/setBio/setStatuses/setSocialLinks/
 * setCredentials/setHideLocation helpers are thin single-field convenience
 * wrappers around it. All resolve { error } (error is null on success) —
 * never throw.
 */

import { useAuth } from '../context/AuthContext'

export function useDirectoryProfile() {
  const {
    discoverable, bio, statuses, socialLinks, credentials, hideLocation,
    profileLoading, updateDirectoryProfile,
  } = useAuth()

  async function save(fields) {
    return updateDirectoryProfile(fields || {})
  }

  return {
    discoverable,
    bio,
    statuses,
    socialLinks,
    credentials,
    hideLocation,
    loading: profileLoading,
    save,
    setDiscoverable: next => save({ discoverable: next }),
    setBio:          next => save({ bio: next }),
    setStatuses:     next => save({ statuses: next }),
    setSocialLinks:  next => save({ socialLinks: next }),
    setCredentials:  next => save({ credentials: next }),
    setHideLocation: next => save({ hideLocation: next }),
  }
}
