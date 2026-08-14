const express = require("express");
const router = express.Router();
const authMiddleware = require('../auth/auth');
const { createJournalvoucher, getAllJournalvouchers, getJournalvoucherWithId, updateJournalvoucherWithId, deleteJournalvoucherWithId,getJournalvoucherWithEmployeeId,getJournalvoucherPrint } = require("../controller/journalvoucher.controller");

router.post("/create",authMiddleware(['COMPANY','USER']), createJournalvoucher);
router.get("/fetch-all",authMiddleware(['COMPANY','USER']),getAllJournalvouchers);
router.get("/fetch-single/:id",authMiddleware(['COMPANY','USER']),  getJournalvoucherWithId);
router.patch("/update/:id",authMiddleware(['COMPANY','USER']), updateJournalvoucherWithId);
router.delete("/delete/:id",authMiddleware(['COMPANY','USER']), deleteJournalvoucherWithId);
router.get("/fetch-print/:id",authMiddleware(['COMPANY','USER']),  getJournalvoucherPrint);
router.get("/fetch-employee-journalvoucher",authMiddleware(['COMPANY','USER']),  getJournalvoucherWithEmployeeId);
module.exports = router;