import { PartnerAdapter } from './partner.interface';
import { NormalizedOffer, OfferRequest } from '../models/offer';
import { logger } from '../utils/logger';

/**
 * Mock: BankB returns an XML-like flat structure with English field names
 * and a different rate format (monthly rate instead of annual).
 */
interface BankBRawResponse {
  loanId: string;
  requestedAmount: number;
  monthlyRate: number;       // rate expressed per-month (e.g. 0.3 means 0.3%/month)
  termMonths: number;
  payment: number;
}

/** Simulates BankB's external API call */
async function callBankBApi(request: OfferRequest): Promise<BankBRawResponse> {
  await new Promise((r) => setTimeout(r, 80 + Math.random() * 120));

  const annualRate = 2.9;
  const monthlyRate = annualRate / 12;
  const mr = monthlyRate / 100;
  const n = request.duration;
  const payment = request.amount * (mr / (1 - Math.pow(1 + mr, -n)));

  return {
    loanId: `BB-${Date.now()}`,
    requestedAmount: request.amount,
    monthlyRate,
    termMonths: n,
    payment: parseFloat(payment.toFixed(2)),
  };
}

/** Normalize BankB's raw response — convert monthly rate to annual */
function normalize(raw: BankBRawResponse): NormalizedOffer {
  const annualRate = parseFloat((raw.monthlyRate * 12).toFixed(2));

  return {
    partner: 'bankB',
    amount: raw.requestedAmount,
    rate: annualRate,
    duration: raw.termMonths,
    monthlyPayment: raw.payment,
    totalCost: parseFloat((raw.payment * raw.termMonths).toFixed(2)),
  };
}

export const bankBAdapter: PartnerAdapter = {
  name: 'bankB',

  async fetchOffers(request: OfferRequest): Promise<NormalizedOffer[]> {
    logger.info('Calling BankB API', { partner: 'bankB', amount: request.amount });
    const raw = await callBankBApi(request);
    logger.debug('BankB raw response received', { partner: 'bankB' });
    return [normalize(raw)];
  },
};
