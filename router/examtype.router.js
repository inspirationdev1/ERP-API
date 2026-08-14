const express = require("express");
const router = express.Router();
const authMiddleware = require('../auth/auth');
const { createExamtype, getAllExamtypes, getExamtypeWithId, updateExamtypeWithId, deleteExamtypeWithId } = require("../controller/examtype.controller");

router.post("/create",authMiddleware(['COMPANY','USER']), createExamtype);
router.get("/fetch-all",authMiddleware(['COMPANY','USER']),getAllExamtypes);
router.get("/fetch-single/:id",authMiddleware(['COMPANY','USER']),  getExamtypeWithId);
router.patch("/update/:id",authMiddleware(['COMPANY','USER']), updateExamtypeWithId);
router.delete("/delete/:id",authMiddleware(['COMPANY','USER']), deleteExamtypeWithId);

module.exports = router;