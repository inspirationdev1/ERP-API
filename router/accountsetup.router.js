const express = require("express");
const router = express.Router();
const authMiddleware = require("../auth/auth");
const {
  createAccountsetup,
  getAllAccountsetups,
  getAccountsetupWithId,
  updateAccountsetupWithId,
  deleteAccountsetupWithId,
  getAccountsetupWithScreenId,
  getAccountsetupWithQuery,
} = require("../controller/accountsetup.controller");

router.post("/create", authMiddleware(["COMPANY", "USER"]), createAccountsetup);
router.get(
  "/fetch-all",
  authMiddleware(["COMPANY", "USER"]),
  getAllAccountsetups,
);
router.get(
  "/fetch-single/:id",
  authMiddleware(["COMPANY", "USER"]),
  getAccountsetupWithId,
);
router.patch(
  "/update/:id",
  authMiddleware(["COMPANY", "USER"]),
  updateAccountsetupWithId,
);
router.delete(
  "/delete/:id",
  authMiddleware(["COMPANY", "USER"]),
  deleteAccountsetupWithId,
);
router.get(
  "/fetch-sequence/:id",
  authMiddleware(["COMPANY", "USER"]),
  getAccountsetupWithScreenId,
);
router.get(
  "/fetch-with-query",
  authMiddleware(["COMPANY", "USER", "TEACHER", "STUDENT", "PARENT"]),
  getAccountsetupWithQuery,
);
module.exports = router;
