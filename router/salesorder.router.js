const express = require("express");
const router = express.Router();
const authMiddleware = require("../auth/auth");
const {
  createSalesorder,
  getAllSalesorders,
  getSalesorderWithId,
  updateSalesorderWithId,
  deleteSalesorderWithId,
  getSalesorderPrint,
  getSalesorderWithCustomerId,
  getSalesorderWithQuery,
} = require("../controller/salesorder.controller");

router.post(
  "/create",
  authMiddleware(["COMPANY", "USER"]),
  createSalesorder,
);
router.get(
  "/fetch-all",
  authMiddleware(["COMPANY", "USER"]),
  getAllSalesorders,
);
router.get(
  "/fetch-single/:id",
  authMiddleware(["COMPANY", "USER"]),
  getSalesorderWithId,
);
router.patch(
  "/update/:id",
  authMiddleware(["COMPANY", "USER"]),
  updateSalesorderWithId,
);
router.delete(
  "/delete/:id",
  authMiddleware(["COMPANY", "USER"]),
  deleteSalesorderWithId,
);
router.get(
  "/fetch-print/:id",
  authMiddleware(["COMPANY", "USER"]),
  getSalesorderPrint,
);
router.get(
  "/fetch-customer-order",
  authMiddleware(["COMPANY", "USER"]),
  getSalesorderWithCustomerId,
);

router.get(
  "/fetch-with-query",
  authMiddleware(["COMPANY", "USER", "TEACHER", "STUDENT", "PARENT"]),
  getSalesorderWithQuery,
);
//
module.exports = router;
