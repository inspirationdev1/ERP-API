const express = require("express");
const router = express.Router();
const authMiddleware = require("../auth/auth");
const {
  getSupplierListPrint,
  printPurchaseSummarySupplier,
  printPurchaseSummaryItem,
  printPurchaseInvoiceList,
} = require("../controller/purchasereports.controller");

router.get(
  "/supplier-list-print",
  authMiddleware(["COMPANY", "USER"]),
  getSupplierListPrint,
);

router.get(
  "/purchase-summary-supplier-print",
  authMiddleware(["COMPANY", "USER"]),
  printPurchaseSummarySupplier,
);

router.get(
  "/purchase-summary-item-print",
  authMiddleware(["COMPANY", "USER"]),
  printPurchaseSummaryItem,
);
router.get(
  "/purchase-invoice-list-print",
  authMiddleware(["COMPANY", "USER"]),
  printPurchaseInvoiceList,
);

module.exports = router;
