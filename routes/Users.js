const express = require('express');
const { fetchUserById, updateUser,countUsers} = require('../controller/User');

const router = express.Router();
router.get('/own', fetchUserById)
      .get('/countuser',countUsers)
      .patch('/:id', updateUser)
exports.router = router;