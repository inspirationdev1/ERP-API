const express = require("express");
const router = express.Router();
const authMiddleware = require('../auth/auth');
const { createMenu, getAllMenu, getMenuWithId, updateMenuWithId, deleteMenuWithId } = require("../controller/menu.controller");

router.post("/create",authMiddleware(['COMPANY','USER']), createMenu);
router.get("/fetch-all",authMiddleware(['COMPANY','USER']),getAllMenu);
router.get("/fetch-single/:id",authMiddleware(['COMPANY','USER']),  getMenuWithId);
router.patch("/update/:id",authMiddleware(['COMPANY','USER']), updateMenuWithId);
router.delete("/delete/:id",authMiddleware(['COMPANY','USER']), deleteMenuWithId);

module.exports = router;