// api/index.js
// import serverless from "serverless-http";
// import app from "../src/backend/app.js";

// export default serverless(app);

// api/index.js
export default function handler(req, res) {
  res.status(200).send("Hello World");
}

