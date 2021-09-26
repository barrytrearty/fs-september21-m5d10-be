import { Router } from "express";
import fs from "fs-extra";
import { fileURLToPath } from "url";
import { dirname, join, extname } from "path";
import uniqid from "uniqid";
import createHttpError from "http-errors";
import { mediaValidation, reviewValidation } from "./validation.js";
import { validationResult } from "express-validator";
import multer from "multer";

import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { pipeline } from "stream";
import { getPdfReadableStream } from "../utils/pdfDownloader.js";

const { readJSON, writeJSON, writeFile } = fs;

const mediaFilePath = join(
  dirname(fileURLToPath(import.meta.url)),
  "media.json"
);

const imageFolderPath = join(process.cwd(), "./public/img");

const getMedia = () => readJSON(mediaFilePath);
const writeMedia = (content) => writeJSON(mediaFilePath, content);

const mediaRouter = Router();

const cloudinaryStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "netflixPosters",
  },
});

mediaRouter.get("/", async (req, res, next) => {
  try {
    const media = await getMedia();
    res.send(media);
  } catch (error) {
    next(error);
  }
});

mediaRouter.get("search/:searchQuery", async (req, res, next) => {
  try {
    const media = await getMedia();
    const mediaSearch = media.filter((m) =>
      m.Title.toLowerCase().includes(req.params.searchQuery)
    );
    res.send(mediaSearch);
  } catch (error) {
    next(error);
  }
});

mediaRouter.get("/:id", async (req, res, next) => {
  try {
    const media = await getMedia();
    const mediaSingle = media.find((m) => m.id === req.params.id);
    if (mediaSingle) {
      res.send(mediaSingle);
    } else {
      next(console.log(`media ${req.params.id} does not exist`));
    }
  } catch (error) {
    next(error);
  }
});

mediaRouter.post("/", mediaValidation, async (req, res, next) => {
  try {
    const errorsList = validationResult(req);
    if (!errorsList.isEmpty()) {
      next(createHttpError(400, { errorsList }));
    } else {
      const media = await getMedia();
      const newMedia = { ...req.body, id: uniqid(), createdAt: new Date() };
      media.push(newMedia);
      writeMedia(media);
      res.send(newMedia);
    }
  } catch (error) {
    next(error);
  }
});

mediaRouter.put("/:id", async (req, res, next) => {
  try {
    const media = await getMedia();
    const index = media.findIndex((m) => m.id === req.params.id);
    const mediaToBeUpdated = media[index];
    const newDetails = req.body;

    const updatedMedia = { ...mediaToBeUpdated, ...newDetails };
    media[index] = updatedMedia;
    writeMedia(media);
    res.send(updatedMedia);
  } catch (error) {
    next(error);
  }
});

mediaRouter.delete("/:id", async (req, res, next) => {
  try {
    const media = await getMedia();
    const filteredMedia = media.filter((m) => m.id === req.params.id);
    writeMedia(filteredMedia);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

mediaRouter.put(
  "/:id/uploadPoster",
  multer().single("poster"),
  async (req, res, next) => {
    try {
      const { originalname, buffer } = req.file;
      const extension = extname(originalname);
      const fileName = `${req.params.id}${extension}`;

      const pathToFile = join(imageFolderPath, fileName);
      await fs.writeFile(pathToFile, buffer);

      const media = await getMedia();
      const index = media.findIndex((M) => M.id === req.params.id);
      let mediaToBeUpdated = media[index];

      const link = `http://localhost:3005/media/public/img/${fileName}`;
      req.file = link;
      const newPoster = { Poster: req.file };
      const updatedMedia = { ...mediaToBeUpdated, ...newPoster };

      media[index] = updatedMedia;
      await writeMedia(media);
      res.send(updatedMedia);
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
);

mediaRouter.put(
  "/:id/poster",
  multer({ storage: cloudinaryStorage }).single("poster"),
  async (req, res, next) => {
    try {
      const media = await getMedia();
      const index = media.findIndex((m) => m.id === req.params.id);
      let mediaToBeUpdated = media[index];

      const newPoster = { Poster: req.file.path };
      const updatedMedia = { ...mediaToBeUpdated, ...newPoster };

      media[index] = updatedMedia;
      await writeMedia(media);
      res.send("new poster added");
    } catch (error) {
      next(error);
    }
  }
);

mediaRouter.get("/:id/reviews", async (req, res, next) => {
  try {
    const media = await getMedia();
    const mediaSingle = media.find((m) => m.id === req.params.id);
    if (mediaSingle) {
      mediaSingle.reviews = mediaSingle.reviews || [];
      res.send(mediaSingle.reviews);
    } else {
      next(createHttpError(404, `media ${id} not found`));
    }
  } catch (error) {
    next(error);
  }
});

mediaRouter.post("/:id/reviews", reviewValidation, async (req, res, next) => {
  try {
    const { id } = req.params.id;
    const errorsList = validationResult(req);
    if (!errorsList.isEmpty()) {
      next(createHttpError(400, { errorsList }));
    } else {
      const media = await getMedia();
      const index = media.findIndex((m) => m.id === req.params.id);
      let mediaToBeUpdated = media[index];
      mediaToBeUpdated.reviews = mediaToBeUpdated.reviews || [];

      const newReview = {
        comment: req.body.comment,
        rate: req.body.rate,
        // ...req.body,
        _id: uniqid(),
        elementId: id,
        createdAt: new Date(),
      };

      const updatedMedia = {
        ...mediaToBeUpdated,
        reviews: [...mediaToBeUpdated.reviews, newReview],
      };

      media[index] = updatedMedia;

      writeMedia(media);

      res.send(updatedMedia);
    }
  } catch (error) {
    next(error);
  }
});

mediaRouter.delete("/:id/reviews/:_id", async (req, res, next) => {
  try {
    const media = await getMedia();
    const index = media.findIndex((m) => m.id === req.params.id);
    const mediaToBeUpdated = media[index];

    const filteredComments = mediaToBeUpdated.reviews.filter(
      (c) => c._id !== req.params._id
    );

    mediaToBeUpdated.reviews = [...filteredComments];

    media[index] = mediaToBeUpdated;

    writeMedia(media);

    res.send(mediaToBeUpdated);
  } catch (error) {
    next(error);
  }
});

mediaRouter.get("/:id/PDFDownload", async (req, res, next) => {
  try {
    const media = await getMedia();
    const mediaSingle = media.find((m) => m.id === req.params.id);

    if (mediaSingle) {
      res.setHeader("Content-Disposition", "attachment; filename-media.pdf");

      const source = getPdfReadableStream(mediaSingle);

      pipeline(source, res, (err) => {
        if (err) next(err);
      });
    } else {
      next(createHttpError(404, `media/${req.params.id} not found`));
    }
  } catch (error) {
    next(error);
  }
});

export default mediaRouter;
