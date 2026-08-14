const express = require("express");
const router = express.Router();
const authMiddleware = require("../auth/auth");
const {
  createPurchaseinvoice,
  getAllPurchaseinvoices,
  getPurchaseinvoiceWithId,
  updatePurchaseinvoiceWithId,
  deletePurchaseinvoiceWithId,
  getPurchaseinvoicePrint,
  getPurchaseinvoiceWithSupplierId,
  getPurchaseinvoiceWithQuery,
} = require("../controller/purchaseinvoice.controller");

router.post(
  "/create",
  authMiddleware(["COMPANY", "USER"]),
  createPurchaseinvoice,
);
router.get(
  "/fetch-all",
  authMiddleware(["COMPANY", "USER"]),
  getAllPurchaseinvoices,
);
router.get(
  "/fetch-single/:id",
  authMiddleware(["COMPANY", "USER"]),
  getPurchaseinvoiceWithId,
);
router.patch(
  "/update/:id",
  authMiddleware(["COMPANY", "USER"]),
  updatePurchaseinvoiceWithId,
);
router.delete(
  "/delete/:id",
  authMiddleware(["COMPANY", "USER"]),
  deletePurchaseinvoiceWithId,
);
router.get(
  "/fetch-print/:id",
  authMiddleware(["COMPANY", "USER"]),
  getPurchaseinvoicePrint,
);
router.get(
  "/fetch-supplier-invoice",
  authMiddleware(["COMPANY", "USER"]),
  getPurchaseinvoiceWithSupplierId,
);

router.get(
  "/fetch-with-query",
  authMiddleware(["COMPANY", "USER", "TEACHER", "STUDENT", "PARENT"]),
  getPurchaseinvoiceWithQuery,
);
//
module.exports = router;
