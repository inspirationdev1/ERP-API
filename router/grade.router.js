const express = require("express");
const router = express.Router();
const authMiddleware = require('../auth/auth');
const { createGrade, getAllGrades,getGradeWithQuery, getGradeWithId, updateGradeWithId, deleteGradeWithId } = require("../controller/grade.controller");

router.post("/create",authMiddleware(['COMPANY','USER']), createGrade);
router.get("/fetch-all",authMiddleware(['COMPANY','USER']),getAllGrades);
router.get("/fetch-with-query",authMiddleware(['COMPANY','USER','TEACHER','STUDENT','PARENT']),getGradeWithQuery);
router.get("/fetch-single/:id",authMiddleware(['COMPANY','USER']),  getGradeWithId);
router.patch("/update/:id",authMiddleware(['COMPANY','USER']), updateGradeWithId);
router.delete("/delete/:id",authMiddleware(['COMPANY','USER']), deleteGradeWithId);



module.exports = router;