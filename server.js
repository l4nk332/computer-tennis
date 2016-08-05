"use strict";
const express = require("express");
const cors = require("cors");
const PORT = process.env.PORT || 3000;

let app = express();

app.use((req, res, next) => {
    console.log(`${req.method} request for ${req.url}`);
    next();
});

app.use(express.static(__dirname + "/public"));

app.use(cors());

app.listen(PORT, function() {
    console.log("server running on port 3000");
});
