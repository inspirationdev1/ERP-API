const express = require("express");
const router = express.Router();
const authMiddleware = require("../auth/auth");
const {
  createWorkingdays,
  getAllWorkingdays,
  getWorkingdaysWithQuery,
  getWorkingdaysWithId,
  updateWorkingdaysWithId,
  deleteWorkingdaysWithId,
} = require("../controller/workingdays.controller");

router.post("/create", authMiddleware(["COMPANY", "USER"]), createWorkingdays);
router.get(
  "/fetch-all",
  authMiddleware(["COMPANY", "USER"]),
  getAllWorkingdays,
);
router.get(
  "/fetch-with-query",
  authMiddleware(["COMPANY", "USER", "TEACHER", "STUDENT", "PARENT"]),
  getWorkingdaysWithQuery,
);
router.get(
  "/fetch-single/:id",
  authMiddleware(["COMPANY", "USER"]),
  getWorkingdaysWithId,
);
router.patch(
  "/update/:id",
  authMiddleware(["COMPANY", "USER"]),
  updateWorkingdaysWithId,
);
router.delete(
  "/delete/:id",
  authMiddleware(["COMPANY", "USER"]),
  deleteWorkingdaysWithId,
);

module.exports = router;
