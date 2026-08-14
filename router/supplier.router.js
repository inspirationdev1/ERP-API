const express = require("express");
const {
  getSupplierWithQuery,
  loginSupplier,
  updateSupplierWithId,
  getSupplierWithId,
  signOut,
  isSupplierLoggedIn,
  getOwnDetails,
  registerSupplier,
  deleteSupplierWithId,
  documentAttachmentWithId,
  deleteDocumentAttachmentWithId,
} = require("../controller/supplier.controller");
const authMiddleware = require("../auth/auth");
const router = express.Router();

router.post("/register", authMiddleware(["COMPANY", "USER"]), registerSupplier);
router.get(
  "/fetch-with-query",
  authMiddleware(["COMPANY", "USER", "TEACHER", "SUPPLIER", "PARENT"]),
  getSupplierWithQuery,
);
router.post("/login", loginSupplier);
router.patch(
  "/update/:id",
  authMiddleware(["COMPANY", "USER"]),
  updateSupplierWithId,
);
router.get("/fetch-own", authMiddleware(["SUPPLIER"]), getOwnDetails);
router.get(
  "/fetch-single/:id",
  authMiddleware(["SUPPLIER", "COMPANY", "USER"]),
  getSupplierWithId,
);
router.delete(
  "/delete/:id",
  authMiddleware(["COMPANY", "USER"]),
  deleteSupplierWithId,
);
router.get("/sign-out", signOut);
router.get("/is-login", isSupplierLoggedIn);
router.post(
  "/document-attachment/:id",
  authMiddleware(["COMPANY", "USER"]),
  documentAttachmentWithId,
);
router.delete(
  "/delete-document-attachment/:id",
  authMiddleware(["COMPANY", "USER"]),
  deleteDocumentAttachmentWithId,
);

module.exports = router;
