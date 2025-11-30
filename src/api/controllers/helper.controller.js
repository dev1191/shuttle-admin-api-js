const httpStatus = require("http-status");
const mongoose = require("mongoose");
const Helper = require("../models/helper.model");
const Reply = require("../models/reply.model");
const User = require("../models/user.model");
//const userFCM = require("../notifications/user")
const firebaseUser = require("../services/firebaseUser");
const userNotification = require("../models/userNotification.model");

/**
 * Get location list
 * @public
 */

exports.list = async (req, res, next) => {
  try {
    // const locations = await Location.list(req.query);
    // const transformedUsers = locations.map(location => location.transform());
    let condition = req.query.search
      ? {
          $or: [
            {
              ticket_no: {
                $regex: new RegExp(req.query.search),
                $options: "i",
              },
            },
            {
              firstname: {
                $regex: new RegExp(req.query.search),
                $options: "i",
              },
            },
            {
              lastname: { $regex: new RegExp(req.query.search), $options: "i" },
            },
            { email: { $regex: new RegExp(req.query.search), $options: "i" } },
            { gender: { $regex: new RegExp(req.query.search), $options: "i" } },
            // { phone:  { $regex: new RegExp(req.query.search), $options: 'i' } },
            {
              helpemail: {
                $regex: new RegExp(req.query.search),
                $options: "i",
              },
            },
            // { contact:  { $regex: new RegExp(req.query.search), $options: 'i' } }
          ],
        }
      : {};

    let sort = {};
    if (req.query.sortBy != "" && req.query.sortDesc != "") {
      sort = { [req.query.sortBy]: req.query.sortDesc === "desc" ? -1 : 1 };
    }

    const paginationoptions = {
      page: req.query.page || 1,
      limit: req.query.limit || 10,
      collation: { locale: "en" },
      customLabels: {
        totalDocs: "totalRecords",
        docs: "items",
      },
      sort,
      lean: true,
    };
    const aggregateQuery = Helper.aggregate([
      {
        $lookup:{
          from: "replies",
          let: { helperId: "$_id" },
          pipeline: [
            { $match:
               { $expr:
                  { $eq: ["$$helperId", "$helperId"] }
               }
            },
            {
              $project: {
                _id:0,
                title: 1,
                content: 1,
                createdAt: 1
              }
            }
          ],
          as: "replies"
        }
      },
      {
        $unwind: {
          path: "$replies",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          ids: "$_id",
          ticket_no: 1,
          firstname: 1,
          lastname: 1,
          gender: 1,
          email: 1,
          phone: 1,
          helpemail: 1,
          contact: 1,
          status: 1,
          description_short: { $substr: ["$description", 0, 10] },
          description: 1,
          createdAt: 1,
          replies: "$replies"
        },
      },
      {
        $match: condition,
      },
    ]);

    const result = await Helper.aggregatePaginate(
      aggregateQuery,
      paginationoptions
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
};

exports.reply = async (req, res, next) => {
  try {
    let helperId = req.params.helperId;
    const { adminId, email, title, content, type } = req.body;
    const getHelper = await Helper.findById(helperId);
    if (getHelper) {
      if (await User.exists({ email })) {
        let getUser = await User.findOne({ email }).lean();
        if (getUser) {
          let userId = getUser._id;
          if (type === "notification") {
            const saveObj = {
              adminId,
              helperId,
              userId,
              title,
              content,
            };
            const saveReply = await new Reply(saveObj).save();
            if (saveReply) {
              if (getUser && getUser.device_token) {
                let title = `Help and Support: ${saveReply.title} `;
                let body = `Ticket no: ${getHelper.ticket_no}\n${saveReply.content}`;
                const payload = {
                  token: getUser.device_token,
                  title,
                  body,
                  picture: "",
                };
                await firebaseUser.sendSingleMessage(payload);
                userNotification.create(
                  "support",
                  title,
                  body,
                  userId,
                  adminId,
                  {
                    helperId: helperId,
                    replyId: saveReply._id,
                  }
                );
              }
              res.status(httpStatus.CREATED);
              res.json({
                message: `Reply sent successfully.`,
                data: {},
                status: true,
              });
            }
          } else if (type === "email") {
          }
        } else {
          res.status(httpStatus.OK);
          res.json({
            message: "Customer not found.",
            status: false,
          });
        }
      } else {
        res.status(httpStatus.OK);
        res.json({
          message: "Customer not found.",
          status: false,
        });
      }
    } else {
      res.status(httpStatus.OK);
      res.json({
        message: "Ticket not found.",
        status: false,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Delete Helper
 * @public
 */
exports.remove = (req, res, next) => {
  Helper.deleteOne({ _id: req.params.helperId })
    .then(async () => {
      await userNotification.deleteOne({
        helperId: new mongoose.Types.ObjectId(req.params.helperId),
      });
      await Reply.deleteOne({
        helperId: new mongoose.Types.ObjectId(req.params.helperId),
      });
      res.status(httpStatus.OK).json({
        status: true,
        message: "Deleted successfully.",
      });
    })
    .catch((e) => next(e));
};
