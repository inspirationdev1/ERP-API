const express = require("express");
const router = express.Router();
const authMiddleware = require('../auth/auth');
const { createUserpermission, getAllUserpermissions, getUserpermissionWithQuery, getUserpermissionWithId, updateUserpermissionWithId, deleteUserpermissionWithId } = require("../controller/userpermission.controller");

router.post("/create",authMiddleware(['COMPANY','USER']), createUserpermission);
router.get("/fetch-all",authMiddleware(['COMPANY','USER']),getAllUserpermissions);
router.get("/fetch-with-query",authMiddleware(['COMPANY','USER','TEACHER','STUDENT','PARENT']),getUserpermissionWithQuery);
router.get("/fetch-single/:id",authMiddleware(['COMPANY','USER']),  getUserpermissionWithId);
router.patch("/update/:id",authMiddleware(['COMPANY','USER']), updateUserpermissionWithId);
router.delete("/delete/:id",authMiddleware(['COMPANY','USER']), deleteUserpermissionWithId);

module.exports = router;