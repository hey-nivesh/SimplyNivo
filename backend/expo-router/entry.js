// Render compatibility shim:
// If Render's Start Command defaults or is configured to 'node expo-router/entry',
// this entry point immediately invokes the Express backend server.
require('../server.js');
