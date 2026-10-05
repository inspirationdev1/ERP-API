const express = require("express");
const router = express.Router();
const authMiddleware = require("../auth/auth");
const {
  createSalesquotation,
  getAllSalesquotations,
  getSalesquotationWithId,
  updateSalesquotationWithId,
  deleteSalesquotationWithId,
  getSalesquotationPrint,
  getSalesquotationWithCustomerId,
  getSalesquotationWithQuery,
} = require("../controller/salesquotation.controller");

router.post(
  "/create",
  authMiddleware(["COMPANY", "USER"]),
  createSalesquotation,
);
router.get(
  "/fetch-all",
  authMiddleware(["COMPANY", "USER"]),
  getAllSalesquotations,
);
router.get(
  "/fetch-single/:id",
  authMiddleware(["COMPANY", "USER"]),
  getSalesquotationWithId,
);
router.patch(
  "/update/:id",
  authMiddleware(["COMPANY", "USER"]),
  updateSalesquotationWithId,
);
router.delete(
  "/delete/:id",
  authMiddleware(["COMPANY", "USER"]),
  deleteSalesquotationWithId,
);
router.get(
  "/fetch-print/:id",
  authMiddleware(["COMPANY", "USER"]),
  getSalesquotationPrint,
);
router.get(
  "/fetch-customer-quotation",
  authMiddleware(["COMPANY", "USER"]),
  getSalesquotationWithCustomerId,
);

router.get(
  "/fetch-with-query",
  authMiddleware(["COMPANY", "USER", "TEACHER", "STUDENT", "PARENT"]),
  getSalesquotationWithQuery,
);
//
module.exports = router;
