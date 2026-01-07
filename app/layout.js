import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://geostats.ae'),
  title: 'GeoStats - Dubai Geo-Intelligence & Urban Analytics',
  description: 'Understand Dubai. Decide Smarter. Population, income, mobility, and real-estate insights — explained simply.',
  icons: {
    icon: '/logo/geo_stats.png',
    apple: '/logo/geo_stats.png',
  },
  openGraph: {
    type: 'website',
    url: 'https://geostats.ae/',
    title: 'GeoStats - Dubai Geo-Intelligence & Urban Analytics',
    description: 'Understand Dubai. Decide Smarter. Population, income, mobility, and real-estate insights — explained simply.',
    images: ['/logo/geo_stats.png'],
  },
  twitter: {
    card: 'summary_large_image',
    url: 'https://geostats.ae/',
    title: 'GeoStats - Dubai Geo-Intelligence & Urban Analytics',
    description: 'Understand Dubai. Decide Smarter. Population, income, mobility, and real-estate insights — explained simply.',
    images: ['/logo/geo_stats.png'],
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Tomorrow:wght@400;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Hoefler+Text:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Poppins:wght@300;400;500;600;700&family=Roboto:wght@300;400;500;700&family=Montserrat:wght@300;400;500;600;700&family=Nunito:wght@300;400;500;600;700&family=Source+Sans+Pro:wght@300;400;600;700&family=Playfair+Display:wght@400;500;600;700&family=Merriweather:wght@300;400;700&display=swap" rel="stylesheet" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}

