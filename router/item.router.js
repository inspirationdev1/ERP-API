const express = require("express");
const router = express.Router();
const authMiddleware = require("../auth/auth");
const {
  createItem,
  getAllItems,
  getItemWithId,
  getItemWithQuery,
  updateItemWithId,
  deleteItemWithId,
} = require("../controller/item.controller");

router.post("/create", authMiddleware(["COMPANY", "USER"]), createItem);
router.get("/fetch-all", authMiddleware(["COMPANY", "USER"]), getAllItems);
router.get(
  "/fetch-single/:id",
  authMiddleware(["COMPANY", "USER"]),
  getItemWithId,
);
router.get(
  "/fetch-with-query",
  authMiddleware(["COMPANY", "USER"]),
  getItemWithQuery,
);
router.patch(
  "/update/:id",
  authMiddleware(["COMPANY", "USER"]),
  updateItemWithId,
);
router.delete(
  "/delete/:id",
  authMiddleware(["COMPANY", "USER"]),
  deleteItemWithId,
);

module.exports = router;
