const express = require('express');
// const validate = require('express-validation');
const controller = require('../../controllers/notification.controller');
const { getAuth } = require('../../middlewares/auth');


const router = express.Router();




router
  .route('/')
  .get(getAuth('notification.view', 'master.admin'), controller.list)
  .post(getAuth('notification.create', 'master.admin'), controller.create);

router
  .route('/:id')
//   .get(getAuth('locations'), controller.get)
/**
   * update the single location
   * */
  .put(getAuth('notification.edit', 'master.admin'), controller.updateStatus)
// /**
//   * delete  the single location
//   * */
  .delete(getAuth('notification.delete', 'master.admin'), controller.remove);


module.exports = router;
