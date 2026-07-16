/**
 * Compatibility scoring — deterministic, data-driven and normalised to 0–100%.
 *
 * The score is built from real profile + partner-preference data only. There are
 * NO hardcoded percentages. Each factor contributes points up to a fixed weight;
 * the final percentage is the earned points divided by the total weight of the
 * factors that could actually be evaluated (i.e. where both people supplied the
 * relevant data), then clamped to [0, 100]. This keeps results:
 *   - dynamic (depend entirely on the two profiles),
 *   - safe with missing data (unevaluable factors are excluded, not counted as 0),
 *   - bounded (never < 0% or > 100%),
 *   - consistent (same inputs → same output).
 *
 * Weights (of the applicable factors):
 *   Maslak / sect     30   (boosted when the viewer explicitly wants same maslak)
 *   Biradari / caste  25   (boosted when the viewer explicitly wants same caste)
 *   Location          30   (same state / same district / preferred-location match)
 *   Relocation        15   (either side willing to relocate)
 */

export interface CompatibilityInput {
  maslak?: string | null;
  biradari?: string | null;
  state?: string | null;
  district?: string | null;
  preferredLocations?: string[] | null;
  sameMaslakPreference?: boolean;
  sameCastePreference?: boolean;
  noMaslakPreference?: boolean;
  noCastePreference?: boolean;
  willingToRelocate?: boolean;
}

export interface CompatibilityFactor {
  key: string;
  label: string;
  weight: number;
  earned: number;
  matched: boolean;
  detail: string;
}

export interface CompatibilityResult {
  score: number; // 0-100 integer
  factors: CompatibilityFactor[];
  applicableWeight: number;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function computeCompatibility(
  viewer: CompatibilityInput | null | undefined,
  candidate: CompatibilityInput | null | undefined,
): CompatibilityResult {
  const factors: CompatibilityFactor[] = [];

  if (!viewer || !candidate) {
    return { score: 0, factors, applicableWeight: 0 };
  }

  // --- Maslak / sect (weight 30) ---
  if (viewer.maslak && candidate.maslak) {
    const weight = 30;
    const isMatch = viewer.maslak === candidate.maslak;
    let earned = 0;
    let detail = 'Different maslak';
    if (isMatch) {
      earned = viewer.sameMaslakPreference ? weight : weight * 0.8;
      detail = viewer.sameMaslakPreference ? 'Same maslak (preferred)' : 'Same maslak';
    } else if (viewer.noMaslakPreference || candidate.noMaslakPreference) {
      earned = weight * 0.5;
      detail = 'Different maslak, but open to any';
    }
    factors.push({ key: 'maslak', label: 'Maslak / Sect', weight, earned, matched: isMatch, detail });
  }

  // --- Biradari / caste (weight 25) ---
  if (viewer.biradari && candidate.biradari) {
    const weight = 25;
    const isMatch = viewer.biradari === candidate.biradari;
    let earned = 0;
    let detail = 'Different biradari';
    if (isMatch) {
      earned = viewer.sameCastePreference ? weight : weight * 0.8;
      detail = viewer.sameCastePreference ? 'Same biradari (preferred)' : 'Same biradari';
    } else if (viewer.noCastePreference || candidate.noCastePreference) {
      earned = weight * 0.5;
      detail = 'Different biradari, but open to any';
    }
    factors.push({ key: 'biradari', label: 'Biradari / Community', weight, earned, matched: isMatch, detail });
  }

  // --- Location (weight 30) ---
  if ((viewer.state || (viewer.preferredLocations && viewer.preferredLocations.length)) && candidate.state) {
    const weight = 30;
    let earned = 0;
    let detail = 'Different location';
    let matched = false;
    if (viewer.district && candidate.district && viewer.district === candidate.district) {
      earned = weight;
      matched = true;
      detail = 'Same district';
    } else if (viewer.state && candidate.state === viewer.state) {
      earned = weight * 0.7;
      matched = true;
      detail = 'Same state';
    } else if (viewer.preferredLocations && viewer.preferredLocations.includes(candidate.state)) {
      earned = weight * 0.6;
      matched = true;
      detail = 'In a preferred location';
    }
    factors.push({ key: 'location', label: 'Location', weight, earned, matched, detail });
  }

  // --- Relocation flexibility (weight 15) ---
  {
    const weight = 15;
    const willing = !!(viewer.willingToRelocate || candidate.willingToRelocate);
    factors.push({
      key: 'relocation',
      label: 'Relocation flexibility',
      weight,
      earned: willing ? weight : weight * 0.4,
      matched: willing,
      detail: willing ? 'At least one is willing to relocate' : 'Neither prefers relocation',
    });
  }

  const applicableWeight = factors.reduce((sum, f) => sum + f.weight, 0);
  const earnedTotal = factors.reduce((sum, f) => sum + f.earned, 0);
  const score = applicableWeight > 0 ? clamp(Math.round((earnedTotal / applicableWeight) * 100), 0, 100) : 0;

  return { score, factors, applicableWeight };
}
