const express = require("express");
const router = express.Router();
const authMiddleware = require("../auth/auth");
const {
  createDeliveryorder,
  getAllDeliveryorders,
  getDeliveryorderWithId,
  updateDeliveryorderWithId,
  deleteDeliveryorderWithId,
  getDeliveryorderPrint,
  getDeliveryorderWithCustomerId,
  getDeliveryorderWithQuery,
} = require("../controller/deliveryorder.controller");

router.post(
  "/create",
  authMiddleware(["COMPANY", "USER"]),
  createDeliveryorder,
);
router.get(
  "/fetch-all",
  authMiddleware(["COMPANY", "USER"]),
  getAllDeliveryorders,
);
router.get(
  "/fetch-single/:id",
  authMiddleware(["COMPANY", "USER"]),
  getDeliveryorderWithId,
);
router.patch(
  "/update/:id",
  authMiddleware(["COMPANY", "USER"]),
  updateDeliveryorderWithId,
);
router.delete(
  "/delete/:id",
  authMiddleware(["COMPANY", "USER"]),
  deleteDeliveryorderWithId,
);
router.get(
  "/fetch-print/:id",
  authMiddleware(["COMPANY", "USER"]),
  getDeliveryorderPrint,
);
router.get(
  "/fetch-customer-order",
  authMiddleware(["COMPANY", "USER"]),
  getDeliveryorderWithCustomerId,
);

router.get(
  "/fetch-with-query",
  authMiddleware(["COMPANY", "USER", "TEACHER", "STUDENT", "PARENT"]),
  getDeliveryorderWithQuery,
);
//
module.exports = router;
