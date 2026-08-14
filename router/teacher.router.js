const express = require("express");
const { getTeacherWithQuery, loginTeacher,updateTeacherWithId,getTeacherWithId,signOut,isTeacherLoggedIn,  registerTeacher, deleteTeacherWithId ,getTeacherOwnDetails} = require("../controller/teacher.controller");
const router = express.Router();
const authMiddleware = require("../auth/auth");

router.post('/register',authMiddleware(['COMPANY','USER']), registerTeacher);
router.get("/fetch-with-query",authMiddleware(['COMPANY','USER','TEACHER','STUDENT','PARENT']),getTeacherWithQuery);
router.post("/login", loginTeacher);
router.patch("/update/:id", authMiddleware(['COMPANY','USER']), updateTeacherWithId);
router.get("/fetch-own", authMiddleware(['TEACHER']), getTeacherOwnDetails);
router.get("/fetch-single/:id", authMiddleware(['TEACHER','COMPANY','USER']), getTeacherWithId);
router.delete("/delete/:id",authMiddleware(['COMPANY','USER']),  deleteTeacherWithId)
// router.get("/sign-out", signOut);
// router.get("/is-login",  isTeacherLoggedIn)

module.exports = router;