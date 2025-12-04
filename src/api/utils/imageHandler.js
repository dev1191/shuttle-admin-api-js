const { v4: uuidv4 } = require("uuid");
const settingModel = require("../models/setting.model");
const { imageDelete, imageUpload, resizeUpload, uploadLocal, uploadCloudinary, deleteCloudinary } = require("../services/uploaderService");


/**
 * Handle image upload with support for Local, Spaces, and Cloudinary
 *
 * @param {File|string} newFile - File object or base64 string of the new picture
 * @param {string} existingPicture - Existing image URL (if any)
 *  @param {string} folderName - folderName
 * @param {Object} options - upload options
 * @param {boolean} [options.resize=false] - Whether to resize the image
 * @param {number} [options.width] - Resize width
 * @param {number} [options.height] - Resize height
 * @param {string} [options.filenamePrefix="file"] - Prefix for the file name
 * @param {string} [options.quality] - For cloudinary
 * @returns {Promise<string>} - URL of the uploaded picture
 */
 const handleImageUpload = async (
  newFile,
  existingPicture,
  folderName,
  options = {}
) => {
  if (!newFile) return existingPicture;

  const { resize = false, width, height, filenamePrefix = "file", quality } = options;

  // get storage config from DB
  const storageConfig = await settingModel.getStorage();

  // delete old image if it's a valid URL
  if (isValidURL(existingPicture)) {
    switch (storageConfig.name) {
      case "cloudinary":
        await deleteCloudinary(storageConfig, existingPicture);
        break;
      default:
        await imageDelete(existingPicture, storageConfig.bucket || "");
    }
  }

  const filename = `${filenamePrefix}-${uuidv4()}`;

  // Normalize incoming file to one of: { buffer, mimetype, name } or base64 string
  let buffer = null;
  let mimetype = null;
  let originalName = null;
  let base64String = null;

  // req.files (express-fileupload) provides object with .data Buffer
  if (Buffer.isBuffer(newFile)) {
    buffer = newFile;
  } else if (newFile && newFile.data && Buffer.isBuffer(newFile.data)) {
    buffer = newFile.data;
    mimetype = newFile.mimetype;
    originalName = newFile.name;
  } else if (typeof newFile === 'string' && newFile.indexOf('base64') !== -1) {
    base64String = newFile;
  }

  // If we have a buffer and caller requested resize, pass raw base64 (no data: prefix)
  if (buffer && resize) {
    const base64Only = buffer.toString('base64');
    // resizeUpload expects raw base64 (without data:<type>;base64, prefix)
    const resized = await resizeUpload(true, base64Only, width, height);
    // resized is a Buffer
    buffer = Buffer.isBuffer(resized) ? resized : Buffer.from(resized);
    // ensure we have mimetype for later uploads
    mimetype = mimetype || 'image/png';
  }

  // If no resize and we have buffer, prepare base64String for local or cloudinary if needed
  if (buffer && !base64String) {
    const inferredType = mimetype || 'image/png';
    base64String = `data:${inferredType};base64,${buffer.toString('base64')}`;
  }

  switch ((storageConfig.name || 'local')) {
    case "spaces": {
      // For spaces (S3/DigitalOcean), use imageUpload which accepts Buffer or base64
      if (buffer) return await imageUpload(buffer, filename, storageConfig.bucket);
      if (base64String) return await imageUpload(base64String, filename, storageConfig.bucket);
      // fallback: try file upload helper if full file object provided
      if (newFile && newFile.name) return await module.exports.fileUpload(newFile, filename, storageConfig.bucket);
      throw new Error('Unsupported file format for spaces upload');
    }

    case "cloudinary": {
      // Cloudinary uploader accepts base64 or file object
      if (base64String) return await uploadCloudinary(storageConfig, base64String, folderName, height, width, quality);
      if (buffer) return await uploadCloudinary(storageConfig, buffer, folderName, height, width, quality);
      return await uploadCloudinary(storageConfig, newFile, folderName, height, width, quality);
    }

    case "local":
    default:
      // local upload expects base64 string
      if (base64String) return await uploadLocal(base64String, filename);
      if (buffer) return await uploadLocal(`data:${mimetype || 'image/png'};base64,${buffer.toString('base64')}`, filename);
      // fallback: if an object with name/data exists, upload via fileUpload
      if (newFile && newFile.name) return await module.exports.fileUpload(newFile, filename, storageConfig.bucket || 'uploads');
      throw new Error('Unsupported file format for local upload');
  }
};


 const isValidURL = (str) => {
  const regex = /(http|https):\/\/(\w+:{0,1}\w*)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/;
  if (!regex.test(str)) {
    return false;
  }
  return true;
};

module.exports = {
  handleImageUpload,
  isValidURL
};