const express = require("express");
const router = express.Router();
const authMiddleware = require("../auth/auth");
const {
  getSupplierListPrint,
} = require("../controller/purchasereports.controller");

router.get(
  "/supplier-list-print",
  authMiddleware(["COMPANY", "USER"]),
  getSupplierListPrint,
);

module.exports = router;
