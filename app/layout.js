export const metadata = {
  title: 'Síncopa',
  description: 'Finanzas modo brutal',
  manifest: '/manifest.json',
  themeColor: '#1C1C1C',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Síncopa',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#1C1C1C" />
      </head>
      <body style={{ margin: 0, padding: 0, background: '#F0EBE0' }}>
        {children}
      </body>
    </html>
  )
}
