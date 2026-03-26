import { Request, Response } from 'express';
import { getOffers } from '../services/offer.service';
import { OfferRequest } from '../models/offer';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * POST /offers
 * Accepts a loan request, queries all partners, and returns aggregated offers.
 */
export async function postOffers(req: Request, res: Response): Promise<void> {
  const requestId = uuidv4();
  const offerRequest: OfferRequest = {
    amount: req.body.amount,
    duration: req.body.duration,
  };

  logger.info('Incoming offer request', { requestId, ...offerRequest });

  try {
    const result = await getOffers(offerRequest);

    logger.info('Offer aggregation complete', {
      requestId,
      offersCount: result.offers.length,
      errorsCount: result.errors.length,
    });

    res.status(200).json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error('Unexpected error in offer controller', { requestId, error: message });
    res.status(500).json({ error: 'Internal server error' });
  }
}
