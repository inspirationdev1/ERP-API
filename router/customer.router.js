const express = require("express");
const {
  getCustomerWithQuery,
  loginCustomer,
  updateCustomerWithId,
  getCustomerWithId,
  signOut,
  isCustomerLoggedIn,
  getOwnDetails,
  registerCustomer,
  deleteCustomerWithId,
  documentAttachmentWithId,
  deleteDocumentAttachmentWithId,
} = require("../controller/customer.controller");
const authMiddleware = require("../auth/auth");
const router = express.Router();

router.post("/register", authMiddleware(["COMPANY", "USER"]), registerCustomer);
router.get(
  "/fetch-with-query",
  authMiddleware(["COMPANY", "USER", "TEACHER", "CUSTOMER", "PARENT"]),
  getCustomerWithQuery,
);
router.post("/login", loginCustomer);
router.patch(
  "/update/:id",
  authMiddleware(["COMPANY", "USER"]),
  updateCustomerWithId,
);
router.get("/fetch-own", authMiddleware(["CUSTOMER"]), getOwnDetails);
router.get(
  "/fetch-single/:id",
  authMiddleware(["CUSTOMER", "COMPANY", "USER"]),
  getCustomerWithId,
);
router.delete(
  "/delete/:id",
  authMiddleware(["COMPANY", "USER"]),
  deleteCustomerWithId,
);
router.get("/sign-out", signOut);
router.get("/is-login", isCustomerLoggedIn);
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
