import { useEffect } from 'react'

/** Sets `document.title` to "<title> | MedQuest" for the page that calls it. */
export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = `${title} | MedQuest`
  }, [title])
}
