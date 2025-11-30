const express = require('express');
const Validate = require('../../middlewares/validator');
const controller = require('../../controllers/country.controller');
const { getAuth } = require('../../middlewares/auth');
const { countryValidation } = require('../../validations');


const router = express.Router();



router
  .route('/')
  .post(getAuth('master.admin'), Validate(countryValidation.create), controller.create)
  .get(getAuth('master.admin'), Validate(countryValidation.list), controller.list);

router
  .route('/list')
  .get(controller.fetchCountry);

  
router
  .route('/load')
  .get(getAuth('master.admin'), controller.load);


router
  .route('/:countryId')
  .get(getAuth('master.admin'), Validate(countryValidation.get), controller.get)
/**
     * update the single location
     * */
  .put(getAuth('master.admin'), Validate(countryValidation.update), controller.update)
/**
     * delete  the single location
     * */

  .delete(getAuth('master.admin'), Validate(countryValidation.remove), controller.remove);

module.exports = router;
