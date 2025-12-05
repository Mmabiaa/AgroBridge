import { http, HttpResponse } from 'msw';
import { API_CONFIG } from '@/api/config';

const BASE_URL = API_CONFIG.BASE_URL;

export const cropDetectionHandlers = [
  http.get(`${BASE_URL}/crop-detection/scans/`, () => {
    return HttpResponse.json({ count: 0, results: [] });
  }),
  http.get(`${BASE_URL}/crop-detection/diseases/`, () => {
    return HttpResponse.json({ count: 0, results: [] });
  }),
];
