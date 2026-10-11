import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// Keep in sync with the --text-* and --font-weight-* entries in index.css (CLAUDE.md section 11).
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        {
          text: [
            'display',
            'heading-page',
            'heading-section',
            'heading-card',
            'lead',
            'body',
            'body-s',
            'label',
            'title',
            'section',
            'meta',
            'chip',
          ],
        },
      ],
      'font-weight': [{ font: ['regular', 'medium', 'semibold', 'bold'] }],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
