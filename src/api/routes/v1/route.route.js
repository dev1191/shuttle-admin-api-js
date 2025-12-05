const express = require('express');
const multer = require('multer');
const Validate = require('../../middlewares/validator');
const controller = require('../../controllers/route.controller');
const { getAuth } = require('../../middlewares/auth');
const {
  listRoute,
  createRoute,
  updateRoute,
} = require('../../validations/route.validation');

const upload = multer({});

const router = express.Router();

router
  .route('/test')
  .get(controller.testData);


router
  .route('/stops/:routeId')
  .get(controller.loadStops);


router
  .route('/')

  .get(getAuth('route.view', 'master.admin'), Validate(listRoute), controller.list)

  .post(getAuth('route.create', 'master.admin'), Validate(createRoute), controller.create);

router
  .route('/:locationId/options')
  .get(controller.getLocationRoute);


router
  .route('/load')
  .get(controller.load)
router
  .route('/find/:search')
  .get(getAuth('route.view', 'master.admin'), controller.search);

router
  .route('/data')
  .get(getAuth('route.view', 'master.admin'), controller.loadData);

router
  .route('/:routeId/status')
  /**
   *  update status
   * * */
  .patch(getAuth('route.edit', 'master.admin'), controller.status);


router
  .route('/:routeId')

  .get(getAuth('route.edit', 'master.admin'), controller.get)
  .patch(getAuth('route.edit', 'master.admin'),Validate(updateRoute), controller.update)
/**
  * delete  the single location
  * */

  .delete(getAuth('route.delete', 'master.admin'), controller.remove);



router
  .route('/route-stop/:routeId/:stopId')

  .delete(getAuth('route.delete', 'master.admin'), controller.removeRouteStop);

module.exports = router;
