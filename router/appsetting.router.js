const express = require("express");
const router = express.Router();
const authMiddleware = require('../auth/auth');
const { createAppsetting, getAllAppsettings, getAppsettingWithId, updateAppsettingWithId, deleteAppsettingWithId } = require("../controller/appsetting.controller");

router.post("/create",authMiddleware(['COMPANY','USER']), createAppsetting);
router.get("/fetch-all",authMiddleware(['COMPANY','USER','TEACHER','STUDENT','PARENT']),getAllAppsettings);
router.get("/fetch-single/:id",authMiddleware(['COMPANY','USER']),  getAppsettingWithId);
router.patch("/update/:id",authMiddleware(['COMPANY','USER']), updateAppsettingWithId);
router.delete("/delete/:id",authMiddleware(['COMPANY','USER']), deleteAppsettingWithId);

module.exports = router;