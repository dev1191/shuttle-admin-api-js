const express = require('express');
const Validate = require('../../middlewares/validator');
const controller = require('../../controllers/admin.controller');
const {
  authorize,
  deletes3Object,
  getAuth,
} = require('../../middlewares/auth');
const { AgentValidation } = require('../../validations');

const router = express.Router();

router
  .route('/')
  .get(getAuth('agent.view', 'master.admin'), controller.lists)
  .post(
    getAuth('agent.create', 'master.admin'),
    Validate(AgentValidation.createAgent),
    controller.create,
  );

router
  .route('/:adminId')

  /**
   * update the single location
   * */
  // .patch(
  //   getAuth('agent.edit', 'master.admin'),
  //   Validate(AgentValidation.updateAgent),
  //   controller.update,
  // )

/**
   * delete  the single location
   * */

  .delete(
    getAuth('agent.delete', 'master.admin'),
    Validate(AgentValidation.deleteAgent),
    deletes3Object,
    controller.remove,
  );

module.exports = router;
