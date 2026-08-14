const express = require("express");
const router = express.Router();
const authMiddleware = require('../auth/auth');
const { createSalesinvoice, getAllSalesinvoices, getSalesinvoiceWithId, updateSalesinvoiceWithId
    , deleteSalesinvoiceWithId,getSalesinvoicePrint,getSalesinvoiceWithCustomerId
,getSalesinvoiceWithQuery } = require("../controller/salesinvoice.controller");

router.post("/create",authMiddleware(['COMPANY','USER']), createSalesinvoice);
router.get("/fetch-all",authMiddleware(['COMPANY','USER']),getAllSalesinvoices);
router.get("/fetch-single/:id",authMiddleware(['COMPANY','USER']),  getSalesinvoiceWithId);
router.patch("/update/:id",authMiddleware(['COMPANY','USER']), updateSalesinvoiceWithId);
router.delete("/delete/:id",authMiddleware(['COMPANY','USER']), deleteSalesinvoiceWithId);
router.get("/fetch-print/:id",authMiddleware(['COMPANY','USER']),  getSalesinvoicePrint);
router.get("/fetch-customer-invoice",authMiddleware(['COMPANY','USER']),  getSalesinvoiceWithCustomerId);

router.get("/fetch-with-query",authMiddleware(['COMPANY','USER','TEACHER','STUDENT','PARENT']),getSalesinvoiceWithQuery);
// 
module.exports = router;