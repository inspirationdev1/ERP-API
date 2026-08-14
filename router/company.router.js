const express = require("express");
const authMiddleware = require("../auth/auth");
const {
  getAllCompanys,
  updateCompanyWithId,
  signOut,
  isCompanyLoggedIn,
  registerCompany,
  loginCompany,
  getCompanyOwnData,
} = require("../controller/company.controller");

const router = express.Router();

router.post("/register", registerCompany);
router.get("/all", getAllCompanys);
router.post("/login", loginCompany);
router.patch("/update", authMiddleware(["COMPANY"]), updateCompanyWithId);
router.get("/fetch-single", authMiddleware(["COMPANY"]), getCompanyOwnData);
router.get("/sign-out", signOut);
router.get("/is-login", isCompanyLoggedIn);

module.exports = router;
