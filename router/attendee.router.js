const express = require("express");
const router = express.Router();
const authMiddleware = require('../auth/auth');
const { createAttendee, getAllAttendees, getAttendeeWithId
    , updateAttendeeWithId, deleteAttendeeWithId,getAttendeePrint } = require("../controller/attendee.controller");

router.post("/create",authMiddleware(['COMPANY','USER']), createAttendee);
router.get("/fetch-all",authMiddleware(['COMPANY','USER']),getAllAttendees);
router.get("/fetch-single/:id",authMiddleware(['COMPANY','USER']),  getAttendeeWithId);
router.patch("/update/:id",authMiddleware(['COMPANY','USER']), updateAttendeeWithId);
router.delete("/delete/:id",authMiddleware(['COMPANY','USER']), deleteAttendeeWithId);
router.get("/fetch-print/:id",authMiddleware(['COMPANY','USER']),  getAttendeePrint);
module.exports = router;