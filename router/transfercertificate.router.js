const express = require("express");
const router = express.Router();
const authMiddleware = require('../auth/auth');
const { createTransfercertificate, getAllTransfercertificates, getTransfercertificateWithId, updateTransfercertificateWithId
    , deleteTransfercertificateWithId,getTransfercertificatePrint } = require("../controller/transfercertificate.controller");

router.post("/create",authMiddleware(['COMPANY','USER']), createTransfercertificate);
router.get("/fetch-all",authMiddleware(['COMPANY','USER']),getAllTransfercertificates);
router.get("/fetch-single/:id",authMiddleware(['COMPANY','USER']),  getTransfercertificateWithId);
router.patch("/update/:id",authMiddleware(['COMPANY','USER']), updateTransfercertificateWithId);
router.delete("/delete/:id",authMiddleware(['COMPANY','USER']), deleteTransfercertificateWithId);
router.get("/fetch-print/:id",authMiddleware(['COMPANY','USER']),  getTransfercertificatePrint);

module.exports = router;