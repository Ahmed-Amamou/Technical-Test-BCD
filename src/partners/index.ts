import { PartnerAdapter } from './partner.interface';
import { bankAAdapter } from './bankA.adapter';
import { bankBAdapter } from './bankB.adapter';

/**
 * Registry of all partner adapters.
 * To add a new partner: create an adapter, import it here, add it to the array.
 */
export const partners: PartnerAdapter[] = [
  bankAAdapter,
  bankBAdapter,
];
