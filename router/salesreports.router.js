const express = require("express");
const router = express.Router();
const authMiddleware = require("../auth/auth");
const {
  getCustomerListPrint,
  printSalesSummaryCustomer,
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

module.exports = router;
