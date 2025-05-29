import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({ children }) {
  return (
    <html lang="fa">
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
