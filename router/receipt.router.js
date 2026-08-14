const express = require("express");
const router = express.Router();
const authMiddleware = require('../auth/auth');
const { createReceipt, getAllReceipts, getReceiptWithId, updateReceiptWithId, deleteReceiptWithId,getReceiptPrint } = require("../controller/receipt.controller");

router.post("/create",authMiddleware(['COMPANY','USER']), createReceipt);
router.get("/fetch-all",authMiddleware(['COMPANY','USER']),getAllReceipts);
router.get("/fetch-single/:id",authMiddleware(['COMPANY','USER']),  getReceiptWithId);
router.patch("/update/:id",authMiddleware(['COMPANY','USER']), updateReceiptWithId);
router.delete("/delete/:id",authMiddleware(['COMPANY','USER']), deleteReceiptWithId);
router.get("/fetch-print/:id",authMiddleware(['COMPANY','USER']),  getReceiptPrint);
module.exports = router;