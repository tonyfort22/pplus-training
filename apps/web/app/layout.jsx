import { Geist } from 'next/font/google'
import { NuqsAdapter } from 'nuqs/adapters/next/app'

import { ToastProvider, ToastViewport } from '@/components/ui/base-toast'
import { TooltipProvider } from '@/components/ui/tooltip'

import './globals.css';

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
})

export const metadata = {
  title: 'PPLUS Training',
  description: 'Coach dashboard and athlete management for PPLUS Training.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="dark" data-public-theme="dark" suppressHydrationWarning>
      <body className={`${geist.variable} isolate text-base antialiased`}>
        <ToastProvider>
          <TooltipProvider><NuqsAdapter>{children}</NuqsAdapter></TooltipProvider>
          <ToastViewport />
        </ToastProvider>
      </body>
    </html>
  );
}
