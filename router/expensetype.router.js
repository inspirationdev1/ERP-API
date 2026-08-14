// getExpensetypeWithQuery
const express = require("express");
const router = express.Router();
const authMiddleware = require('../auth/auth');
const { createExpensetype, getAllExpensetypes, getExpensetypeWithId, updateExpensetypeWithId, deleteExpensetypeWithId,getExpensetypeWithQuery } = require("../controller/expensetype.controller");

router.post("/create",authMiddleware(['COMPANY','USER']), createExpensetype);
router.get("/fetch-all",authMiddleware(['COMPANY','USER']),getAllExpensetypes);
router.get("/fetch-single/:id",authMiddleware(['COMPANY','USER']),  getExpensetypeWithId);
router.patch("/update/:id",authMiddleware(['COMPANY','USER']), updateExpensetypeWithId);
router.delete("/delete/:id",authMiddleware(['COMPANY','USER']), deleteExpensetypeWithId);
router.get("/fetch-with-query",authMiddleware(['COMPANY','USER']),getExpensetypeWithQuery);


module.exports = router;