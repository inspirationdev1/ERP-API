const express = require("express");
const router = express.Router();
const authMiddleware = require('../auth/auth');
const { createTaxrate, getAllTaxrates,getTaxrateWithQuery, getTaxrateWithId, updateTaxrateWithId, deleteTaxrateWithId } = require("../controller/taxrate.controller");

router.post("/create",authMiddleware(['COMPANY','USER']), createTaxrate);
router.get("/fetch-all",authMiddleware(['COMPANY','USER']),getAllTaxrates);
router.get("/fetch-with-query",authMiddleware(['COMPANY','USER','TEACHER','STUDENT','PARENT']),getTaxrateWithQuery);
router.get("/fetch-single/:id",authMiddleware(['COMPANY','USER']),  getTaxrateWithId);
router.patch("/update/:id",authMiddleware(['COMPANY','USER']), updateTaxrateWithId);
router.delete("/delete/:id",authMiddleware(['COMPANY','USER']), deleteTaxrateWithId);



module.exports = router;