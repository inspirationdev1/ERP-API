const express = require("express");
const router = express.Router();
const authMiddleware = require("../auth/auth");
const {
  createDepartment,
  getAllDepartments,
  getDepartmentWithId,
  updateDepartmentWithId,
  deleteDepartmentWithId,
} = require("../controller/department.controller");

router.post("/create", authMiddleware(["COMPANY", "USER"]), createDepartment);
router.get(
  "/fetch-all",
  authMiddleware(["COMPANY", "USER"]),
  getAllDepartments,
);
router.get(
  "/fetch-single/:id",
  authMiddleware(["COMPANY", "USER"]),
  getDepartmentWithId,
);
router.patch(
  "/update/:id",
  authMiddleware(["COMPANY", "USER"]),
  updateDepartmentWithId,
);
router.delete(
  "/delete/:id",
  authMiddleware(["COMPANY", "USER"]),
  deleteDepartmentWithId,
);

module.exports = router;
