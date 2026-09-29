const express = require("express");
const router = express.Router();
const authMiddleware = require("../auth/auth");
const {
  createRolepermission,
  getAllRolepermissions,
  getRolepermissionWithQuery,
  getRolepermissionWithId,
  updateRolepermissionWithId,
  deleteRolepermissionWithId,
} = require("../controller/rolepermission.controller");

router.post(
  "/create",
  authMiddleware(["COMPANY", "USER"]),
  createRolepermission,
);
router.get(
  "/fetch-all",
  authMiddleware(["COMPANY", "USER"]),
  getAllRolepermissions,
);
router.get(
  "/fetch-with-query",
  authMiddleware(["COMPANY", "USER", "TEACHER", "STUDENT", "PARENT"]),
  getRolepermissionWithQuery,
);
router.get(
  "/fetch-single/:id",
  authMiddleware(["COMPANY", "USER"]),
  getRolepermissionWithId,
);
router.patch(
  "/update/:id",
  authMiddleware(["COMPANY", "USER"]),
  updateRolepermissionWithId,
);
router.delete(
  "/delete/:id",
  authMiddleware(["COMPANY", "USER"]),
  deleteRolepermissionWithId,
);

module.exports = router;
