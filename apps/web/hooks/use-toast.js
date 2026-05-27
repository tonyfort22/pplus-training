'use client'

import { useContext } from 'react'

import { ToastContext } from '@/components/ui/base-toast'

export function useToast() {
  const context = useContext(ToastContext)

  if (!context) {
    throw new Error('useToast must be used within a ToastProvider.')
  }

  return {
    toastManager: {
      show: context.toastManager.show,
      dismiss: context.toastManager.dismiss,
      promise: context.toastManager.promise,
    },
  }
}
