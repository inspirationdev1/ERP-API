const express = require("express");
const router = express.Router();
const authMiddleware = require('../auth/auth');
const { createItemgroup, getAllItemgroups, getItemgroupWithId, updateItemgroupWithId, deleteItemgroupWithId,getItemgroupWithQuery } = require("../controller/itemgroup.controller");

router.post("/create",authMiddleware(['COMPANY','USER']), createItemgroup);
router.get("/fetch-all",authMiddleware(['COMPANY','USER']),getAllItemgroups);
router.get("/fetch-with-query",authMiddleware(['COMPANY','USER','TEACHER','STUDENT','PARENT']),getItemgroupWithQuery);
router.get("/fetch-single/:id",authMiddleware(['COMPANY','USER']),  getItemgroupWithId);
router.patch("/update/:id",authMiddleware(['COMPANY','USER']), updateItemgroupWithId);
router.delete("/delete/:id",authMiddleware(['COMPANY','USER']), deleteItemgroupWithId);

module.exports = router;