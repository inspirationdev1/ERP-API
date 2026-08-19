const express = require("express");
const router = express.Router();
const authMiddleware = require("../auth/auth");
const {
  createPayment,
  getAllPayments,
  getPaymentWithId,
  updatePaymentWithId,
  deletePaymentWithId,
  getPaymentPrint,
} = require("../controller/supplierpayment.controller");

router.post("/create", authMiddleware(["COMPANY", "USER"]), createPayment);
router.get("/fetch-all", authMiddleware(["COMPANY", "USER"]), getAllPayments);
router.get(
  "/fetch-single/:id",
  authMiddleware(["COMPANY", "USER"]),
  getPaymentWithId,
);
router.patch(
  "/update/:id",
  authMiddleware(["COMPANY", "USER"]),
  updatePaymentWithId,
);
router.delete(
  "/delete/:id",
  authMiddleware(["COMPANY", "USER"]),
  deletePaymentWithId,
);
router.get(
  "/fetch-print/:id",
  authMiddleware(["COMPANY", "USER"]),
  getPaymentPrint,
);
module.exports = router;
