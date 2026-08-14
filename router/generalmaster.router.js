const express = require("express");
const router = express.Router();
const authMiddleware = require("../auth/auth");
const {
  createGeneralmaster,
  getAllGeneralmasters,
  getGeneralmasterWithQuery,
  getGeneralmasterWithId,
  updateGeneralmasterWithId,
  deleteGeneralmasterWithId,
} = require("../controller/generalmaster.controller");

router.post("/create", authMiddleware(["COMPANY", "USER"]), createGeneralmaster);
router.get(
  "/fetch-all",
  authMiddleware(["COMPANY", "USER"]),
  getAllGeneralmasters,
);
router.get(
  "/fetch-single/:id",
  authMiddleware(["COMPANY", "USER"]),
  getGeneralmasterWithId,
);
router.patch(
  "/update/:id",
  authMiddleware(["COMPANY", "USER"]),
  updateGeneralmasterWithId,
);
router.delete(
  "/delete/:id",
  authMiddleware(["COMPANY", "USER"]),
  deleteGeneralmasterWithId,
);
router.get(
  "/fetch-with-query",
  authMiddleware(["COMPANY", "USER", "TEACHER", "STUDENT", "PARENT"]),
  getGeneralmasterWithQuery,
);

module.exports = router;
