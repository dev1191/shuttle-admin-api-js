const httpStatus = require('http-status');
const { v4: uuidv4 } = require('uuid');
const { URL } = require('url');
const APIError = require('../utils/APIError');
const { handleImageUpload } = require('../utils/imageHandler');

/**
 * Upload single or multiple files
 * Accepts multipart/form-data with files[] or files or file
 * Returns array of { id, name, type, url, size, uploadedAt }
 * @public
 */
exports.create = async (req, res, next) => {
  try {
    const folderName = req.body.folder || process.env.S3_BUCKET_USERPRO || 'uploads';
    const resize = req.body.resize === 'true' || req.body.resize === true;
    const width = parseInt(req.body.width) || 0;
    const height = parseInt(req.body.height) || 0;

    // Normalize incoming files from multipart
    const incoming = (req.files && (req.files.files || req.files.file)) || null;
    const fileArray = [];
    if (Array.isArray(incoming)) {
      fileArray.push(...incoming);
    } else if (incoming) {
      fileArray.push(incoming);
    }

    if (fileArray.length === 0) {
      return res.status(httpStatus.BAD_REQUEST).json({
        status: false,
        message: 'No files provided',
      });
    }

    const uploadOptions = { resize, filenamePrefix: 'upload' };
    if (width > 0) uploadOptions.width = width;
    if (height > 0) uploadOptions.height = height;

    // Upload all files concurrently
    const uploadPromises = fileArray.map(async (file) => {
      try {
        const url = await handleImageUpload(file, null, folderName, uploadOptions);

        // Ensure uploader returned a string URL. Some upload helpers return an Error or object on failure.
        let finalUrl = url;
        if (typeof finalUrl !== 'string') {
          // if cloudinary/uploader returned an object with url property, use it
          if (finalUrl && typeof finalUrl.url === 'string') {
            finalUrl = finalUrl.url;
          } else {
            console.error('Upload helper returned non-string result for file', file.name, finalUrl);
            return null; // skip this file
          }
        }

        // derive a path value: use pathname if URL, otherwise return as-is
        let pathVal = finalUrl;
        try {
          if (typeof finalUrl === 'string' && (finalUrl.startsWith('http://') || finalUrl.startsWith('https://'))) {
            pathVal = new URL(finalUrl).pathname;
            // If a folderName was provided, prefer the path starting at that folder (e.g. '/stops/...')
            if (folderName) {
              const marker = `/${folderName}/`;
              const idx = pathVal.indexOf(marker);
              if (idx !== -1) {
                pathVal = pathVal.substring(idx); // keep leading '/'
              } else {
                // Some providers (cloudinary) nest under additional segments (e.g. '/<cloud>/image/upload/v123/.../folder/...')
                // Try to find the last occurrence of '/'+folderName and use from there
                const lastIdx = pathVal.lastIndexOf(`/${folderName}/`);
                if (lastIdx !== -1) pathVal = pathVal.substring(lastIdx);
              }
            }
          }
        } catch (e) {
          // leave pathVal as full url if parsing fails
        }

        return {
          id: uuidv4(),
          name: file.name || 'unnamed',
          type: file.mimetype || 'unknown',
          url: finalUrl,
          path: pathVal,
          size: file.size || 0,
          uploadedAt: new Date(),
        };
      } catch (err) {
        console.error(`Error uploading file ${file.name}:`, err);
        return null;
      }
    });

    const results = await Promise.all(uploadPromises);
    const successful = results.filter(Boolean);

    if (successful.length === 0) {
      throw new APIError({
        message: 'All file uploads failed',
        status: httpStatus.INTERNAL_SERVER_ERROR,
      });
    }

    // Return full URL(s) as strings (not objects)
    const urls = successful.map((s) => s.url);
    res.status(httpStatus.CREATED).json({
      status: true,
      message: `${successful.length} file(s) uploaded successfully.`,
      data: urls.length === 1 ? urls[0] : urls,
      totalUploaded: successful.length,
      totalRequested: fileArray.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update file metadata (name, folder reassignment, etc.)
 * Body: { fileId, newName, newFolder, ... }
 * Note: To re-upload, use create endpoint
 * @public
 */
exports.update = async (req, res, next) => {
  try {
    const { fileId, newName, newFolder } = req.body;

    if (!fileId) {
      return res.status(httpStatus.BAD_REQUEST).json({
        status: false,
        message: 'fileId is required',
      });
    }

    // This is a metadata-only update (no re-upload)
    // In production, you'd fetch from DB, update, and save
    // For now, return updated metadata
    const updatedFile = {
      id: fileId,
      name: newName || 'unnamed',
      folder: newFolder || 'uploads',
      // path is not known in metadata-only update; provide folder as path
      path: newFolder || 'uploads',
      updatedAt: new Date(),
    };

    // Return updated path (string)
    res.status(httpStatus.OK).json({
      status: true,
      message: 'File metadata updated successfully.',
      data: updatedFile.path,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete file by URL or ID
 * Body: { fileUrl } or { fileId }
 * Note: Requires S3/storage backend cleanup
 * @public
 */
exports.delete = async (req, res, next) => {
  try {
    const { url } = req.body;

    if (!fileUrl && !fileId) {
      return res.status(httpStatus.BAD_REQUEST).json({
        status: false,
        message: 'fileUrl or fileId is required',
      });
    }

    // In production, you would:
    // 1. Fetch file record from DB using fileId or fileUrl
    // 2. Call imageDelete(fileUrl, folderName) to remove from S3/storage
    // 3. Delete from DB
    // For now, just return success response

    // derive deleted path
    let deletedPath = fileUrl || null;
    try {
      if (deletedPath && (deletedPath.startsWith('http://') || deletedPath.startsWith('https://'))) {
        deletedPath = new URL(deletedPath).pathname;
      }
    } catch (e) {
      // leave as-is
    }

    res.status(httpStatus.OK).json({
      status: true,
      message: 'File deleted successfully.',
      data: {
        deletedFileUrl: fileUrl,
        deletedFilePath: deletedPath,
        deletedFileId: fileId,
        deletedAt: new Date(),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get file upload status/info (placeholder for future DB integration)
 * Query: { fileId } or { limit, page }
 * @public
 */
exports.list = async (req, res, next) => {
  try {
    // Placeholder: In production, fetch from DB with pagination
    res.status(httpStatus.OK).json({
      status: true,
      message: 'File list retrieved.',
      data: [],
      totalRecords: 0,
    });
  } catch (error) {
    next(error);
  }
};
