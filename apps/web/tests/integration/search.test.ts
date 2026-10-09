import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { actAs, call, makeUser, makeVenture, makeEmployee } from './helpers';
import { prisma } from '@/lib/db';

const venturesApi = await import('@/app/api/ventures/route');
const employeesApi = await import('@/app/api/employees/route');

let admin: Awaited<ReturnType<typeof makeUser>>;

before(async () => {
  admin = await makeUser('ADMIN');
  
  // Seed data for search
  await makeVenture({ name: 'Alpha Search Test', code: 'ALP-123', siteCity: 'New York' });
  await makeVenture({ name: 'Beta Search Test', code: 'BET-456', siteCity: 'Los Angeles' });
  await makeVenture({ name: 'Green Heights Luxury', code: 'GHL-789', siteCity: 'Seattle' });
  
  await makeEmployee({ firstName: 'John', lastName: 'Searcher', email: 'john@search.com', designation: 'Engineer' });
  await makeEmployee({ firstName: 'Jane', lastName: 'Doe', email: 'jane@search.com', designation: 'Manager' });
});

describe('Search Functionality', () => {
  test('Ventures: search by exact term and partial matches', async () => {
    actAs(admin.id);
    const r1 = await call(venturesApi.GET, { searchParams: { search: 'Green Heights' } });
    assert.equal(r1.status, 200);
    const json1 = await r1.json();
    assert.equal(json1.data.filter((v: any) => v.name.includes('Green Heights')).length > 0, true);
    
    // Test multiple terms (AND across terms)
    const r2 = await call(venturesApi.GET, { searchParams: { search: 'Alpha New York' } });
    const json2 = await r2.json();
    assert.equal(json2.data.some((v: any) => v.name.includes('Alpha')), true);
  });
  
  test('Employees: search by terms', async () => {
    actAs(admin.id);
    const r = await call(employeesApi.GET, { searchParams: { search: 'John Engineer' } });
    assert.equal(r.status, 200);
    const json = await r.json();
    assert.equal(json.data.length > 0, true);
    assert.equal(json.data[0].firstName, 'John');
  });
});
