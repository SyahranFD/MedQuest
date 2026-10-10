import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export type Locale = 'id' | 'en'
export type Quality = 'auto' | 'high' | 'lite'
/** 'system' follows the OS setting; 'reduce' / 'full' override it. */
export type MotionPreference = 'system' | 'reduce' | 'full'

interface UiState {
  locale: Locale
  quality: Quality
  reducedMotion: MotionPreference
  setLocale: (locale: Locale) => void
  setQuality: (quality: Quality) => void
  setReducedMotion: (pref: MotionPreference) => void
}

function applyLang(locale: Locale) {
  if (typeof document !== 'undefined') document.documentElement.lang = locale
}

// The key must match index.html's pre-paint script (CLAUDE.md section 11).
export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      locale: 'id',
      quality: 'auto',
      reducedMotion: 'system',
      setLocale: (locale) => {
        applyLang(locale)
        set({ locale })
      },
      setQuality: (quality) => set({ quality }),
      setReducedMotion: (reducedMotion) => set({ reducedMotion }),
    }),
    {
      name: 'mq-ui',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ locale: s.locale, quality: s.quality, reducedMotion: s.reducedMotion }),
      onRehydrateStorage: () => (state) => applyLang(state?.locale ?? 'id'),
    },
  ),
)
