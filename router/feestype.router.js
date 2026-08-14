const express = require("express");
const router = express.Router();
const authMiddleware = require('../auth/auth');
const { createFeestype, getAllFeestypes, getFeestypeWithId, updateFeestypeWithId, deleteFeestypeWithId } = require("../controller/feestype.controller");

router.post("/create",authMiddleware(['COMPANY','USER']), createFeestype);
router.get("/fetch-all",authMiddleware(['COMPANY','USER']),getAllFeestypes);
router.get("/fetch-single/:id",authMiddleware(['COMPANY','USER']),  getFeestypeWithId);
router.patch("/update/:id",authMiddleware(['COMPANY','USER']), updateFeestypeWithId);
router.delete("/delete/:id",authMiddleware(['COMPANY','USER']), deleteFeestypeWithId);

module.exports = router;