// routes/notices.js
const express = require("express");
const router = express.Router();
const authMiddleware = require('../auth/auth');
const { newNotice, fetchAllAudiance, fetchAudiance, deleteNotice, editNotice } = require("../controller/notice.controller");

router.post("/add", authMiddleware(['COMPANY','USER']), newNotice);
router.get("/fetch/all",authMiddleware(['COMPANY','TEACHER','STUDENT','PARENT','USER']), fetchAllAudiance)
router.get("/fetch/:audience",authMiddleware(['COMPANY','TEACHER','STUDENT','PARENT','USER']),fetchAudiance);
router.put("/:id",authMiddleware(['COMPANY','USER']),editNotice)
router.delete("/:id",authMiddleware(['COMPANY','USER']),deleteNotice)
  
module.exports = router;
