import './globals.css';

export const metadata = {
  title: 'PPLUS Training',
  description: 'Coach dashboard and athlete management for PPLUS Training.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
