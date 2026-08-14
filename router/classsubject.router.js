const express = require("express");
const router = express.Router();
const authMiddleware = require('../auth/auth');
const { createClasssubjects, getAllClasssubjects,getClasssubjectsWithQuery
    , getClasssubjectsWithId, updateClasssubjectsWithId, deleteClasssubjectsWithId } = require("../controller/classsubject.controller");

router.post("/create",authMiddleware(['COMPANY','USER']), createClasssubjects);
router.get("/fetch-all",authMiddleware(['COMPANY','USER']),getAllClasssubjects);
router.get("/fetch-with-query",authMiddleware(['COMPANY','USER','TEACHER','STUDENT','PARENT']),getClasssubjectsWithQuery);
router.get("/fetch-single/:id",authMiddleware(['COMPANY','USER']),  getClasssubjectsWithId);
router.patch("/update/:id",authMiddleware(['COMPANY','USER']), updateClasssubjectsWithId);
router.delete("/delete/:id",authMiddleware(['COMPANY','USER']), deleteClasssubjectsWithId);



module.exports = router;