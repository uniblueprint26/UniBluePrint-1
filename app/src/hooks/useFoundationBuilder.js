import { useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { useFoundationOrdering } from './useAppFlags'
import { saveFoundationAnswers } from '../lib/foundationSaved'
import { FOUNDATION_SERVICES } from '../constants/foundationServices'

// Shared by the eight Foundation builders. Gives each one:
//   saveMode       true when the app does not order (always on iOS and Android).
//                  The builder then ends by saving the answers to the member's
//                  Blueprint and opening the saved page. It never starts a payment,
//                  never creates a document row and never calls a generator.
//   initialReview  true when the builder was opened to read or edit saved answers.
//   saveAnswers    pass to QuestionFlow as onSaveAnswers.
export function useFoundationBuilder(serviceKey, navigation, route) {
  const { user } = useAuth()
  const { saveMode, enabled } = useFoundationOrdering()
  const service = FOUNDATION_SERVICES[serviceKey]

  const saveAnswers = useCallback(async (values) => {
    await saveFoundationAnswers(serviceKey, user?.id, values)
    navigation.replace('FoundationSaved', { serviceKey, serviceTitle: service.title })
  }, [serviceKey, user?.id, navigation, service.title])

  return { saveMode, orderingOpen: enabled, initialReview: !!route?.params?.review, saveAnswers }
}
