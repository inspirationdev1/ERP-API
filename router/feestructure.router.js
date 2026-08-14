const express = require("express");
const router = express.Router();
const authMiddleware = require('../auth/auth');
const { createFeestructure, getAllFeestructures, getFeestructureWithId, getFeestructureWithQuery, updateFeestructureWithId, deleteFeestructureWithId } = require("../controller/feestructure.controller");

router.post("/create", authMiddleware(['COMPANY','USER']), createFeestructure);
router.get("/fetch-all", authMiddleware(['COMPANY','USER']), getAllFeestructures);
router.get("/fetch-single/:id", authMiddleware(['COMPANY','USER']), getFeestructureWithId);
router.get("/fetch-with-query", authMiddleware(['COMPANY','USER']), getFeestructureWithQuery);
router.patch("/update/:id", authMiddleware(['COMPANY','USER']), updateFeestructureWithId);
router.delete("/delete/:id", authMiddleware(['COMPANY','USER']), deleteFeestructureWithId);

module.exports = router;