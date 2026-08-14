const express = require("express");
const router = express.Router();
const authMiddleware = require('../auth/auth');
const { createSection, getAllSections, getSectionWithId, updateSectionWithId, deleteSectionWithId,getAttendeeTeacher } = require("../controller/section.controller");

router.post("/create",authMiddleware(['COMPANY','USER']), createSection);
router.get("/fetch-all",authMiddleware(['COMPANY','USER','TEACHER','STUDENT','PARENT']),getAllSections);
router.get("/fetch-single/:id",authMiddleware(['COMPANY','USER']),  getSectionWithId);
router.patch("/update/:id",authMiddleware(['COMPANY','USER']), updateSectionWithId);
router.delete("/delete/:id",authMiddleware(['COMPANY','USER']), deleteSectionWithId);
router.get("/attendee",authMiddleware(['TEACHER']), getAttendeeTeacher);
module.exports = router;