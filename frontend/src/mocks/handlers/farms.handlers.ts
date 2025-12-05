import { http, HttpResponse } from 'msw';
import { API_CONFIG } from '@/api/config';

const BASE_URL = API_CONFIG.BASE_URL;

export const farmsHandlers = [
  http.get(`${BASE_URL}/farms/`, () => {
    return HttpResponse.json({
      count: 2,
      results: [
        {
          id: '1',
          name: 'Green Valley Farm',
          area: 50,
          area_unit: 'hectares',
          location: { latitude: 0, longitude: 0 },
        },
        {
          id: '2',
          name: 'Sunrise Farm',
          area: 30,
          area_unit: 'hectares',
          location: { latitude: 0, longitude: 0 },
        },
      ],
    });
  }),

  http.get(`${BASE_URL}/farms/:id/`, ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      name: 'Green Valley Farm',
      area: 50,
      area_unit: 'hectares',
      location: { latitude: 0, longitude: 0 },
    });
  }),

  http.post(`${BASE_URL}/farms/`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ id: '3', body }, { status: 201 });
  }),
];
