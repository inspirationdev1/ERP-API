const express = require("express");
const router = express.Router();
const authMiddleware = require('../auth/auth');
const { newExamination,  getExaminationByClass, updateExaminaitonWithId, deleteExaminationById, getExaminationById, getAllExaminations, getExaminationWithQuery} = require("../controller/examination.controller");


router.post("/new", authMiddleware(['COMPANY','USER']),newExamination);
router.get("/all", authMiddleware(['COMPANY','TEACHER','USER']), getAllExaminations);
router.get("/fetch-class/:classId",authMiddleware(['COMPANY','STUDENT','TEACHER','PARENT','USER']),  getExaminationByClass);
router.get("/fetch-with-query",authMiddleware(['COMPANY','USER','STUDENT','TEACHER','PARENT']),getExaminationWithQuery);
router.get('/single/:id',authMiddleware(['COMPANY','USER']), getExaminationById );
router.patch("/update/:id",authMiddleware(['COMPANY','USER']), updateExaminaitonWithId);
router.delete("/delete/:id",authMiddleware(['COMPANY','USER']),  deleteExaminationById);

module.exports = router;