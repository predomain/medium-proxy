const express = require("express");
const https = require("https");
const fs = require("fs");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const XMLParser = require("fast-xml-parser").XMLParser;
const fetch = require("node-fetch");
const getBlogEveryMs = 1000 * 60 * 5;
const blogLink = "https://predomain.medium.com/feed";
const api = express();
const apiPort = 8443;
let blog = "";
const getBlog = async () => {
  const get = await fetch(blogLink, {
    method: "GET",
    headers: {
      responseType: "text",
      Accept: "application/xhtml+xml,application/xml",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.75 Safari/537.36",
    },
  });
  if (get === null || (get.status !== 201 && get.status !== 200)) {
    console.log("Error fetching latest blog: " + get.statusText);
    return false;
  }
  const result = await get.text();
  const rssParsed = new XMLParser().parse(result);
  blog = rssParsed;
};
getBlog();
setInterval(() => {
  getBlog();
}, getBlogEveryMs);
https
  .createServer(
    {
      key: fs.readFileSync(__dirname + "/ssl/server.key", "utf8"),
      cert: fs.readFileSync(__dirname + "/ssl/server.cert", "utf8"),
      ca: fs.readFileSync(__dirname + "/ssl/server.ca", "utf8"),
    },
    api
  )
  .listen(apiPort, () => {
    console.log("Proxy server running on port " + apiPort);
  });
api.use(
  cors({
    origin: "https://predomain.eth.limo",
  })
);
const limiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
api.get("/", limiter, (req, res) => {
  res.send(blog);
});
