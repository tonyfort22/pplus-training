import { Geist } from 'next/font/google'

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
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body className={geist.variable}>{children}</body>
    </html>
  );
}
