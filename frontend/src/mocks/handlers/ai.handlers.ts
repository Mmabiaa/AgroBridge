import { http, HttpResponse } from 'msw';
import { API_CONFIG } from '@/api/config';

const BASE_URL = API_CONFIG.BASE_URL;

export const aiHandlers = [
  http.get(`${BASE_URL}/ai/conversations/`, () => {
    return HttpResponse.json({ count: 0, results: [] });
  }),
  http.get(`${BASE_URL}/ai/recommendations/active/`, () => {
    return HttpResponse.json([]);
  }),
];
