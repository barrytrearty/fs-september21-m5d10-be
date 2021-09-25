export const badRequestErrorHandler = (err, req, res, next) => {
  if (err.status === 400) {
    res.status(400).send({ success: false, message: err.errorsList });
  } else {
    next(err);
  }
};

export const notFoundErrorHandler = (err, req, res, next) => {
  console.log(err);
  if (err.status === 404) {
    res.status(404).send({ success: false, message: err.message });
  } else {
    next(err);
  }
};

export const forbiddenErrorHandler = (err, req, res, next) => {
  if (err.status === 403) {
    res.status(403).send({ success: false, message: err.message });
  } else {
    next(err);
  }
};

export const genericServerErrorHandler = (err, req, res, next) => {
  console.log(err);
  res.status(500).send({ success: false, message: "Generic Server Error" });
};
