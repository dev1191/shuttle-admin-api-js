/**
 * Email Service Usage Examples
 *
 * This file demonstrates how to use the email service to send emails
 * using templates stored in the database with the base HTML wrapper.
 */

const emailService = require("../services/emailService");
const nodemailer = require("nodemailer");

// Configure your email transporter (example with Gmail)
const transporter = nodemailer.createTransporter({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

/**
 * Example 1: Send booking confirmation email to customer
 */
async function sendBookingConfirmation(booking) {
  try {
    // Render the email template
    const emailData = await emailService.renderEmail(
      "customer-booking-confirmation",
      {
        customer_name: booking.customer.name,
        pnr_no: booking.pnr,
        bus_name: booking.bus.name,
        booking_date: booking.date,
        departure_time: booking.departureTime,
        pickup_location: booking.pickup,
        dropoff_location: booking.dropoff,
        seat_numbers: booking.seats.join(", "),
        total_fare: `$${booking.totalFare}`,
        booking_url: `${process.env.APP_URL}/bookings/${booking.id}`,
      }
    );

    // Send email
    await transporter.sendMail({
      from: `"${process.env.APP_NAME}" <${process.env.EMAIL_FROM}>`,
      to: booking.customer.email,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text,
    });

    console.log(`Booking confirmation sent to ${booking.customer.email}`);
  } catch (error) {
    console.error("Error sending booking confirmation:", error);
    throw error;
  }
}

/**
 * Example 2: Send trip assignment email to driver
 */
async function sendTripAssignment(trip, driver) {
  try {
    const emailData = await emailService.renderEmail("driver-trip-assigned", {
      driver_name: driver.name,
      route_name: trip.route.name,
      bus_name: trip.bus.name,
      trip_date: trip.date,
      departure_time: trip.departureTime,
      passenger_count: trip.passengers.length,
      start_location: trip.route.startLocation,
      end_location: trip.route.endLocation,
    });

    await transporter.sendMail({
      from: `"${process.env.APP_NAME}" <${process.env.EMAIL_FROM}>`,
      to: driver.email,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text,
    });

    console.log(`Trip assignment sent to ${driver.email}`);
  } catch (error) {
    console.error("Error sending trip assignment:", error);
    throw error;
  }
}

/**
 * Example 3: Send welcome email to new customer
 */
async function sendWelcomeEmail(customer) {
  try {
    const emailData = await emailService.renderEmail("customer-welcome", {
      customer_name: customer.name,
      app_name: process.env.APP_NAME,
      app_url: process.env.APP_URL,
    });

    await transporter.sendMail({
      from: `"${process.env.APP_NAME}" <${process.env.EMAIL_FROM}>`,
      to: customer.email,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text,
    });

    console.log(`Welcome email sent to ${customer.email}`);
  } catch (error) {
    console.error("Error sending welcome email:", error);
    throw error;
  }
}

/**
 * Example 4: Send OTP verification email
 */
async function sendOTPEmail(customer, otpCode) {
  try {
    const emailData = await emailService.renderEmail(
      "customer-otp-verification",
      {
        customer_name: customer.name,
        otp_code: otpCode,
        expiry_minutes: "10",
      }
    );

    await transporter.sendMail({
      from: `"${process.env.APP_NAME}" <${process.env.EMAIL_FROM}>`,
      to: customer.email,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text,
    });

    console.log(`OTP email sent to ${customer.email}`);
  } catch (error) {
    console.error("Error sending OTP email:", error);
    throw error;
  }
}

/**
 * Example 5: Send email by event type and recipient type
 */
async function sendEmailByEvent(
  eventType,
  recipientType,
  recipientEmail,
  variables
) {
  try {
    const emailData = await emailService.renderEmailByEvent(
      eventType,
      recipientType,
      variables
    );

    await transporter.sendMail({
      from: `"${process.env.APP_NAME}" <${process.env.EMAIL_FROM}>`,
      to: recipientEmail,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text,
    });

    console.log(`Email sent to ${recipientEmail}`);
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}

/**
 * Example 6: Send password reset email
 */
async function sendPasswordResetEmail(customer, resetToken) {
  try {
    const resetUrl = `${process.env.APP_URL}/reset-password?token=${resetToken}`;

    const emailData = await emailService.renderEmail(
      "customer-password-reset",
      {
        customer_name: customer.name,
        reset_url: resetUrl,
        expiry_hours: "24",
      }
    );

    await transporter.sendMail({
      from: `"${process.env.APP_NAME}" <${process.env.EMAIL_FROM}>`,
      to: customer.email,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text,
    });

    console.log(`Password reset email sent to ${customer.email}`);
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw error;
  }
}

/**
 * Example 7: Send admin daily report
 */
async function sendDailyReport(admin, reportData) {
  try {
    const emailData = await emailService.renderEmail("admin-daily-report", {
      report_date: new Date().toLocaleDateString(),
      total_bookings: reportData.totalBookings,
      total_revenue: `$${reportData.totalRevenue}`,
      trips_completed: reportData.tripsCompleted,
      active_users: reportData.activeUsers,
      new_registrations: reportData.newRegistrations,
      cancellations: reportData.cancellations,
      report_url: `${process.env.APP_URL}/admin/reports/daily`,
    });

    await transporter.sendMail({
      from: `"${process.env.APP_NAME}" <${process.env.EMAIL_FROM}>`,
      to: admin.email,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text,
    });

    console.log(`Daily report sent to ${admin.email}`);
  } catch (error) {
    console.error("Error sending daily report:", error);
    throw error;
  }
}

module.exports = {
  sendBookingConfirmation,
  sendTripAssignment,
  sendWelcomeEmail,
  sendOTPEmail,
  sendEmailByEvent,
  sendPasswordResetEmail,
  sendDailyReport,
};
