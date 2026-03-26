import { PartnerAdapter } from '../partners/partner.interface';
import { NormalizedOffer, OfferRequest } from '../models/offer';

const REQUEST: OfferRequest = { amount: 10000, duration: 24 };

const VALID_OFFER: NormalizedOffer = {
  partner: 'mockBank',
  amount: 10000,
  rate: 3.0,
  duration: 24,
  monthlyPayment: 430,
  totalCost: 10320,
};

/**
 * Helper: override the partner registry with custom adapters,
 * then call getOffers via a fresh import.
 */
async function callWithPartners(adapters: PartnerAdapter[]) {
  // Mock the partners module to inject our test adapters
  jest.resetModules();
  jest.doMock('../partners', () => ({ partners: adapters }));

  const { getOffers } = await import('../services/offer.service');
  return getOffers(REQUEST);
}

// ─── Scenario 1: One partner crashes, the other responds ─────────────

describe('Partial failure — one partner throws', () => {
  it('should return the healthy partner offer and report the failing one', async () => {
    const healthy: PartnerAdapter = {
      name: 'healthyBank',
      fetchOffers: async () => [{ ...VALID_OFFER, partner: 'healthyBank' }],
    };
    const crashing: PartnerAdapter = {
      name: 'crashingBank',
      fetchOffers: async () => { throw new Error('Connection refused'); },
    };

    const result = await callWithPartners([healthy, crashing]);

    expect(result.offers).toHaveLength(1);
    expect(result.offers[0].partner).toBe('healthyBank');

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].partner).toBe('crashingBank');
    expect(result.errors[0].reason).toContain('Connection refused');
  });
});

// ─── Scenario 2: Both partners crash — we still get a valid response ─

describe('Total failure — all partners throw', () => {
  it('should return zero offers and report all errors', async () => {
    const failA: PartnerAdapter = {
      name: 'failBankA',
      fetchOffers: async () => { throw new Error('500 Internal Server Error'); },
    };
    const failB: PartnerAdapter = {
      name: 'failBankB',
      fetchOffers: async () => { throw new Error('503 Service Unavailable'); },
    };

    const result = await callWithPartners([failA, failB]);

    expect(result.offers).toHaveLength(0);
    expect(result.errors).toHaveLength(2);
    expect(result.errors.map((e) => e.partner)).toEqual(['failBankA', 'failBankB']);
  });
});

// ─── Scenario 3: Partner times out ──────────────────────────────────

describe('Timeout — partner is too slow', () => {
  it('should timeout and report the slow partner as an error', async () => {
    const slow: PartnerAdapter = {
      name: 'slowBank',
      fetchOffers: () => new Promise((resolve) => {
        // Resolves after 10s — way above the 3s timeout
        setTimeout(() => resolve([{ ...VALID_OFFER, partner: 'slowBank' }]), 10_000);
      }),
    };
    const fast: PartnerAdapter = {
      name: 'fastBank',
      fetchOffers: async () => [{ ...VALID_OFFER, partner: 'fastBank' }],
    };

    const result = await callWithPartners([slow, fast]);

    expect(result.offers).toHaveLength(1);
    expect(result.offers[0].partner).toBe('fastBank');

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].partner).toBe('slowBank');
    expect(result.errors[0].reason).toMatch(/Timeout/i);
  }, 15_000);
});

// ─── Scenario 4: Partner returns malformed / empty data ─────────────

describe('Malformed response — partner returns unexpected shape', () => {
  it('should propagate the error when adapter throws on bad data', async () => {
    const malformed: PartnerAdapter = {
      name: 'brokenBank',
      fetchOffers: async () => {
        // Simulate an adapter that receives garbage and fails during normalization
        const raw: any = { unexpected: 'data' };
        // Accessing a nested property that doesn't exist → throws
        const amount: number = raw.data.montant; // TypeError
        return [{ ...VALID_OFFER, amount }];
      },
    };

    const result = await callWithPartners([malformed]);

    expect(result.offers).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].partner).toBe('brokenBank');
  });
});

// ─── Scenario 5: Retry recovers a transient failure ─────────────────

describe('Retry — transient failure then success', () => {
  it('should recover after a first failure thanks to retry', async () => {
    let callCount = 0;
    const flaky: PartnerAdapter = {
      name: 'flakyBank',
      fetchOffers: async () => {
        callCount++;
        if (callCount === 1) {
          throw new Error('Temporary glitch');
        }
        return [{ ...VALID_OFFER, partner: 'flakyBank' }];
      },
    };

    const result = await callWithPartners([flaky]);

    // The retry mechanism should have caught the first failure and retried
    expect(result.offers).toHaveLength(1);
    expect(result.offers[0].partner).toBe('flakyBank');
    expect(result.errors).toHaveLength(0);
    expect(callCount).toBe(2); // 1 fail + 1 success
  });
});
