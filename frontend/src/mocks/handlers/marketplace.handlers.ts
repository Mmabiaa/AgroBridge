import { http, HttpResponse } from 'msw';
import { API_CONFIG } from '@/api/config';

const BASE_URL = API_CONFIG.BASE_URL;

export const marketplaceHandlers = [
  http.get(`${BASE_URL}/marketplace/products/`, () => {
    return HttpResponse.json({ count: 0, results: [] });
  }),
  http.get(`${BASE_URL}/marketplace/orders/`, () => {
    return HttpResponse.json({ count: 0, results: [] });
  }),
];
