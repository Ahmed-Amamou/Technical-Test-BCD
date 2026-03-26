import express from 'express';
import { postOffers } from './controllers/offer.controller';
import { validateOfferRequest } from './middleware/validateRequest';

const app = express();

app.use(express.json());

app.post('/offers', validateOfferRequest, postOffers);

export default app;
