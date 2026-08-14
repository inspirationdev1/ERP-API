const express = require("express");
const { getStudentWithQuery, loginStudent,updateStudentWithId,getStudentWithId,signOut,isStudentLoggedIn
    , getOwnDetails, registerStudent, deleteStudentWithId,admissionAttachmentWithId,deleteAdmissionAttachmentWithId } = require("../controller/student.controller");
const authMiddleware = require("../auth/auth");
const router = express.Router();


router.post('/register',authMiddleware(['COMPANY','USER']), registerStudent);
router.get("/fetch-with-query",authMiddleware(['COMPANY','USER','TEACHER','STUDENT','PARENT']),getStudentWithQuery);
router.post("/login", loginStudent);
router.patch("/update/:id",authMiddleware(['COMPANY','USER']), updateStudentWithId);
router.get("/fetch-own", authMiddleware(['STUDENT']), getOwnDetails);
router.get("/fetch-single/:id", authMiddleware(['STUDENT','COMPANY','USER']), getStudentWithId);
router.delete("/delete/:id",authMiddleware(['COMPANY','USER']),  deleteStudentWithId);
router.get("/sign-out", signOut);
router.get("/is-login",  isStudentLoggedIn);
router.post('/admission-attachment/:id',authMiddleware(['COMPANY','USER']), admissionAttachmentWithId);
router.delete("/delete-admission-attachment/:id",authMiddleware(['COMPANY','USER']),  deleteAdmissionAttachmentWithId);

module.exports = router;