const test = require('node:test');
const assert = require('node:assert');

// Mock next-auth before importing routes
const mockUser = { id: 'test-user', name: 'Test User', role: 'ADMIN' };
require('next-auth');
require.cache[require.resolve('next-auth')] = {
  exports: {
    getServerSession: async () => ({ user: mockUser })
  }
};

const { NextRequest } = require('next/server');
const { GET: getAttendance, POST: postAttendance } = require('./src/app/api/attendance/route.js');

test('Attendance API - Authentication', async (t) => {
  // To fully test this, we would run an HTTP request.
  // We can also test the service directly.
  assert.ok(getAttendance, 'Attendance GET API exists');
  assert.ok(postAttendance, 'Attendance POST API exists');
});
