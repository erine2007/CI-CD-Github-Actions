const request = require('supertest');
const app = require('../src/app');

// On mock le module db pour ne pas dépendre de PostgreSQL
jest.mock('../src/db', () => ({
  query: jest.fn()
}));

const pool = require('../src/db');

describe('GET /health', () => {
  it('retourne un statut ok quand la base est connectée', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.database).toBe('connected');
  });

  it('retourne une erreur 503 quand la base est indisponible', async () => {
    pool.query.mockRejectedValueOnce(new Error('DB down'));

    const res = await request(app).get('/health');

    expect(res.status).toBe(503);
    expect(res.body.status).toBe('error');
    expect(res.body.database).toBe('unavailable');
  });
});

describe('GET /products', () => {
  it('retourne un tableau de produits', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [
        { id: 1, name: 'Loco vapeur', description: 'Belle loco', price_cents: 4999, stock: 5 }
      ]
    });

    const res = await request(app).get('/products');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });
});

describe('POST /products', () => {
  it('crée un produit valide et retourne 201', async () => {
    const newProduct = {
      id: 42,
      name: 'Wagon plat',
      description: 'Wagon de marchandises',
      price_cents: 1999,
      stock: 10
    };
    pool.query.mockResolvedValueOnce({ rows: [newProduct] });

    const res = await request(app)
      .post('/products')
      .send({
        name: 'Wagon plat',
        description: 'Wagon de marchandises',
        price_cents: 1999,
        stock: 10
      });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Wagon plat');
    expect(res.body.price_cents).toBe(1999);
  });

  it('refuse un produit invalide et retourne 400', async () => {
    const res = await request(app)
      .post('/products')
      .send({ name: 'Produit incomplet' }); // pas de price_cents

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });
});