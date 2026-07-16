import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, authFail, getRequestMeta } from '@/lib/adminAuth';
import { prisma } from '@/lib/db';
import { logAdminAction } from '@/lib/adminAudit';
import { permissionListAllows } from '@/lib/permissions';

// Referral commission must stay within the approved business band (20%–23%).
const REFERRAL_MIN = 20;
const REFERRAL_MAX = 23;

export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) return authFail(gate);
  if (!permissionListAllows(gate.user.permissions, 'settings:view')) {
    return NextResponse.json({ error: 'You do not have permission to perform this action.' }, { status: 403 });
  }

  try {
    let settings = await prisma.globalSettings.findFirst();
    if (!settings) {
      settings = await prisma.globalSettings.create({
        data: {
          emailAlertsEnabled: true,
          smsAlertsEnabled: false
        }
      });
    }

    return NextResponse.json({ settings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const gate = await requireAdmin();
  if (!gate.ok) return authFail(gate);
  const admin = gate.user;

  try {
    const body = await req.json();
    const {
      adminEmail,
      adminPhone,
      whatsappNumber,
      publicPhone,
      publicEmail,
      emailAlertsEnabled,
      smsAlertsEnabled,
      officeAddress,
      facebookUrl,
      instagramUrl,
      youtubeUrl,
      linkedinUrl,
      twitterUrl,
      defaultPreviewImage,
      referralCommissionPercent,
    } = body;

    const changingReferral =
      referralCommissionPercent !== undefined && referralCommissionPercent !== null && referralCommissionPercent !== '';

    if (!permissionListAllows(admin.permissions, 'settings:edit')) {
      return NextResponse.json({ error: 'You do not have permission to perform this action.' }, { status: 403 });
    }
    if (changingReferral && !permissionListAllows(admin.permissions, 'referral:edit')) {
      return NextResponse.json({ error: 'You do not have permission to perform this action.' }, { status: 403 });
    }

    const existing = await prisma.globalSettings.findFirst();

    // Build the base update. Referral fields are only touched when a valid value
    // is supplied, so saving general settings never resets the commission.
    const data: Record<string, any> = {
      adminEmail,
      adminPhone,
      whatsappNumber: whatsappNumber ? String(whatsappNumber).replace(/\D/g, '') : whatsappNumber,
      publicPhone,
      publicEmail,
      emailAlertsEnabled: !!emailAlertsEnabled,
      smsAlertsEnabled: !!smsAlertsEnabled,
      officeAddress,
      facebookUrl,
      instagramUrl,
      youtubeUrl,
      linkedinUrl,
      twitterUrl,
      defaultPreviewImage,
    };

    if (changingReferral) {
      const pct = Number(referralCommissionPercent);
      if (Number.isNaN(pct) || pct < REFERRAL_MIN || pct > REFERRAL_MAX) {
        return NextResponse.json(
          { error: `Referral commission must be a number between ${REFERRAL_MIN}% and ${REFERRAL_MAX}%.` },
          { status: 400 }
        );
      }
      data.referralCommissionPercent = pct;
      data.referralUpdatedById = admin.id;
      data.referralUpdatedAt = new Date();
    }

    let settings;
    if (existing) {
      settings = await prisma.globalSettings.update({ where: { id: existing.id }, data });
    } else {
      settings = await prisma.globalSettings.create({ data });
    }

    const meta = getRequestMeta(req);
    await logAdminAction({
      actorUserId: admin.id,
      action: changingReferral ? 'REFERRAL_COMMISSION_CHANGE' : 'SETTINGS_CHANGE',
      targetType: 'GlobalSettings',
      targetId: settings.id,
      previousValue: existing ? { referralCommissionPercent: existing.referralCommissionPercent } : null,
      newValue: changingReferral ? { referralCommissionPercent: data.referralCommissionPercent } : { updatedFields: Object.keys(data) },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
