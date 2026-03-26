import request from 'supertest';
import app from '../app';

describe('POST /offers', () => {
  it('should return offers from all partners', async () => {
    const res = await request(app)
      .post('/offers')
      .send({ amount: 10000, duration: 24 });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('offers');
    expect(res.body).toHaveProperty('errors');
    expect(Array.isArray(res.body.offers)).toBe(true);
    expect(res.body.offers.length).toBeGreaterThanOrEqual(1);
  });

  it('should return normalized offer fields', async () => {
    const res = await request(app)
      .post('/offers')
      .send({ amount: 15000, duration: 36 });

    for (const offer of res.body.offers) {
      expect(offer).toHaveProperty('partner');
      expect(offer).toHaveProperty('amount');
      expect(offer).toHaveProperty('rate');
      expect(offer).toHaveProperty('duration');
      expect(offer).toHaveProperty('monthlyPayment');
      expect(offer).toHaveProperty('totalCost');
      expect(typeof offer.partner).toBe('string');
      expect(typeof offer.amount).toBe('number');
      expect(typeof offer.rate).toBe('number');
      expect(typeof offer.duration).toBe('number');
      expect(typeof offer.monthlyPayment).toBe('number');
      expect(typeof offer.totalCost).toBe('number');
    }
  });

  it('should reject requests with missing amount', async () => {
    const res = await request(app)
      .post('/offers')
      .send({ duration: 24 });

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it('should reject requests with missing duration', async () => {
    const res = await request(app)
      .post('/offers')
      .send({ amount: 10000 });

    expect(res.status).toBe(400);
  });

  it('should reject requests with invalid values', async () => {
    const res = await request(app)
      .post('/offers')
      .send({ amount: -500, duration: 0 });

    expect(res.status).toBe(400);
    expect(res.body.errors.length).toBe(2);
  });

  it('should reject non-integer duration', async () => {
    const res = await request(app)
      .post('/offers')
      .send({ amount: 10000, duration: 12.5 });

    expect(res.status).toBe(400);
  });
});
