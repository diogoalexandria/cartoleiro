const express = require('express');
const cors = require('cors');
const routes = require('./routes');
require('dotenv').config();

const PORT = process.env.PORT;

const app = express();

app.use(cors());
app.use(express.json());
app.use(routes);


app.listen( PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;
