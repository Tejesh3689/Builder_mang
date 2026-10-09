const http = require('http');

const req = http.request('http://localhost:3000/api/employees', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    // simulate logged in user by stealing cookie from dev server if possible, or just print what the UI does.
  }
});
