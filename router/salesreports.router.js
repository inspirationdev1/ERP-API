const express = require("express");
const router = express.Router();
const authMiddleware = require("../auth/auth");
const {
  getCustomerListPrint,
  printSalesSummaryCustomer,
  printSalesSummaryItem,
} = require("../controller/salesreports.controller");

router.get(
  "/customer-list-print",
  authMiddleware(["COMPANY", "USER"]),
  getCustomerListPrint,
);

router.get(
  "/sales-summary-customer-print",
  authMiddleware(["COMPANY", "USER"]),
  printSalesSummaryCustomer,
);
router.get(
  "/sales-summary-item-print",
  authMiddleware(["COMPANY", "USER"]),
  printSalesSummaryItem,
);

module.exports = router;
