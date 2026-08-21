const express = require("express");
const router = express.Router();
const authMiddleware = require("../auth/auth");
const {
  printSalesInvoice,
  printPurchaseInvoice,
  printExpense,
  printReceipt,
  printJournalvoucher,
  printPayment,
  printSupplierPayment,
} = require("../controller/printreports.controller");

router.post(
  "/print-salesinvoice",
  authMiddleware(["COMPANY", "USER", "TEACHER", "STUDENT", "PARENT"]),
  printSalesInvoice,
);
router.post(
  "/print-purchaseinvoice",
  authMiddleware(["COMPANY", "USER", "TEACHER", "STUDENT", "PARENT"]),
  printPurchaseInvoice,
);

router.post(
  "/print-expense",
  authMiddleware(["COMPANY", "USER", "TEACHER", "STUDENT", "PARENT"]),
  printExpense,
);
router.post(
  "/print-receipt",
  authMiddleware(["COMPANY", "USER", "TEACHER", "STUDENT", "PARENT"]),
  printReceipt,
);
router.post(
  "/print-payment",
  authMiddleware(["COMPANY", "USER"]),
  printPayment,
);
router.post(
  "/print-supplierpayment",
  authMiddleware(["COMPANY", "USER"]),
  printSupplierPayment,
);

router.post(
  "/print-journalvoucher",
  authMiddleware(["COMPANY", "USER", "TEACHER", "STUDENT", "PARENT"]),
  printJournalvoucher,
);

module.exports = router;
