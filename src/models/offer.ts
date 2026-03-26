/**
 * Normalized offer format — the single source of truth for all partner responses.
 * Every partner adapter MUST map its raw data to this shape.
 */
export interface NormalizedOffer {
  partner: string;
  amount: number;       // in euros
  rate: number;         // annual percentage rate
  duration: number;     // in months
  monthlyPayment: number;
  totalCost: number;    // total amount repaid over the loan duration
}

/**
 * Top-level API response for POST /offers.
 * Always returns both successful offers and any errors encountered,
 * so the consumer can handle partial failures gracefully.
 */
export interface OffersResponse {
  offers: NormalizedOffer[];
  errors: PartnerError[];
}

export interface PartnerError {
  partner: string;
  reason: string;
}

/**
 * Body expected by POST /offers.
 */
export interface OfferRequest {
  amount: number;       // requested loan amount in euros
  duration: number;     // desired duration in months
}
