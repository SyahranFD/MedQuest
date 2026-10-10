import { useEffect } from 'react'
import { useT, type MessageKey } from '@/lib/i18n'
import './i18n'

/** Sets `document.title` from an i18n key and follows locale changes. */
export function useDocumentTitle(key: MessageKey) {
  const t = useT()
  const title = t(key)
  useEffect(() => {
    document.title = title
  }, [title])
}
