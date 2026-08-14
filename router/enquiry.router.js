const express = require("express");
const router = express.Router();
const authMiddleware = require('../auth/auth');
const { createEnquiry, getAllEnquirys, getEnquiryWithId, updateEnquiryWithId, deleteEnquiryWithId,getEnquiryPrint,getEnquiryWithStudentId } = require("../controller/enquiry.controller");

router.post("/create",authMiddleware(['COMPANY','USER','TEACHER']), createEnquiry);
router.get("/fetch-all",authMiddleware(['COMPANY','USER','TEACHER']),getAllEnquirys);
router.get("/fetch-single/:id",authMiddleware(['COMPANY','USER','TEACHER']),  getEnquiryWithId);
router.patch("/update/:id",authMiddleware(['COMPANY','USER','TEACHER']), updateEnquiryWithId);
router.delete("/delete/:id",authMiddleware(['COMPANY','USER','TEACHER']), deleteEnquiryWithId);
router.get("/fetch-print/:id",authMiddleware(['COMPANY','USER','TEACHER']),  getEnquiryPrint);
router.get("/fetch-student-invoice",authMiddleware(['COMPANY','USER','TEACHER']),  getEnquiryWithStudentId);

module.exports = router;