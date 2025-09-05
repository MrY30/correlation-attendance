// api/index.js
import serverless from "serverless-http";
import app from "../src/backend/app.js";

export default serverless(app);
