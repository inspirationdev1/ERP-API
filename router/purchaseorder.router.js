const express = require("express");
const router = express.Router();
const authMiddleware = require("../auth/auth");
const {
  createPurchaseorder,
  getAllPurchaseorders,
  getPurchaseorderWithId,
  updatePurchaseorderWithId,
  deletePurchaseorderWithId,
  getPurchaseorderPrint,
  getPurchaseorderWithSupplierId,
  getPurchaseorderWithQuery,
} = require("../controller/purchaseorder.controller");

router.post(
  "/create",
  authMiddleware(["COMPANY", "USER"]),
  createPurchaseorder,
);
router.get(
  "/fetch-all",
  authMiddleware(["COMPANY", "USER"]),
  getAllPurchaseorders,
);
router.get(
  "/fetch-single/:id",
  authMiddleware(["COMPANY", "USER"]),
  getPurchaseorderWithId,
);
router.patch(
  "/update/:id",
  authMiddleware(["COMPANY", "USER"]),
  updatePurchaseorderWithId,
);
router.delete(
  "/delete/:id",
  authMiddleware(["COMPANY", "USER"]),
  deletePurchaseorderWithId,
);
router.get(
  "/fetch-print/:id",
  authMiddleware(["COMPANY", "USER"]),
  getPurchaseorderPrint,
);
router.get(
  "/fetch-supplier-invoice",
  authMiddleware(["COMPANY", "USER"]),
  getPurchaseorderWithSupplierId,
);

router.get(
  "/fetch-with-query",
  authMiddleware(["COMPANY", "USER", "TEACHER", "STUDENT", "PARENT"]),
  getPurchaseorderWithQuery,
);
//
module.exports = router;
