export interface BusinessLocation {
  name: string;
  address: string;
  phone: string;
  phoneRaw: string;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  youtubeUrl?: string | null;
  linkedinUrl?: string | null;
  twitterUrl?: string | null;
  defaultPreviewImage?: string | null;
}

export const defaultBusinessLocation: BusinessLocation = {
  name: "Asan Nikah",
  address: "Innov8 44 Regal Building, 2nd Floor, Property No. 44, Above Madame Tussauds, Regal Building, Connaught Place, New Delhi - 110001",
  phone: "+91 91709 75535",
  phoneRaw: "+919170975535",
  facebookUrl: "https://www.facebook.com/asannikah",
  instagramUrl: "https://www.instagram.com/asannikah",
  youtubeUrl: "https://www.youtube.com/asannikah",
  linkedinUrl: "https://www.linkedin.com/company/asannikah",
  twitterUrl: "https://x.com/asannikah",
  defaultPreviewImage: "/images/nikah-1.jpeg" // Elegant default preview
};

/**
 * Validates and sanitizes a social media URL to ensure it is a safe link.
 * Returns the sanitized URL, or null if it's invalid.
 */
export function validateSocialUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (trimmed === '') return null;

  // Basic check to ensure it starts with http:// or https://
  if (!/^https?:\/\//i.test(trimmed)) {
    return null;
  }

  // Prevent script/inline injections
  if (trimmed.toLowerCase().includes('javascript:') || trimmed.toLowerCase().includes('data:')) {
    return null;
  }

  return trimmed;
}

