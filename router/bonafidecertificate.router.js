const express = require("express");
const router = express.Router();
const authMiddleware = require('../auth/auth');
const { createBonafidecertificate, getAllBonafidecertificates, getBonafidecertificateWithId
    , updateBonafidecertificateWithId, deleteBonafidecertificateWithId,getBonafidecertificatePrint } = require("../controller/bonafidecertificate.controller");

router.post("/create",authMiddleware(['COMPANY','USER']), createBonafidecertificate);
router.get("/fetch-all",authMiddleware(['COMPANY','USER']),getAllBonafidecertificates);
router.get("/fetch-single/:id",authMiddleware(['COMPANY','USER']),  getBonafidecertificateWithId);
router.patch("/update/:id",authMiddleware(['COMPANY','USER']), updateBonafidecertificateWithId);
router.delete("/delete/:id",authMiddleware(['COMPANY','USER']), deleteBonafidecertificateWithId);
router.get("/fetch-print/:id",authMiddleware(['COMPANY','USER']),  getBonafidecertificatePrint);
module.exports = router;