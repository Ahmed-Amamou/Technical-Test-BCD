import { getOffers } from '../services/offer.service';

describe('Offer Service', () => {
  it('should aggregate offers from multiple partners', async () => {
    const result = await getOffers({ amount: 10000, duration: 24 });

    expect(result.offers.length).toBeGreaterThanOrEqual(2);
    expect(result.errors).toHaveLength(0);

    const partnerNames = result.offers.map((o) => o.partner);
    expect(partnerNames).toContain('bankA');
    expect(partnerNames).toContain('bankB');
  });

  it('should return coherent financial data', async () => {
    const result = await getOffers({ amount: 10000, duration: 24 });

    for (const offer of result.offers) {
      // totalCost should be monthlyPayment * duration
      expect(offer.totalCost).toBeCloseTo(offer.monthlyPayment * offer.duration, 1);
      // monthly payment should be greater than simple division (due to interest)
      expect(offer.monthlyPayment).toBeGreaterThan(offer.amount / offer.duration);
      // rate should be positive
      expect(offer.rate).toBeGreaterThan(0);
    }
  });
});
