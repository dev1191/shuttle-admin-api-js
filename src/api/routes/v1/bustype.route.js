const express = require('express');
const Validate = require('../../middlewares/validator');
const controller = require('../../controllers/bustype.controller');
const { getAuth } = require('../../middlewares/auth');
const { bustypeValidation } = require('../../validations');

const router = express.Router();

router
  .route('/')
    .get(
    getAuth('bus.type.view', 'master.admin'),
    Validate(bustypeValidation.listBusTypes),
    controller.list,
  )
  .post(
    getAuth('bus.type.create', 'master.admin'),
    Validate(bustypeValidation.createBusTypes),
    controller.create,
  );

router
  .route('/load')
  .get(getAuth('master.admin'), controller.load);

router
  .route('/:bustypeId')

  .get(
    getAuth('bus.type.edit', 'master.admin'),
    Validate(bustypeValidation.getBusTypes),
    controller.get,
  )
  /**
   * update the single location
   * */
  .put(
    getAuth('bus.type.edit', 'master.admin'),
    Validate(bustypeValidation.updateBusTypes),
    controller.update,
  )
  /**
   * delete  the single location
   * */

  .delete(
    getAuth('bus.type.delete', 'master.admin'),
    Validate(bustypeValidation.deleteBusTypes),
    controller.remove,
  );

module.exports = router;
