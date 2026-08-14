const express = require("express");
const router = express.Router();
const authMiddleware = require('../auth/auth');
const { newQuestionpaper,  getQuestionpaperByClass, updateQuestionpaperWithId, deleteQuestionpaperById, getQuestionpaperById, getAllQuestionpapers, getQuestionpaperWithQuery} = require("../controller/questionpaper.controller");


router.post("/new", authMiddleware(['COMPANY','USER','TEACHER']),newQuestionpaper);
router.get("/all", authMiddleware(['COMPANY','USER','TEACHER','STUDENT','PARENT']), getAllQuestionpapers);
router.get("/fetch-with-query",authMiddleware(['COMPANY','USER','STUDENT','TEACHER','PARENT']),getQuestionpaperWithQuery);
router.get("/fetch-class/:classId",authMiddleware(['COMPANY','STUDENT','TEACHER','PARENT','USER']),  getQuestionpaperByClass);
router.get('/single/:id',authMiddleware(['COMPANY','USER','TEACHER']), getQuestionpaperById );
router.patch("/update/:id",authMiddleware(['COMPANY','USER','TEACHER']), updateQuestionpaperWithId);
router.delete("/delete/:id",authMiddleware(['COMPANY','USER','TEACHER']),  deleteQuestionpaperById);

module.exports = router;