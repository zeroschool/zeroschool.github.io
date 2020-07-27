const express = require('express');
const app = express();
// bypass CORS policy on localhost
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header("Access-Control-Allow-Headers", "Origin, Content-Type");
    next();
});
app.use(express.json());
app.get('/', async(req, res) => {
    res.sendFile('index.html', { root: __dirname });
});
app.listen(3001, () => console.log(`Server listening on port 3001...`));