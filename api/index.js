// api/index.js
import serverless from 'serverless-http';
import app from '../src/backend/index.js'; // adjust relative path

export default serverless(app);