const express = require("express");
const router = express.Router();
const authMiddleware = require('../auth/auth');
const { createExpense, getAllExpenses, getExpenseWithId, updateExpenseWithId, deleteExpenseWithId,getExpenseWithEmployeeId,getExpensePrint } = require("../controller/expense.controller");

router.post("/create",authMiddleware(['COMPANY','USER']), createExpense);
router.get("/fetch-all",authMiddleware(['COMPANY','USER']),getAllExpenses);
router.get("/fetch-single/:id",authMiddleware(['COMPANY','USER']),  getExpenseWithId);
router.patch("/update/:id",authMiddleware(['COMPANY','USER']), updateExpenseWithId);
router.delete("/delete/:id",authMiddleware(['COMPANY','USER']), deleteExpenseWithId);
router.get("/fetch-print/:id",authMiddleware(['COMPANY','USER']),  getExpensePrint);
router.get("/fetch-employee-expense",authMiddleware(['COMPANY','USER']),  getExpenseWithEmployeeId);
module.exports = router;