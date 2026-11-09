const express = require("express");
const router = express.Router();
const authMiddleware = require("../auth/auth");
const {
  createGoodsreceived,
  getAllGoodsreceiveds,
  getGoodsreceivedWithId,
  updateGoodsreceivedWithId,
  deleteGoodsreceivedWithId,
  getGoodsreceivedPrint,
  getGoodsreceivedWithSupplierId,
  getGoodsreceivedWithQuery,
} = require("../controller/goodsreceived.controller");

router.post(
  "/create",
  authMiddleware(["COMPANY", "USER"]),
  createGoodsreceived,
);
router.get(
  "/fetch-all",
  authMiddleware(["COMPANY", "USER"]),
  getAllGoodsreceiveds,
);
router.get(
  "/fetch-single/:id",
  authMiddleware(["COMPANY", "USER"]),
  getGoodsreceivedWithId,
);
router.patch(
  "/update/:id",
  authMiddleware(["COMPANY", "USER"]),
  updateGoodsreceivedWithId,
);
router.delete(
  "/delete/:id",
  authMiddleware(["COMPANY", "USER"]),
  deleteGoodsreceivedWithId,
);
router.get(
  "/fetch-print/:id",
  authMiddleware(["COMPANY", "USER"]),
  getGoodsreceivedPrint,
);
router.get(
  "/fetch-supplier-invoice",
  authMiddleware(["COMPANY", "USER"]),
  getGoodsreceivedWithSupplierId,
);

router.get(
  "/fetch-with-query",
  authMiddleware(["COMPANY", "USER", "TEACHER", "STUDENT", "PARENT"]),
  getGoodsreceivedWithQuery,
);
//
module.exports = router;
