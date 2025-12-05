import { http, HttpResponse } from 'msw';
import { API_CONFIG } from '@/api/config';

const BASE_URL = API_CONFIG.BASE_URL;

export const blockchainHandlers = [
  http.get(`${BASE_URL}/blockchain/certificates/`, () => {
    return HttpResponse.json({ count: 0, results: [] });
  }),
];
