const express = require("express");
const router = express.Router();
const authMiddleware = require('../auth/auth');
const { createAccountledger, getAllAccountledgers, getAccountledgerWithId, updateAccountledgerWithId, deleteAccountledgerWithId,getAccountledgerWithQuery } = require("../controller/accountledger.controller");

router.post("/create",authMiddleware(['COMPANY','USER']), createAccountledger);
router.get("/fetch-all",authMiddleware(['COMPANY','USER']),getAllAccountledgers);
router.get("/fetch-with-query",authMiddleware(['COMPANY','USER','TEACHER','STUDENT','PARENT']),getAccountledgerWithQuery);
router.get("/fetch-single/:id",authMiddleware(['COMPANY','USER']),  getAccountledgerWithId);
router.patch("/update/:id",authMiddleware(['COMPANY','USER']), updateAccountledgerWithId);
router.delete("/delete/:id",authMiddleware(['COMPANY','USER']), deleteAccountledgerWithId);

module.exports = router;