import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { defaultBusinessLocation, sanitizeMapsUrl } from '@/lib/businessLocation';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const settings = await prisma.globalSettings.findFirst();
    
    const address = settings?.officeAddress || defaultBusinessLocation.address;
    const phone = settings?.adminPhone || defaultBusinessLocation.phone; // Fallback to default if not set
    
    // Format phoneRaw: remove spaces, plus sign is kept or custom formatted
    const phoneRaw = phone.replace(/[^+\d]/g, '');

    const mapEmbedUrl = sanitizeMapsUrl(settings?.mapEmbedUrl, defaultBusinessLocation.mapEmbedUrl);
    const mapOpenUrl = sanitizeMapsUrl(settings?.mapOpenUrl, defaultBusinessLocation.mapOpenUrl);

    return NextResponse.json({
      name: defaultBusinessLocation.name,
      address,
      phone,
      phoneRaw,
      mapEmbedUrl,
      mapOpenUrl
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
