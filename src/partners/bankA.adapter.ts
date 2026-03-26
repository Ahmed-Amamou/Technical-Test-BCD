import { PartnerAdapter } from './partner.interface';
import { NormalizedOffer, OfferRequest } from '../models/offer';
import { logger } from '../utils/logger';

/**
 * Mock: BankA returns a JSON with French-style field names.
 */
interface BankARawResponse {
  id_demande: string;
  montant: number;
  taux_annuel: number;
  duree_mois: number;
  mensualite: number;
}

/** Simulates BankA's external API call */
async function callBankAApi(request: OfferRequest): Promise<BankARawResponse> {
  await new Promise((r) => setTimeout(r, 50 + Math.random() * 100));

  const rate = 3.2;
  const monthlyRate = rate / 100 / 12;
  const n = request.duration;
  const monthly = request.amount * (monthlyRate / (1 - Math.pow(1 + monthlyRate, -n)));

  return {
    id_demande: `BA-${Date.now()}`,
    montant: request.amount,
    taux_annuel: rate,
    duree_mois: n,
    mensualite: parseFloat(monthly.toFixed(2)),
  };
}

/** Normalize BankA's raw response into our unified format */
function normalize(raw: BankARawResponse): NormalizedOffer {
  return {
    partner: 'bankA',
    amount: raw.montant,
    rate: raw.taux_annuel,
    duration: raw.duree_mois,
    monthlyPayment: raw.mensualite,
    totalCost: parseFloat((raw.mensualite * raw.duree_mois).toFixed(2)),
  };
}

export const bankAAdapter: PartnerAdapter = {
  name: 'bankA',

  async fetchOffers(request: OfferRequest): Promise<NormalizedOffer[]> {
    logger.info('Calling BankA API', { partner: 'bankA', amount: request.amount });
    const raw = await callBankAApi(request);
    logger.debug('BankA raw response received', { partner: 'bankA' });
    return [normalize(raw)];
  },
};
