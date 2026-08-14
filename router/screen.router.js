const express = require("express");
const router = express.Router();
const authMiddleware = require('../auth/auth');
const { createScreen, getAllScreens, getScreenWithId, updateScreenWithId, deleteScreenWithId } = require("../controller/screen.controller");

router.post("/create",authMiddleware(['COMPANY','USER']), createScreen);
router.get("/fetch-all",authMiddleware(['COMPANY','USER']),getAllScreens);
router.get("/fetch-single/:id",authMiddleware(['COMPANY','USER']),  getScreenWithId);
router.patch("/update/:id",authMiddleware(['COMPANY','USER']), updateScreenWithId);
router.delete("/delete/:id",authMiddleware(['COMPANY','USER']), deleteScreenWithId);

module.exports = router;