import { body } from "express-validator";

export const mediaValidation = [
  body("Year").exists().withMessage("year required"),
  body("Title").exists().withMessage("title required"),
  body("Type").exists().withMessage("required required"),
  //   body("content").exists().withMessage("content required"),
];

export const reviewValidation = [
  body("comment")
    .exists()
    .isString()
    .withMessage("Please enter valid comment text"),
  body("rate").exists().withMessage("Please enter valid rating"),
];
