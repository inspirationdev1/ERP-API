const express = require("express");
const router = express.Router();
const authMiddleware = require('../auth/auth');
const { createCastecertificate, getAllCastecertificates, getCastecertificateWithId
    , updateCastecertificateWithId, deleteCastecertificateWithId,getCastecertificatePrint } = require("../controller/castecertificate.controller");

router.post("/create",authMiddleware(['COMPANY','USER']), createCastecertificate);
router.get("/fetch-all",authMiddleware(['COMPANY','USER']),getAllCastecertificates);
router.get("/fetch-single/:id",authMiddleware(['COMPANY','USER']),  getCastecertificateWithId);
router.patch("/update/:id",authMiddleware(['COMPANY','USER']), updateCastecertificateWithId);
router.delete("/delete/:id",authMiddleware(['COMPANY','USER']), deleteCastecertificateWithId);
router.get("/fetch-print/:id",authMiddleware(['COMPANY','USER']),  getCastecertificatePrint);
module.exports = router;