const express = require("express");
const router = express.Router();
const authMiddleware = require("../auth/auth");
const {
  createNumberseq,
  getAllNumberseqs,
  getNumberseqWithId,
  updateNumberseqWithId,
  deleteNumberseqWithId,
  getNumberseqWithScreenId,
  getNumberseqWithQuery,
} = require("../controller/numberseq.controller");

router.post("/create", authMiddleware(["COMPANY", "USER"]), createNumberseq);
router.get("/fetch-all", authMiddleware(["COMPANY", "USER"]), getAllNumberseqs);
router.get(
  "/fetch-single/:id",
  authMiddleware(["COMPANY", "USER"]),
  getNumberseqWithId,
);
router.patch(
  "/update/:id",
  authMiddleware(["COMPANY", "USER"]),
  updateNumberseqWithId,
);
router.delete(
  "/delete/:id",
  authMiddleware(["COMPANY", "USER"]),
  deleteNumberseqWithId,
);
router.get(
  "/fetch-sequence/:id",
  authMiddleware(["COMPANY", "USER"]),
  getNumberseqWithScreenId,
);
router.get(
  "/fetch-with-query",
  authMiddleware(["COMPANY", "USER", "TEACHER", "STUDENT", "PARENT"]),
  getNumberseqWithQuery,
);
module.exports = router;
