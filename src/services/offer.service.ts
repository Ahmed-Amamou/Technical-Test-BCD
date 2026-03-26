import { partners } from '../partners';
import { OfferRequest, OffersResponse, NormalizedOffer, PartnerError } from '../models/offer';
import { withRetry } from '../utils/retry';
import { withTimeout } from '../utils/timeout';
import { logger } from '../utils/logger';

const PARTNER_TIMEOUT_MS = 3000;

/**
 * Core aggregation logic.
 *
 * Calls every registered partner in parallel using Promise.allSettled
 * (NOT Promise.all — we want partial results even if some partners fail).
 *
 * Each call is wrapped with:
 *  1. A timeout guard — no partner can block the response indefinitely.
 *  2. A retry mechanism — transient failures get a second chance.
 */
export async function getOffers(request: OfferRequest): Promise<OffersResponse> {
  const results = await Promise.allSettled(
    partners.map((partner) =>
      withRetry(
        () => withTimeout(partner.fetchOffers(request), PARTNER_TIMEOUT_MS, partner.name),
        { retries: 1, delayMs: 200, label: partner.name },
      ),
    ),
  );

  const offers: NormalizedOffer[] = [];
  const errors: PartnerError[] = [];

  results.forEach((result, index) => {
    const partnerName = partners[index].name;

    if (result.status === 'fulfilled') {
      offers.push(...result.value);
      logger.info('Partner responded successfully', { partner: partnerName, count: result.value.length });
    } else {
      const reason = result.reason instanceof Error ? result.reason.message : String(result.reason);
      errors.push({ partner: partnerName, reason });
      logger.error('Partner call failed', { partner: partnerName, reason });
    }
  });

  return { offers, errors };
}
