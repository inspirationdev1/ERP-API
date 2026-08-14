const express = require("express");
const router = express.Router();
const authMiddleware = require("../auth/auth");
const {
  createItemtype,
  getAllItemtypes,
  getItemtypeWithId,
  updateItemtypeWithId,
  deleteItemtypeWithId,
} = require("../controller/itemtype.controller");

router.post("/create", authMiddleware(["COMPANY", "USER"]), createItemtype);
router.get("/fetch-all", authMiddleware(["COMPANY", "USER"]), getAllItemtypes);
router.get(
  "/fetch-single/:id",
  authMiddleware(["COMPANY", "USER"]),
  getItemtypeWithId,
);
router.patch(
  "/update/:id",
  authMiddleware(["COMPANY", "USER"]),
  updateItemtypeWithId,
);
router.delete(
  "/delete/:id",
  authMiddleware(["COMPANY", "USER"]),
  deleteItemtypeWithId,
);

module.exports = router;
