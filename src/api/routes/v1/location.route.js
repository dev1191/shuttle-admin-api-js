const express = require('express');
const Validate = require('../../middlewares/validator');
const controller = require('../../controllers/location.controller');
const { getAuth } = require('../../middlewares/auth');
const { locationValidation } = require('../../validations');


const router = express.Router();


router
  .route('/')
  .get(getAuth('stop.view', 'master.admin'), Validate(locationValidation.listLocations), controller.list)
  .post(getAuth('stop.create', 'master.admin'), Validate(locationValidation.createLocation), controller.create);

router
  .route("/is-exists")
  .post(controller.istitleExists);


router
  .route('/load')
  .get(getAuth('stop.view', 'master.admin'), controller.load);


router
  .route('/search')
  .get(getAuth('stop.view', 'master.admin'), controller.search);


router
  .route('/:locationId')
  .get(getAuth('stop.edit', 'master.admin'), controller.get)
  /**
  * update the single location
  * */
  .put(getAuth('stop.edit', 'master.admin'), Validate(locationValidation.updateLocation), controller.update)
/**
  * delete  the single location
  * */

  .delete(getAuth('stop.delete', 'master.admin'), Validate(locationValidation.deleteLocation), controller.remove);

  
router
  .route('/:locationId/status')
  .patch(getAuth('stop.edit', 'master.admin'), Validate(locationValidation.updateLocationStatus), controller.status);
module.exports = router;
