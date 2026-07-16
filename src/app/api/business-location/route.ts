import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { defaultBusinessLocation, validateSocialUrl } from '@/lib/businessLocation';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const settings = await prisma.globalSettings.findFirst();
    
    const address = settings?.officeAddress || defaultBusinessLocation.address;
    // Public phone shown on the site. Prefer the dedicated publicPhone, then the
    // admin/notification phone, then the bundled default.
    const phone = settings?.publicPhone || settings?.adminPhone || defaultBusinessLocation.phone;

    // Format phoneRaw: remove spaces, plus sign is kept or custom formatted
    const phoneRaw = phone.replace(/[^+\d]/g, '');

    // WhatsApp number (digits only). Prefer the dedicated setting, else derive
    // from the public phone, else the bundled default.
    const whatsappNumber =
      (settings?.whatsappNumber && settings.whatsappNumber.replace(/\D/g, '')) ||
      phoneRaw.replace(/\D/g, '') ||
      defaultBusinessLocation.phoneRaw.replace(/\D/g, '');

    const email = settings?.publicEmail || null;

    // Validate social URLs
    const facebookUrl = validateSocialUrl(settings?.facebookUrl) || defaultBusinessLocation.facebookUrl;
    const instagramUrl = validateSocialUrl(settings?.instagramUrl) || defaultBusinessLocation.instagramUrl;
    const youtubeUrl = validateSocialUrl(settings?.youtubeUrl) || defaultBusinessLocation.youtubeUrl;
    const linkedinUrl = validateSocialUrl(settings?.linkedinUrl) || defaultBusinessLocation.linkedinUrl;
    const twitterUrl = validateSocialUrl(settings?.twitterUrl) || defaultBusinessLocation.twitterUrl;
    const defaultPreviewImage = settings?.defaultPreviewImage || defaultBusinessLocation.defaultPreviewImage;

    return NextResponse.json({
      name: defaultBusinessLocation.name,
      address,
      phone,
      phoneRaw,
      whatsappNumber,
      email,
      facebookUrl,
      instagramUrl,
      youtubeUrl,
      linkedinUrl,
      twitterUrl,
      defaultPreviewImage
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
