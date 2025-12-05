const express = require('express');
const controller = require('../../controllers/uploader.controller');
const { getAuth } = require('../../middlewares/auth');

const router = express.Router();

/**
 * POST /api/v1/uploader
 * Upload single or multiple files
 * Body: multipart/form-data with files[] or file
 * Optional: folder, resize, width, height
 * Returns: { status, message, data: [{id, name, type, url, size, uploadedAt}] }
 */
router.post('/', getAuth('master.admin'), controller.create);

/**
 * PATCH /api/v1/uploader
 * Update file metadata
 * Body: { fileId, newName, newFolder }
 * Returns: { status, message, data: {id, name, folder, updatedAt} }
 */
router.patch('/', getAuth('master.admin'), controller.update);

/**
 * DELETE /api/v1/uploader
 * Delete file by URL or ID
 * Body: { fileUrl } or { fileId }
 * Returns: { status, message, data: {deletedFileUrl, deletedFileId, deletedAt} }
 */
router.delete('/', getAuth('master.admin'), controller.delete);

/**
 * GET /api/v1/uploader
 * List uploaded files (placeholder, future DB integration)
 * Query: limit, page, fileId
 * Returns: { status, message, data: [...], totalRecords }
 */
router.get('/', getAuth('master.admin'), controller.list);

module.exports = router;
