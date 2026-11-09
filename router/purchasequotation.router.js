const express = require("express");
const router = express.Router();
const authMiddleware = require("../auth/auth");
const {
  createPurchasequotation,
  getAllPurchasequotations,
  getPurchasequotationWithId,
  updatePurchasequotationWithId,
  deletePurchasequotationWithId,
  getPurchasequotationPrint,
  getPurchasequotationWithSupplierId,
  getPurchasequotationWithQuery,
} = require("../controller/purchasequotation.controller");

router.post(
  "/create",
  authMiddleware(["COMPANY", "USER"]),
  createPurchasequotation,
);
router.get(
  "/fetch-all",
  authMiddleware(["COMPANY", "USER"]),
  getAllPurchasequotations,
);
router.get(
  "/fetch-single/:id",
  authMiddleware(["COMPANY", "USER"]),
  getPurchasequotationWithId,
);
router.patch(
  "/update/:id",
  authMiddleware(["COMPANY", "USER"]),
  updatePurchasequotationWithId,
);
router.delete(
  "/delete/:id",
  authMiddleware(["COMPANY", "USER"]),
  deletePurchasequotationWithId,
);
router.get(
  "/fetch-print/:id",
  authMiddleware(["COMPANY", "USER"]),
  getPurchasequotationPrint,
);
router.get(
  "/fetch-supplier-invoice",
  authMiddleware(["COMPANY", "USER"]),
  getPurchasequotationWithSupplierId,
);

router.get(
  "/fetch-with-query",
  authMiddleware(["COMPANY", "USER", "TEACHER", "STUDENT", "PARENT"]),
  getPurchasequotationWithQuery,
);
//
module.exports = router;
