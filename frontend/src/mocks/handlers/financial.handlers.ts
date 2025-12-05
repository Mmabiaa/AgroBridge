import { http, HttpResponse } from 'msw';
import { API_CONFIG } from '@/api/config';

const BASE_URL = API_CONFIG.BASE_URL;

export const financialHandlers = [
  http.get(`${BASE_URL}/financial/records/`, () => {
    return HttpResponse.json({ count: 0, results: [] });
  }),
];
