// api/index.js
// import serverless from "serverless-http";
// import app from "../src/backend/app.js";

// export default serverless(app);

import express from 'express';

const app = express();

app.get('/', (req, res) => {
    // res.sendFile(path.join(__dirname, '../frontend/pages', 'clientPage.html'));
    res.send("hello world")
});
