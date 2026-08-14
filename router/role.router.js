const express = require("express");
const router = express.Router();
const authMiddleware = require('../auth/auth');
const { createRole, getAllRoles, getRoleWithId, updateRoleWithId, deleteRoleWithId } = require("../controller/role.controller");

router.post("/create",authMiddleware(['COMPANY','USER']), createRole);
router.get("/fetch-all",authMiddleware(['COMPANY','USER']),getAllRoles);
router.get("/fetch-single/:id",authMiddleware(['COMPANY','USER']),  getRoleWithId);
router.patch("/update/:id",authMiddleware(['COMPANY','USER']), updateRoleWithId);
router.delete("/delete/:id",authMiddleware(['COMPANY','USER']), deleteRoleWithId);

module.exports = router;