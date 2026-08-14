const express = require('express');
const router = express.Router();
const authMiddleware = require('../auth/auth');
const { createPeriod, getTeacherPeriods, getPeriods, getClassPeriods, updatePeriod, deletePeriod, getPeriodsWithId,getPeriodWithQuery } = require('../controller/period.controller');

router.post('/create',authMiddleware(['COMPANY','USER']), createPeriod);
router.get('/all',authMiddleware(['COMPANY','USER','TEACHER','STUDENT','PARENT']), getPeriods)
router.get('/teacher/:teacherId',authMiddleware(['COMPANY','USER','TEACHER','STUDENT','PARENT']), getTeacherPeriods);
router.get('/class/:classId',authMiddleware(['COMPANY','USER','TEACHER','STUDENT','PARENT']), getClassPeriods);
router.get('/:id',authMiddleware(['COMPANY','USER']), getPeriodsWithId)
router.get('/single/:id',authMiddleware(['COMPANY','USER']), getPeriodsWithId );
// router.put('/update/:id',authMiddleware(['COMPANY','USER']),  updatePeriod);
router.patch('/update/:id',authMiddleware(['COMPANY','USER']), updatePeriod);
router.delete('/delete/:id',authMiddleware(['COMPANY','USER']), deletePeriod);



module.exports = router;
