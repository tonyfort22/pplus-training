export const COACH_SELECTED_ATHLETE_STORAGE_KEY = 'pplus.coach.selectedAthleteId.v1'

function createBrowserCoachSelectedAthleteStorage(key = COACH_SELECTED_ATHLETE_STORAGE_KEY) {
  return {
    async getItem() {
      return globalThis.localStorage.getItem(key)
    },
    async setItem(value) {
      globalThis.localStorage.setItem(key, value)
      return value
    },
    async removeItem() {
      globalThis.localStorage.removeItem(key)
    },
  }
}

function createSecureStoreCoachSelectedAthleteStorage(secureStore, key = COACH_SELECTED_ATHLETE_STORAGE_KEY) {
  return {
    async getItem() {
      return secureStore.getItemAsync(key)
    },
    async setItem(value) {
      await secureStore.setItemAsync(key, value)
      return value
    },
    async removeItem() {
      await secureStore.deleteItemAsync(key)
    },
  }
}

async function loadExpoSecureStore() {
  try {
    return await import('expo-secure-store')
  } catch {
    return null
  }
}

export async function resolveCoachSelectedAthleteStorage(key = COACH_SELECTED_ATHLETE_STORAGE_KEY) {
  if (typeof globalThis.localStorage !== 'undefined') {
    return createBrowserCoachSelectedAthleteStorage(key)
  }

  const secureStore = await loadExpoSecureStore()
  if (secureStore?.getItemAsync && secureStore?.setItemAsync && secureStore?.deleteItemAsync) {
    return createSecureStoreCoachSelectedAthleteStorage(secureStore, key)
  }

  return null
}
