'use client'

import { createContext, useCallback, useContext, useMemo, useRef, useState, useEffect } from 'react'
import { CircleAlert, CircleCheckBig, Info, LoaderCircle, X } from 'lucide-react'

import { cn } from '@/lib/utils'

export const ToastContext = createContext(null)

function resolveToastInput(input, payload) {
  if (typeof input === 'function') {
    return input(payload) || {}
  }

  return input || {}
}

function ToastCard({ toast, onDismiss }) {
  useEffect(() => {
    if (!toast.duration || toast.duration <= 0) return undefined

    const timeoutId = setTimeout(() => {
      onDismiss(toast.id)
    }, toast.duration)

    return () => clearTimeout(timeoutId)
  }, [onDismiss, toast.duration, toast.id])

  const variantStyles = {
    loading: {
      icon: <LoaderCircle className="size-4 animate-spin text-[#8EA0BC]" />,
      shell: 'border-[#24334A] bg-[#111D30]',
    },
    success: {
      icon: <CircleCheckBig className="size-4 text-[#3BE0AF]" />,
      shell: 'border-[#1E5B4A] bg-[#0F1728]',
    },
    error: {
      icon: <CircleAlert className="size-4 text-[#F87171]" />,
      shell: 'border-[#5A2830] bg-[#0F1728]',
    },
    warning: {
      icon: <CircleAlert className="size-4 text-[#FBBF24]" />,
      shell: 'border-[#5E4720] bg-[#0F1728]',
    },
    info: {
      icon: <Info className="size-4 text-[#60A5FA]" />,
      shell: 'border-[#24334A] bg-[#0F1728]',
    },
  }

  const variant = variantStyles[toast.variant] || variantStyles.info
  const isDismissible = toast.dismissible !== false

  return (
    <div
      data-state={toast.open ? 'open' : 'closed'}
      className={cn(
        'pointer-events-auto flex w-full items-start gap-3 rounded-[16px] border px-4 py-3 text-[#DCE6F8] shadow-[0_20px_50px_rgba(0,0,0,0.35)] transition-all duration-200',
        variant.shell,
      )}
    >
      <div className="mt-0.5 shrink-0">{variant.icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-[#EEF4FF]">{toast.title}</p>
        {toast.description ? <p className="mt-1 text-sm leading-5 text-[#8EA0BC]">{toast.description}</p> : null}
      </div>
      {isDismissible ? (
        <button
          type="button"
          className="inline-flex size-7 shrink-0 items-center justify-center rounded-full text-[#8EA0BC] transition-colors hover:bg-[#15233A] hover:text-[#EEF4FF]"
          onClick={() => onDismiss(toast.id)}
          aria-label="Dismiss toast"
        >
          <X className="size-4" />
        </button>
      ) : null}
    </div>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const toastIdRef = useRef(0)

  const dismiss = useCallback((toastId) => {
    setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== toastId))
  }, [])

  const upsertToast = useCallback((toastInput, existingId = null) => {
    const nextId = existingId || `toast-${Date.now()}-${toastIdRef.current++}`
    const normalizedToast = {
      id: nextId,
      title: toastInput.title || 'Notice',
      description: toastInput.description || '',
      variant: toastInput.variant || 'info',
      dismissible: toastInput.data?.close !== false,
      duration: typeof toastInput.duration === 'number' ? toastInput.duration : (toastInput.variant === 'loading' ? 0 : 4500),
      open: true,
    }

    setToasts((currentToasts) => {
      const existingIndex = currentToasts.findIndex((toast) => toast.id === nextId)

      if (existingIndex === -1) {
        return [normalizedToast, ...currentToasts].slice(0, 5)
      }

      const nextToasts = [...currentToasts]
      nextToasts[existingIndex] = normalizedToast
      return nextToasts
    })

    return nextId
  }, [])

  const show = useCallback((toastInput) => upsertToast(toastInput), [upsertToast])

  const promise = useCallback((promiseInput, states = {}) => {
    const loadingToastId = upsertToast({
      ...resolveToastInput(states.loading, null),
      variant: 'loading',
    })

    return Promise.resolve(promiseInput)
      .then((result) => {
        upsertToast({
          ...resolveToastInput(states.success, result),
          variant: 'success',
        }, loadingToastId)
        return result
      })
      .catch((error) => {
        upsertToast({
          ...resolveToastInput(states.error, error),
          variant: 'error',
          duration: 6000,
        }, loadingToastId)
        throw error
      })
  }, [upsertToast])

  const contextValue = useMemo(() => ({
    toasts,
    dismissToast: dismiss,
    toastManager: {
      show,
      dismiss,
      promise,
    },
  }), [dismiss, promise, show, toasts])

  return <ToastContext.Provider value={contextValue}>{children}</ToastContext.Provider>
}

export function ToastViewport() {
  const context = useContext(ToastContext)

  if (!context) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[120] flex justify-end px-4 pb-4 sm:px-6 sm:pb-6">
      <div className="flex w-full max-w-[420px] flex-col gap-3">
        {context.toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onDismiss={context.dismissToast} />
        ))}
      </div>
    </div>
  )
}
