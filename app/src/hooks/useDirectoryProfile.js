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
 *   discoverable, bio, statuses, socialLinks, loading,
 *   setDiscoverable, setBio, setStatuses, setSocialLinks, save,
 * } = useDirectoryProfile()
 *
 * save(fields) accepts any subset of { discoverable, bio, statuses,
 * socialLinks } in one call (one write, one local update) — the
 * setDiscoverable/setBio/setStatuses/setSocialLinks helpers are thin
 * single-field convenience wrappers around it. All resolve { error } (error
 * is null on success) — never throw.
 */

import { useAuth } from '../context/AuthContext'

export function useDirectoryProfile() {
  const {
    discoverable, bio, statuses, socialLinks, profileLoading, updateDirectoryProfile,
  } = useAuth()

  async function save(fields) {
    return updateDirectoryProfile(fields || {})
  }

  return {
    discoverable,
    bio,
    statuses,
    socialLinks,
    loading: profileLoading,
    save,
    setDiscoverable: next => save({ discoverable: next }),
    setBio:          next => save({ bio: next }),
    setStatuses:     next => save({ statuses: next }),
    setSocialLinks:  next => save({ socialLinks: next }),
  }
}
