const express = require('express');
const controller = require('../../controllers/page.controller');
const { getAuth } = require('../../middlewares/auth');
const router = express.Router();

router
  .route('/')
  .get(getAuth('master.admin'), controller.list)
  .post(getAuth('master.admin'), controller.create);

router
  .route('/:pageId')
  .get(getAuth('master.admin'), controller.get)
  .patch(getAuth('master.admin'), controller.update)
  .delete(getAuth('master.admin'), controller.remove);

module.exports = router;
