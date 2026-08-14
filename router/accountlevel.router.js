const express = require("express");
const router = express.Router();
const authMiddleware = require('../auth/auth');
const { createAccountlevel, getAllAccountlevels, getAccountlevelWithId, updateAccountlevelWithId, deleteAccountlevelWithId,getAccountlevelWithQuery } = require("../controller/accountlevel.controller");

router.post("/create",authMiddleware(['COMPANY','USER']), createAccountlevel);
router.get("/fetch-all",authMiddleware(['COMPANY','USER']),getAllAccountlevels);
router.get("/fetch-with-query",authMiddleware(['COMPANY','USER','TEACHER','STUDENT','PARENT']),getAccountlevelWithQuery);
router.get("/fetch-single/:id",authMiddleware(['COMPANY','USER']),  getAccountlevelWithId);
router.patch("/update/:id",authMiddleware(['COMPANY','USER']), updateAccountlevelWithId);
router.delete("/delete/:id",authMiddleware(['COMPANY','USER']), deleteAccountlevelWithId);

module.exports = router;