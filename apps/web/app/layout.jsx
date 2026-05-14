import './globals.css';

export const metadata = {
  title: 'PPLUS Training',
  description: 'Off-ice hockey training, workout tracking, progress, and recovery insights for athletes.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
