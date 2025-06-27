const request = require('supertest');
const app = require('../src/app');

describe("GET /api/health", () => {
    it('should return OK', async () => {
        const res = await request(app).get('/api/health');
        expect(res.statusCode).toEqual(200);
        expect(res.body.status).toBe('OK');
    });
});
