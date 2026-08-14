const express = require("express");
const { getUserWithQuery, loginUser, updateUserWithId, getUserWithId, signOut, isUserLoggedIn, registerUser, deleteUserWithId, getUserOwnDetails, getAllUsers } = require("../controller/user.controller");
const router = express.Router();
const authMiddleware = require("../auth/auth");

router.post('/register', authMiddleware(['COMPANY','USER']), registerUser);
router.get("/fetch-with-query", authMiddleware(['COMPANY','USER']), getUserWithQuery);
router.post("/login", loginUser);
router.patch("/update/:id",authMiddleware(['COMPANY','USER']), updateUserWithId);
router.get("/fetch-own", authMiddleware(['COMPANY','USER']), getUserOwnDetails);
router.get("/fetch-all", authMiddleware(['COMPANY','USER']), getAllUsers);

router.get("/fetch-single/:id", authMiddleware(['COMPANY','USER']), getUserWithId);
router.delete("/delete/:id", authMiddleware(['COMPANY','USER']), deleteUserWithId)
// router.get("/sign-out", signOut);
// router.get("/is-login",  isUserLoggedIn)

module.exports = router;