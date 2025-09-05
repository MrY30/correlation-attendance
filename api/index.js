// api/index.js
import serverless from 'serverless-http';
import app from '../src/backend/app.js'; // adjust relative path

export default serverless(app);
