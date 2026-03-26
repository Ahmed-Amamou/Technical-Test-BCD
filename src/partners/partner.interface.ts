import { NormalizedOffer, OfferRequest } from '../models/offer';

/**
 * Every partner adapter implements this interface.
 * This makes it trivial to add a new partner: create an adapter, register it.
 */
export interface PartnerAdapter {
  /** Unique identifier for this partner */
  name: string;

  /** Fetch offers from the partner and return them already normalized */
  fetchOffers(request: OfferRequest): Promise<NormalizedOffer[]>;
}
