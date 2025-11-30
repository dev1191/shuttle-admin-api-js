const moment = require("moment-timezone");
const Payment = require('../models/payment.model');
const Booking = require('../models/booking.model');
const User = require("../models/user.model");
const Role = require("../models/role.model");
const Admin = require("../models/admin.model");
const Driver = require("../models/driver.model");

const paymentChart = async (start_date, end_date, condition) => {
  try {
    const FIRST_MONTH = 1;
    const LAST_MONTH = 12;
    const TODAY = start_date; // moment().tz("Asia/Kolkata").format("YYYY-MM-DD");
    const YEAR_BEFORE = end_date; // moment().subtract(1, 'years').format("YYYY-MM-DD");
    // console.log("TODAY", TODAY);
    // console.log("YEAR_BEFORE", YEAR_BEFORE);
    const MONTHS_ARRAY = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    const data = await Payment.aggregate([
      {
        $match: condition,
      },
      {
        $group: {
          _id: { year_month: { $substrCP: ['$createdAt', 0, 7] } },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { '_id.year_month': 1 },
      },
      {
        $project: {
          _id: 0,
          count: 1,
          month_year: {
            $concat: [
              {
                $arrayElemAt: [
                  MONTHS_ARRAY,
                  {
                    $subtract: [
                      { $toInt: { $substrCP: ['$_id.year_month', 5, 2] } },
                      1,
                    ],
                  },
                ],
              },
              '-',
              { $substrCP: ['$_id.year_month', 0, 4] },
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          data: { $push: { k: '$month_year', v: '$count' } },
        },
      },
      {
        $addFields: {
          start_year: { $substrCP: [YEAR_BEFORE, 0, 4] },
          end_year: { $substrCP: [TODAY, 0, 4] },
          months1: {
            $range: [
              { $toInt: { $substrCP: [YEAR_BEFORE, 5, 2] } },
              { $add: [LAST_MONTH, 1] },
            ],
          },
          months2: {
            $range: [
              FIRST_MONTH,
              { $add: [{ $toInt: { $substrCP: [TODAY, 5, 2] } }, 1] },
            ],
          },
        },
      },
      {
        $addFields: {
          template_data: {
            $concatArrays: [
              {
                $map: {
                  input: '$months1',
                  as: 'm1',
                  in: {
                    count: 0,
                    month_year: {
                      $concat: [
                        {
                          $arrayElemAt: [
                            MONTHS_ARRAY,
                            { $subtract: ['$$m1', 1] },
                          ],
                        },
                        '-',
                        '$start_year',
                      ],
                    },
                  },
                },
              },
              {
                $map: {
                  input: '$months2',
                  as: 'm2',
                  in: {
                    count: 0,
                    month_year: {
                      $concat: [
                        {
                          $arrayElemAt: [
                            MONTHS_ARRAY,
                            { $subtract: ['$$m2', 1] },
                          ],
                        },
                        '-',
                        '$end_year',
                      ],
                    },
                  },
                },
              },
            ],
          },
        },
      },
      {
        $addFields: {
          years_data: {
            $map: {
              input: '$template_data',
              as: 't',
              in: '$$t.month_year',
            },
          },
          data: {
            $map: {
              input: '$template_data',
              as: 't',
              in: {
                $reduce: {
                  input: '$data',
                  initialValue: 0,
                  in: {
                    $cond: [
                      { $eq: ['$$t.month_year', '$$this.k'] },
                      { $add: ['$$this.v', '$$value'] },
                      { $add: [0, '$$value'] },
                    ],
                  },
                },

              },
            },
          },
        },
      },
      {
        $project: {
          years_data: '$years_data',
          data: '$data',
          _id: 0,
        },
      },
    ]);
    return data;
  } catch (err) {
    return false;
  }
};


const bookingChart = async (start_date, end_date, condition) => {
  try {
    const FIRST_MONTH = 1;
    const LAST_MONTH = 12;
    const TODAY = start_date; // moment().tz("Asia/Kolkata").format("YYYY-MM-DD");
    const YEAR_BEFORE = end_date; // moment().subtract(1, 'years').format("YYYY-MM-DD");
    // console.log("TODAY", TODAY);
    // console.log("YEAR_BEFORE", YEAR_BEFORE);
    const MONTHS_ARRAY = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    const data = await Booking.aggregate([
      {
        $match: condition,
      },
      {
        $group: {
          _id: { year_month: { $substrCP: ['$booking_date', 0, 7] } },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { '_id.year_month': 1 },
      },
      {
        $project: {
          _id: 0,
          count: 1,
          month_year: {
            $concat: [
              {
                $arrayElemAt: [
                  MONTHS_ARRAY,
                  {
                    $subtract: [
                      { $toInt: { $substrCP: ['$_id.year_month', 5, 2] } },
                      1,
                    ],
                  },
                ],
              },
              '-',
              { $substrCP: ['$_id.year_month', 0, 4] },
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          data: { $push: { k: '$month_year', v: '$count' } },
        },
      },
      {
        $addFields: {
          start_year: { $substrCP: [YEAR_BEFORE, 0, 4] },
          end_year: { $substrCP: [TODAY, 0, 4] },
          months1: {
            $range: [
              { $toInt: { $substrCP: [YEAR_BEFORE, 5, 2] } },
              { $add: [LAST_MONTH, 1] },
            ],
          },
          months2: {
            $range: [
              FIRST_MONTH,
              { $add: [{ $toInt: { $substrCP: [TODAY, 5, 2] } }, 1] },
            ],
          },
        },
      },
      {
        $addFields: {
          template_data: {
            $concatArrays: [
              {
                $map: {
                  input: '$months1',
                  as: 'm1',
                  in: {
                    count: 0,
                    month_year: {
                      $concat: [
                        {
                          $arrayElemAt: [
                            MONTHS_ARRAY,
                            { $subtract: ['$$m1', 1] },
                          ],
                        },
                        '-',
                        '$start_year',
                      ],
                    },
                  },
                },
              },
              {
                $map: {
                  input: '$months2',
                  as: 'm2',
                  in: {
                    count: 0,
                    month_year: {
                      $concat: [
                        {
                          $arrayElemAt: [
                            MONTHS_ARRAY,
                            { $subtract: ['$$m2', 1] },
                          ],
                        },
                        '-',
                        '$end_year',
                      ],
                    },
                  },
                },
              },
            ],
          },
        },
      },
      {
        $addFields: {
          years_data: {
            $map: {
              input: '$template_data',
              as: 't',
              in: '$$t.month_year',
            },
          },
          data: {
            $map: {
              input: '$template_data',
              as: 't',
              in: {
                $reduce: {
                  input: '$data',
                  initialValue: 0,
                  in: {
                    $cond: [
                      { $eq: ['$$t.month_year', '$$this.k'] },
                      { $add: ['$$this.v', '$$value'] },
                      { $add: [0, '$$value'] },
                    ],
                  },
                },

              },
            },
          },
        },
      },
      {
        $project: {
          years_data: '$years_data',
          data: '$data',
          _id: 0,
        },
      },
    ]);
    return data;
  } catch (err) {
    return false;
  }
};

// Function to calculate percentage change
const calculateChange = (previousValue, currentValue) => {
    // Ensure values are valid numbers
    if (isNaN(previousValue) || isNaN(currentValue)) {
      return {
        changeText: 'Invalid input',
        changeDirection: null,
      };
    }
  
    if (previousValue === 0) {
      return {
        changeText: 'N/A',
        changeDirection: null,
      };
    }
  const change = ((currentValue - previousValue) / previousValue) * 100;
  const changeDirection = change > 0 ? 'up' : 'down';
  return {
    changeText: `${Math.abs(change).toFixed(2)}%`,
    changeDirection,
  };
};

const fetchUserCount = async (timeZone) => {
  const currentDate = moment.tz(timeZone).startOf('month'); // Start of the current month
  const lastMonthStart = currentDate.clone().subtract(1, 'month').toDate(); // Start of last month
  const twoMonthsAgoStart = currentDate.clone().subtract(2, 'months').toDate(); // Start of two months ago

  // Count users created in the previous month and two months ago
  const previousMonthCount = await User.countDocuments({
    is_deleted: false,
    createdAt: { 
      $gte: twoMonthsAgoStart, 
      $lt: lastMonthStart
    }
  });

  const currentMonthCount = await User.countDocuments({
    is_deleted: false,
    createdAt: { 
      $gte: lastMonthStart, 
      $lt: currentDate.toDate() 
    }
  });

  return { previousMonthCount, currentMonthCount };
};

const fetchDriverCount = async (timeZone) => {
  const currentDate = moment.tz(timeZone).startOf('month'); // Start of the current month
  const lastMonthStart = currentDate.clone().subtract(1, 'month').toDate(); // Start of last month
  const twoMonthsAgoStart = currentDate.clone().subtract(2, 'months').toDate(); // Start of two months ago

  console.log("lastMonthStart",lastMonthStart)
  console.log("twoMonthsAgoStart",twoMonthsAgoStart)
  // Count users created in the previous month and two months ago
  const previousMonthCount = await Driver.countDocuments({
    is_deleted: false,
    createdAt: { 
      $gte: twoMonthsAgoStart, 
      $lt: lastMonthStart
    }
  });

  const currentMonthCount = await Driver.countDocuments({
    is_deleted: false,
    createdAt: { 
      $gte: lastMonthStart, 
      $lt: currentDate.toDate() 
    }
  });

  return { previousMonthCount, currentMonthCount };
};


// Aggregation pipeline to group users by the month of 'createdAt'
const getMonthlyUserData = async (timezone) => {
  try {
    const currentDate = moment().tz(timezone); // This will be in the default timezone ('Asia/Kathmandu')
    const startDate = currentDate.clone().subtract(12, 'months').startOf('month');
  
    // Query for records from the last 12 months
    const users = await User.aggregate([
      {
        $match: {
          is_deleted:false,
          createdAt: {
            $gte: startDate.toDate(),
            $lte: currentDate.toDate(),
          },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { '_id.year': -1, '_id.month': -1 },
      },
    ]);
  
    const labels = [];
    const data = [];
  
    users.forEach((item) => {
      const monthName = moment()
        .month(item._id.month - 1)
        .format('MMMM');
      const label = `${monthName} ${item._id.year}`;
      labels.push(label);
      data.push(item.count);
    });
  
    const result = {
      labels: labels,
      datasets: [
        {
          label: 'Monthly User Registrations',
          backgroundColor: 'rgba(65,195,195,0.6)',
          data: data,
        },
      ],
    };

    return result;
  } catch (error) {
    console.error('Error fetching monthly data:', error);
  }
};

const getMonthlyDriverData = async (timezone) => {
  try {
    const currentDate = moment().tz(timezone); // This will be in the default timezone ('Asia/Kathmandu')
    const startDate = currentDate.clone().subtract(12, 'months').startOf('month');
  
    // Query for records from the last 12 months
    const drivers = await Driver.aggregate([
      {
        $match: {
          is_deleted:false,
          createdAt: {
            $gte: startDate.toDate(),
            $lte: currentDate.toDate(),
          },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { '_id.year': -1, '_id.month': -1 },
      },
    ]);
  
    const labels = [];
    const data = [];
  
    drivers.forEach((item) => {
      const monthName = moment()
        .month(item._id.month - 1)
        .format('MMMM');
      const label = `${monthName} ${item._id.year}`;
      labels.push(label);
      data.push(item.count);
    });
  
    const result = {
      labels: labels,
      datasets: [
        {
          label: 'Monthly Driver Registrations',
          backgroundColor: 'rgba(55, 230, 139, 0.8)',
          data: data,
        },
      ],
    };

    return result;
  } catch (error) {
    console.error('Error fetching monthly data:', error);
  }
};

const getMonthlyVendorData = async (roleId,timezone) => {
  try {
    const currentDate = moment().tz(timezone); // This will be in the default timezone ('Asia/Kathmandu')
    const startDate = currentDate.clone().subtract(12, 'months').startOf('month');
  
    // Query for records from the last 12 months
    const vendors = await Admin.aggregate([
      {
        $match: {
          roleId,
          is_active:true,
          createdAt: {
            $gte: startDate.toDate(),
            $lte: currentDate.toDate(),
          },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { '_id.year': -1, '_id.month': -1 },
      },
    ]);
  
    const labels = [];
    const data = [];
  
    vendors.forEach((item) => {
      const monthName = moment()
        .month(item._id.month - 1)
        .format('MMMM');
      const label = `${monthName} ${item._id.year}`;
      labels.push(label);
      data.push(item.count);
    });
  
    const result = {
      labels: labels,
      datasets: [
        {
          label: 'Monthly Vendor Registrations',
          backgroundColor: 'rgba(65,195,195,0.6)',
          data: data,
        },
      ],
    };

    return result;
  } catch (error) {
    console.error('Error fetching monthly data:', error);
  }
};


const getMonthlyBookingData = async (travel_status,timezone) => {
  try {
    const currentDate = moment().tz(timezone); // This will be in the default timezone ('Asia/Kathmandu')
    const startDate = currentDate.clone().subtract(12, 'months').startOf('month');
  
    // Query for records from the last 12 months
    const vendors = await Booking.aggregate([
      {
        $match: {
          travel_status,
          createdAt: {
            $gte: startDate.toDate(),
            $lte: currentDate.toDate(),
          },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { '_id.year': -1, '_id.month': -1 },
      },
    ]);
  
    const labels = [];
    const data = [];
  
    vendors.forEach((item) => {
      const monthName = moment()
        .month(item._id.month - 1)
        .format('MMMM');
      const label = `${monthName} ${item._id.year}`;
      labels.push(label);
      data.push(item.count);
    });
  
    const result = {
      labels: labels,
      datasets: [
        {
          label: 'Monthly Vendor Registrations',
          backgroundColor: 'rgba(65,195,195,0.6)',
          data: data,
        },
      ],
    };

    return result;
  } catch (error) {
    console.error('Error fetching monthly data:', error);
  }
};


const getBookingLineData = async (desiredStatuses,timezone = 'Asia/Kolkata') => {
  const currentDate = moment().tz(timezone); // Current date in the specific timezone
  const startDate = currentDate.clone().subtract(12, 'months').startOf('month'); // Start date 12 months ago in the same timezone

  // Define the statuses you want to filter for (e.g., only "Scheduled" and "Completed")
  // /const desiredStatuses = ['Scheduled', 'Completed'];

  // Query for records from the last 12 months, grouped by status and month, filtering by desired statuses
  const bookings = await Booking.aggregate([
    {
      $match: {
        createdAt: { 
          $gte: startDate.toDate(), // Convert to JavaScript Date for MongoDB query
          $lte: currentDate.toDate() // End date as the current date in the same timezone
        },
        travel_status: { $in: desiredStatuses } // Filter by specific statuses
      }
    },
    // Group by year, month, and status
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          travel_status: '$travel_status'
        },
        count: { $sum: 1 } // Count the number of bookings for each status per month
      }
    },
    // Sort by year and month
    {
      $sort: { '_id.year': -1, '_id.month': -1 }
    }
  ]);

  // Generate labels for the last 12 months in "Month Year" format
  const labels = [];
  for (let i = 0; i < 12; i++) {
    labels.push(currentDate.clone().subtract(i, 'months').format('MMMM YYYY'));
  }

  const statusData = {
    Scheduled: new Array(12).fill(0),
    Completed: new Array(12).fill(0),
    Cancelled: new Array(12).fill(0),
    Expired: new Array(12).fill(0),
  };

  // Populate the data arrays for each status
  bookings.forEach((item) => {
    const bookingDate = moment().year(item._id.year).month(item._id.month - 1);
    const monthIndex = currentDate.diff(bookingDate, 'months'); // Get index based on current date
    const status = item._id.travel_status.charAt(0).toUpperCase() + item._id.travel_status.slice(1).toLowerCase();
    
    if (statusData[status] && monthIndex < 12) {
      statusData[status][monthIndex] = item.count;
    }
  });

  // Format the result to match your desired chart structure
  const result = {
    labels: labels,
    datasets: [
      {
        label: 'Scheduled',
        backgroundColor: '#5bf8bf',
        data: statusData.Scheduled,
      },
      {
        label: 'Completed',
        backgroundColor: '#FC2525',
        data: statusData.Completed,
      },
      {
        label: 'Cancelled',
        backgroundColor: '#9BD0F5',
        data: statusData.Cancelled,
      },
      {
        label: 'Expired',
        backgroundColor: '#DD1B16',
        data: statusData.Expired,
      }
    ]
  };

  return result;
}

module.exports = {
  getBookingLineData,
  getMonthlyBookingData,
  getMonthlyVendorData,
  getMonthlyUserData,
  getMonthlyDriverData,
  fetchDriverCount,
  fetchUserCount,
  calculateChange,
  paymentChart,
  bookingChart,
};