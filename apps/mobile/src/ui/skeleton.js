import { createElement } from 'react'
import { View } from 'react-native'

export function Skeleton({ className = '', theme, style, ...props }) {
  return createElement(View, {
    className: `rounded-md ${className}`.trim(),
    style: [
      {
        backgroundColor: theme?.surfaceMuted || 'rgba(148, 163, 184, 0.18)',
      },
      style,
    ],
    ...props,
  })
}
