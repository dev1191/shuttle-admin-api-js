const httpStatus = require("http-status");
const moment = require("moment-timezone");
const Booking = require("../models/booking.model");
const Payment = require("../models/payment.model");
const User = require("../models/user.model");
const Role = require("../models/role.model");
const Admin = require("../models/admin.model");
const Driver = require("../models/driver.model");
const HelpSupport = require("../models/helper.model");
const {
  fetchUserCount,
  fetchDriverCount,
  calculateChange,
  getMonthlyUserData,
  getMonthlyDriverData,
  getMonthlyVendorData,
  getMonthlyBookingData,
  getBookingLineData,
} = require("../services/dashboardService");

exports.getBookingData = async (req, res, next) => {
  try {
    const getBooking = await getBookingLineData(
      ["SCHEDULED", "COMPLETED", "CANCELLED", "EXPIRED"],
      DEFAULT_TIMEZONE
    );
    res.json({
      status: true,
      data: getBooking,
    });
  } catch (error) {
    next(error);
  }
};

exports.getTotalRecords = async (req, res, next) => {
  try {
    const getRole = await Role.findOne({ slug: "operator" }).lean();
    const getTotalvendors = await Admin.countDocuments({
      roleId: getRole._id,
    });

    const [geTotalCustomers, getTotalDrivers, getTotalBooking] = await Promise.all([
        User.countDocuments({ is_deleted: false }),
        Driver.countDocuments({ is_deleted: false }),
        Booking.countDocuments({
          travel_status: "COMPLETED",
        }),
      ]);

    // Fetch user counts for the last two months
    const getCustomerMonthCount = await fetchUserCount(DEFAULT_TIMEZONE);
    const getDriverMonthCount = await fetchDriverCount(DEFAULT_TIMEZONE);
    // const getBookingMonthCount = await fetchBookingCount('COMPLETED',DEFAULT_TIMEZONE)

    // Calculate percentage change between two months
    const getCustomer = calculateChange(
      getCustomerMonthCount.previousMonthCount,
      getCustomerMonthCount.currentMonthCount
    );
    const getDriver = calculateChange(
      getDriverMonthCount.previousMonthCount,
      getDriverMonthCount.currentMonthCount
    );

    result = [
      {
        id: "bookings",
        title: "booking.total",
        value: getTotalBooking,
        icon: "mso-menu_book",
        changeText: "2.5%",
        changeDirection: "up",
        iconBackground: "info",
        iconColor: "on-info",
        lineChartData: await getMonthlyBookingData(
          "COMPLETED",
          DEFAULT_TIMEZONE
        ),
      },
      {
        id: "vendors",
        title: "vendor.total",
        value: getTotalvendors,
        icon: "mso-account_circle",
        changeText: "2.5%",
        changeDirection: "up",
        iconBackground: "danger",
        iconColor: "on-danger",
        lineChartData: await getMonthlyVendorData(
          getRole._id,
          DEFAULT_TIMEZONE
        ),
      },
      {
        id: "customers",
        title: "customer.total",
        value: geTotalCustomers,
        icon: "mso-account_circle",
        changeText: getCustomer.changeText,
        changeDirection: getCustomer.changeDirection,
        iconBackground:
          getCustomer.changeDirection == "down" ? "danger" : "success",
        iconColor:
          getCustomer.changeDirection == "down" ? "on-danger" : "on-success",
        lineChartData: await getMonthlyUserData(DEFAULT_TIMEZONE),
      },
      {
        id: "drivers",
        title: "driver.total",
        value: getTotalDrivers,
        icon: "mso-account_circle",
        changeText: getDriver.changeText,
        changeDirection: getDriver.changeDirection,
        iconBackground:
          getDriver.changeDirection == "down" ? "danger" : "success",
        iconColor:
          getDriver.changeDirection == "down" ? "on-danger" : "on-success",
        lineChartData: await getMonthlyDriverData(DEFAULT_TIMEZONE),
      },
    ];
    const getBooking = await getBookingLineData(
      ["SCHEDULED", "COMPLETED", "CANCELLED", "EXPIRED"],
      DEFAULT_TIMEZONE
    );
    res.json({
      status: true,
      getBooking,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.countDown = async (req, res, next) => {
  try {
    const getcustomer = await User.countDocuments({ is_deleted: false });
    const getdriver = await Driver.countDocuments({ is_deleted: false });
    // const getvendor = await Admin.countDocuments({ role: 'vendors', isAdmin: false });
    const getHelpSupport = await HelpSupport.countDocuments({});
    const totalBooking = await Booking.countDocuments({
      travel_status: "COMPLETED",
    });

    const startDay = moment().tz(DEFAULT_TIMEZONE).startOf("day");
    const endDay = moment().tz(DEFAULT_TIMEZONE).endOf("day");
    const todayCompletedBooking = await Booking.countDocuments({
      travel_status: "COMPLETED",
      booking_date: { $gte: startDay, $lte: endDay },
    });
    const todayScheduledBooking = await Booking.countDocuments({
      travel_status: "SCHEDULED",
      booking_date: { $gte: startDay, $lte: endDay },
    });
    const todayBooking = await Booking.countDocuments({
      travel_status: "COMPLETED",
      booking_date: { $gte: startDay, $lte: endDay },
    });

    res.json({
      status: true,
      data: {
        countCustomer: {
          startVal: 3000,
          endVal: getcustomer,
          duration: 10000,
        },
        countDriver: {
          startVal: 0,
          endVal: getdriver,
          duration: 5000,
        },
        // countvendor: {
        //   startVal: 0,
        //   endVal: getvendor,
        //   duration: 4000,
        // },
        countHelp: {
          startVal: 2000,
          endVal: getHelpSupport,
          duration: 4000,
        },
        countTotalBooking: {
          startVal: 800,
          endVal: totalBooking,
          duration: 8000,
        },
        countTodayBooking: {
          startVal: 0,
          endVal: todayBooking,
          duration: 5000,
        },
        todayCompletedBooking: {
          startVal: 500,
          endVal: todayCompletedBooking,
          duration: 5000,
        },
        todayScheduledBooking: {
          startVal: 0,
          endVal: todayScheduledBooking,
          duration: 6000,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};