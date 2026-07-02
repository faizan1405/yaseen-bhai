import HomeClient from './HomeClient';
import { Metadata } from 'next';
import { prisma } from '@/lib/db';
import JsonLd from '../components/JsonLd';

export async function generateMetadata(): Promise<Metadata> {
  let settings = null;
  try {
    settings = await prisma.globalSettings.findFirst();
  } catch (e) {
    console.error("Failed to load settings in metadata", e);
  }
  
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://asannikah.com';
  const title = "Asan Nikah — Trusted Muslim Matrimonial Website & Marriage Bureau";
  const description = "Asan Nikah is India's premium halal Muslim matrimonial website & marriage bureau. Browse verified Muslim profiles and rishta services with manual verification and complete privacy control.";
  const previewImage = settings?.defaultPreviewImage || "/images/nikah-1.jpeg";
  const imageUrl = previewImage.startsWith('http') ? previewImage : `${siteUrl}${previewImage}`;

  return {
    title,
    description,
    metadataBase: new URL(siteUrl),
    keywords: [
      "Muslim matrimonial website",
      "Muslim marriage bureau",
      "Asan Nikah",
      "Muslim rishta service",
      "Islamic matrimonial platform",
      "Verified Muslim profiles",
      "Muslim basic access matches",
      "Muslim premium match access matchmaking",
      "Muslim marriage profiles in India"
    ],
    alternates: {
      canonical: '/',
    },
    openGraph: {
      title,
      description,
      url: '/',
      siteName: "Asan Nikah",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: "Asan Nikah Muslim Matrimonial Platform",
        }
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    }
  };
}

export default function Home() {
  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Asan Nikah",
    "url": "https://asannikah.com",
    "logo": "https://asannikah.com/images/rishte-forever-logo.png",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+91-96754-83125",
      "contactType": "customer support"
    },
    "sameAs": [
      "https://www.facebook.com/asannikah",
      "https://www.instagram.com/asannikah",
      "https://www.youtube.com/asannikah",
      "https://www.linkedin.com/company/asannikah",
      "https://x.com/asannikah"
    ]
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Asan Nikah",
    "url": "https://asannikah.com",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://asannikah.com/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <>
      <JsonLd schema={orgSchema} />
      <JsonLd schema={websiteSchema} />
      <HomeClient />
    </>
  );
}
