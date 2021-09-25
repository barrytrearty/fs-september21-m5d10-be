import express from "express";
import cors from "cors";
import mediaRouter from "./media/index.js";
import { join } from "path";

import listEndpoints from "express-list-endpoints";

import {
  badRequestErrorHandler,
  notFoundErrorHandler,
  forbiddenErrorHandler,
  genericServerErrorHandler,
} from "./errorhandlers.js";

const server = express();
const port = process.env.PORT || 3005;

// const publicFilePath = join(process.cwd(), "public");

const whiteList = [process.env.FRONT_DEV_URL, process.env.FRONT_PROD_URL];

const corsOptions = {
  origin: function (origin, next) {
    console.log("CURRENT ORIGIN: ", origin);
    if (!origin || whiteList.indexOf(origin) !== -1) {
      next(null, true);
    } else {
      next(new Error(`Origin ${origin} not allowed!`));
    }
  },
};

// server.use(express.static());

server.use(cors(corsOptions));
server.use(express.json());
server.use("/media", mediaRouter);

server.use(badRequestErrorHandler);
server.use(notFoundErrorHandler);
server.use(forbiddenErrorHandler);
server.use(genericServerErrorHandler);

console.table(listEndpoints(server));

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

server.on("error", (error) => {
  console.log(`Sorry there was an error ${error.message}`);
});
