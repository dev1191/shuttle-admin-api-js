const httpStatus = require("http-status");
const Page = require("../models/page.model");

/**
 * Create new page
 */
exports.create = async (req, res, next) => {
  try {
    const page = new Page(req.body);
    const saved = await page.save();
    res.status(httpStatus.CREATED);
    res.json({
      status: true,
      message: "Page created successfully.",
      page: Page.transform(saved) || saved,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single page
 */
exports.get = async (req, res, next) => {
  try {
    const page = await Page.findById(req.params.pageId).lean();
    if (!page) return res
        .status(httpStatus.NOT_FOUND)
        .json({ status: false, message: "Page not found." });
    res.json({ status: true, page: Page.transform(page) || page });
  } catch (error) {
    next(error);
  }
};

/**
 * Get list of pages
 */
exports.list = async (req, res, next) => {
  try {
    const options = {
      page: parseInt(req.query.page, 10) || 1,
      limit: parseInt(req.query.limit, 10) || 10,
      sort: { createdAt: -1 },
      customLabels: {
        totalDocs: "totalRecords",
        docs: "items",
      },
      lean: true,
    };
    const condition = { is_deleted: false };
    if (req.query.search) {
      condition.$or = [
        { title: { $regex: req.query.search, $options: "i" } },
        { content: { $regex: req.query.search, $options: "i" } },
      ];
    }
    const result = await Page.paginate(condition, options);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Update page
 */
exports.update = async (req, res, next) => {
  try {
    const updated = await Page.findByIdAndUpdate(req.params.pageId, req.body, {
      new: true,
      runValidators: true,
    }).lean();
    if (!updated) return res
        .status(httpStatus.NOT_FOUND)
        .json({ status: false, message: "Page not found." });
    res.json({
      status: true,
      message: "Page updated successfully.",
      page: Page.transform(updated) || updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete page
 */
exports.remove = async (req, res, next) => {
  try {
    await Page.deleteOne({ _id: req.params.pageId });
    res.json({ status: true, message: "Page deleted successfully." });
  } catch (error) {
    next(error);
  }
};
