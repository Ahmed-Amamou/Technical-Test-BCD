import { Request, Response, NextFunction } from 'express';

/**
 * Validates the POST /offers request body.
 * Rejects early with a clear 400 if the input is malformed.
 */
export function validateOfferRequest(req: Request, res: Response, next: NextFunction): void {
  const { amount, duration } = req.body;

  const errors: string[] = [];

  if (amount == null || typeof amount !== 'number' || amount <= 0) {
    errors.push('amount must be a positive number (in euros)');
  }
  if (duration == null || typeof duration !== 'number' || !Number.isInteger(duration) || duration <= 0) {
    errors.push('duration must be a positive integer (in months)');
  }

  if (errors.length > 0) {
    res.status(400).json({ errors });
    return;
  }

  next();
}
