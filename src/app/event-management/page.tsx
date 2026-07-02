import { Metadata } from 'next';
import EventManagementClient from './EventManagementClient';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://asannikah.com';
const title = 'Event Management | Asan Nikah';
const description =
  'Asan Nikah helps families connect with trusted wedding and event service partners for Nikah, Walima, engagement, decoration, venues, catering, photography, makeup, and more.';

export const metadata: Metadata = {
  title,
  description,
  metadataBase: new URL(SITE_URL),
  keywords: [
    'Muslim wedding event management',
    'Nikah decoration vendors',
    'Walima catering services',
    'Muslim wedding photography',
    'Bridal makeup artists India',
    'Mehendi artists',
    'Wedding venues Muslim',
    'Wedding planning India',
    'Asan Nikah events',
  ],
  alternates: { canonical: '/event-management' },
  openGraph: {
    title,
    description,
    url: '/event-management',
    siteName: 'Asan Nikah',
    images: [
      {
        url: `${SITE_URL}/images/nikah-1.jpeg`,
        width: 1200,
        height: 630,
        alt: 'Asan Nikah Event Management',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: [`${SITE_URL}/images/nikah-1.jpeg`],
  },
};

export default function EventManagementPage() {
  return <EventManagementClient />;
}
