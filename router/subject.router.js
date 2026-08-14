const express = require("express");
const router = express.Router();
const authMiddleware = require('../auth/auth');
const { createSubject, getAllSubjects, getSubjectWithId, updateSubjectWithId, deleteSubjectWithId } = require("../controller/subject.controller");

router.post("/create",authMiddleware(['COMPANY','USER']), createSubject);
router.get("/fetch-all",authMiddleware(['COMPANY','USER','TEACHER','STUDENT','PARENT']),getAllSubjects);
router.get("/fetch-single/:id",authMiddleware(['COMPANY','USER']),  getSubjectWithId);
router.patch("/update/:id",authMiddleware(['COMPANY','USER']), updateSubjectWithId);
router.delete("/delete/:id",authMiddleware(['COMPANY','USER']), deleteSubjectWithId);

module.exports = router;