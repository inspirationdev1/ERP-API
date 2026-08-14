const express = require("express");
const router = express.Router();
const authMiddleware = require('../auth/auth');
const { createMarksheet, getAllMarksheets,getMarksheetWithQuery
    , getMarksheetWithId, updateMarksheetWithId, deleteMarksheetWithId,getMarksheetPrint,getMarksheetWithStudentId } = require("../controller/marksheet.controller");

router.post("/create",authMiddleware(['COMPANY','USER','TEACHER']), createMarksheet);
router.get("/fetch-all",authMiddleware(['COMPANY','USER','TEACHER']),getAllMarksheets);
router.get("/fetch-with-query",authMiddleware(['COMPANY','USER','TEACHER','STUDENT','PARENT']),getMarksheetWithQuery);
router.get("/fetch-single/:id",authMiddleware(['COMPANY','USER','TEACHER']),  getMarksheetWithId);
router.patch("/update/:id",authMiddleware(['COMPANY','USER','TEACHER']), updateMarksheetWithId);
router.delete("/delete/:id",authMiddleware(['COMPANY','USER','TEACHER']), deleteMarksheetWithId);
router.get("/fetch-print/:id",authMiddleware(['COMPANY','USER','TEACHER']),  getMarksheetPrint);
router.get("/fetch-student-invoice",authMiddleware(['COMPANY','USER','TEACHER']),  getMarksheetWithStudentId);

module.exports = router;