const EmailTemplate = require("../models/emailTemplate.model");

/**
 * Email Template Seeders with Recipient Types
 * Note: Only content is stored. Base HTML structure is in templates/email-base.html
 */
const emailTemplates = [
  // CUSTOMER TEMPLATES
  {
    name: "Customer - Booking Confirmation",
    slug: "customer-booking-confirmation",
    recipient_type: "customer",
    subject: "Booking Confirmed - {{pnr_no}}",
    body: `
      <h2>Booking Confirmed!</h2>
      <p>Dear {{customer_name}},</p>
      <p>Your bus booking has been confirmed successfully.</p>
      
      <div class="details-box">
        <h3>Booking Details:</h3>
        <p><strong>PNR Number:</strong> {{pnr_no}}</p>
        <p><strong>Bus:</strong> {{bus_name}}</p>
        <p><strong>Date:</strong> {{booking_date}}</p>
        <p><strong>Departure Time:</strong> {{departure_time}}</p>
        <p><strong>From:</strong> {{pickup_location}}</p>
        <p><strong>To:</strong> {{dropoff_location}}</p>
        <p><strong>Seat Numbers:</strong> {{seat_numbers}}</p>
        <p><strong>Total Fare:</strong> {{total_fare}}</p>
      </div>
      
      <p>Please arrive at the pickup location at least 15 minutes before departure.</p>
      <a href="{{booking_url}}" class="button">View Booking Details</a>
    `,
    event_type: "booking_confirmation",
    variables: [
      "customer_name",
      "pnr_no",
      "bus_name",
      "booking_date",
      "departure_time",
      "pickup_location",
      "dropoff_location",
      "seat_numbers",
      "total_fare",
      "booking_url",
    ],
    is_active: true,
    description: "Email sent to customers when booking is confirmed",
  },
  {
    name: "Customer - Welcome Email",
    slug: "customer-welcome",
    recipient_type: "customer",
    subject: "Welcome to {{app_name}}!",
    body: `
      <h2>Welcome to {{app_name}}!</h2>
      <p>Dear {{customer_name}},</p>
      <p>Thank you for joining {{app_name}}! We're excited to have you on board.</p>
      
      <div class="success-box">
        <h3>Get Started:</h3>
        <ul>
          <li>Browse available bus routes</li>
          <li>Book tickets easily</li>
          <li>Track your bookings</li>
          <li>Manage your profile</li>
        </ul>
      </div>
      
      <a href="{{app_url}}" class="button">Start Booking Now</a>
      
      <p>If you have any questions, our support team is here to help!</p>
    `,
    event_type: "welcome",
    variables: ["customer_name", "app_name", "app_url"],
    is_active: true,
    description: "Welcome email sent to new customers",
  },
  {
    name: "Customer - Booking Cancellation",
    slug: "customer-booking-cancellation",
    recipient_type: "customer",
    subject: "Booking Cancelled - {{pnr_no}}",
    body: `
      <h2>Booking Cancelled</h2>
      <p>Dear {{customer_name}},</p>
      <p>Your booking has been cancelled as requested.</p>
      
      <div class="details-box">
        <h3>Cancelled Booking Details:</h3>
        <p><strong>PNR Number:</strong> {{pnr_no}}</p>
        <p><strong>Bus:</strong> {{bus_name}}</p>
        <p><strong>Date:</strong> {{booking_date}}</p>
        <p><strong>Refund Amount:</strong> {{refund_amount}}</p>
        <p><strong>Refund Status:</strong> {{refund_status}}</p>
      </div>
      
      <p>The refund will be processed within 5-7 business days.</p>
      <p>We hope to serve you again soon!</p>
    `,
    event_type: "booking_cancellation",
    variables: [
      "customer_name",
      "pnr_no",
      "bus_name",
      "booking_date",
      "refund_amount",
      "refund_status",
    ],
    is_active: true,
    description: "Email sent to customers when booking is cancelled",
  },
  {
    name: "Customer - Payment Success",
    slug: "customer-payment-success",
    recipient_type: "customer",
    subject: "Payment Successful - {{pnr_no}}",
    body: `
      <h2>Payment Successful!</h2>
      <p>Dear {{customer_name}},</p>
      <p>Your payment has been processed successfully.</p>
      
      <div class="success-box">
        <h3>Payment Details:</h3>
        <p><strong>Transaction ID:</strong> {{transaction_id}}</p>
        <p><strong>Amount Paid:</strong> {{amount_paid}}</p>
        <p><strong>Payment Method:</strong> {{payment_method}}</p>
        <p><strong>Date:</strong> {{payment_date}}</p>
      </div>
      
      <div class="details-box">
        <h3>Booking Details:</h3>
        <p><strong>PNR Number:</strong> {{pnr_no}}</p>
        <p><strong>Bus:</strong> {{bus_name}}</p>
        <p><strong>Travel Date:</strong> {{travel_date}}</p>
      </div>
      
      <a href="{{receipt_url}}" class="button">Download Receipt</a>
    `,
    event_type: "payment_success",
    variables: [
      "customer_name",
      "transaction_id",
      "amount_paid",
      "payment_method",
      "payment_date",
      "pnr_no",
      "bus_name",
      "travel_date",
      "receipt_url",
    ],
    is_active: true,
    description: "Email sent to customers when payment is successful",
  },
  {
    name: "Customer - Password Reset",
    slug: "customer-password-reset",
    recipient_type: "customer",
    subject: "Reset Your Password",
    body: `
      <h2>Password Reset Request</h2>
      <p>Dear {{customer_name}},</p>
      <p>We received a request to reset your password. Click the button below to create a new password:</p>
      
      <a href="{{reset_url}}" class="button">Reset Password</a>
      
      <div class="alert-box">
        <p><strong>Important:</strong> This link will expire in {{expiry_hours}} hours.</p>
        <p>If you didn't request this, please ignore this email or contact support if you have concerns.</p>
      </div>
      
      <p>For security reasons, never share your password with anyone.</p>
    `,
    event_type: "password_reset",
    variables: ["customer_name", "reset_url", "expiry_hours"],
    is_active: true,
    description: "Email sent to customers for password reset",
  },
  {
    name: "Customer - OTP Verification",
    slug: "customer-otp-verification",
    recipient_type: "customer",
    subject: "Your OTP Code - {{app_name}}",
    body: `
      <h2>Verify Your Account</h2>
      <p>Dear {{customer_name}},</p>
      <p>Your One-Time Password (OTP) for verification is:</p>
      
      <div class="success-box" style="text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px;">
        {{otp_code}}
      </div>
      
      <div class="alert-box">
        <p><strong>Important:</strong> This OTP will expire in {{expiry_minutes}} minutes.</p>
        <p>Do not share this code with anyone.</p>
      </div>
    `,
    event_type: "otp_verification",
    variables: ["customer_name", "otp_code", "expiry_minutes"],
    is_active: true,
    description: "Email sent to customers with OTP code",
  },

  // DRIVER TEMPLATES
  {
    name: "Driver - Trip Assigned",
    slug: "driver-trip-assigned",
    recipient_type: "driver",
    subject: "New Trip Assigned - {{route_name}}",
    body: `
      <h2>New Trip Assigned</h2>
      <p>Dear {{driver_name}},</p>
      <p>A new trip has been assigned to you.</p>
      
      <div class="details-box">
        <h3>Trip Details:</h3>
        <p><strong>Route:</strong> {{route_name}}</p>
        <p><strong>Bus:</strong> {{bus_name}}</p>
        <p><strong>Date:</strong> {{trip_date}}</p>
        <p><strong>Departure Time:</strong> {{departure_time}}</p>
        <p><strong>Passengers:</strong> {{passenger_count}}</p>
        <p><strong>From:</strong> {{start_location}}</p>
        <p><strong>To:</strong> {{end_location}}</p>
      </div>
      
      <div class="alert-box">
        <p><strong>Important:</strong> Please ensure the bus is ready 30 minutes before departure.</p>
      </div>
    `,
    event_type: "trip_assigned",
    variables: [
      "driver_name",
      "route_name",
      "bus_name",
      "trip_date",
      "departure_time",
      "passenger_count",
      "start_location",
      "end_location",
    ],
    is_active: true,
    description: "Email sent to drivers when a trip is assigned",
  },
  {
    name: "Driver - Welcome Email",
    slug: "driver-welcome",
    recipient_type: "driver",
    subject: "Welcome to the Team - {{app_name}}",
    body: `
      <h2>Welcome to the Team!</h2>
      <p>Dear {{driver_name}},</p>
      <p>Welcome to {{app_name}}! We're excited to have you as part of our driver team.</p>
      
      <div class="details-box">
        <h3>Your Responsibilities:</h3>
        <ul>
          <li>Check assigned trips daily</li>
          <li>Maintain vehicle cleanliness</li>
          <li>Ensure passenger safety</li>
          <li>Update trip status in real-time</li>
          <li>Report any issues immediately</li>
        </ul>
      </div>
      
      <p>Your login credentials have been sent separately. Please change your password upon first login.</p>
    `,
    event_type: "welcome",
    variables: ["driver_name", "app_name"],
    is_active: true,
    description: "Welcome email sent to new drivers",
  },
  {
    name: "Driver - Trip Started",
    slug: "driver-trip-started",
    recipient_type: "driver",
    subject: "Trip Started - {{route_name}}",
    body: `
      <h2>Trip Started Confirmation</h2>
      <p>Dear {{driver_name}},</p>
      <p>Your trip has been marked as started.</p>
      
      <div class="success-box">
        <h3>Active Trip:</h3>
        <p><strong>Route:</strong> {{route_name}}</p>
        <p><strong>Started At:</strong> {{start_time}}</p>
        <p><strong>Expected Arrival:</strong> {{expected_arrival}}</p>
        <p><strong>Passengers Onboard:</strong> {{passenger_count}}</p>
      </div>
      
      <p>Safe travels! Please update the trip status upon completion.</p>
    `,
    event_type: "trip_started",
    variables: [
      "driver_name",
      "route_name",
      "start_time",
      "expected_arrival",
      "passenger_count",
    ],
    is_active: true,
    description: "Email sent to drivers when trip is started",
  },
  {
    name: "Driver - Trip Completed",
    slug: "driver-trip-completed",
    recipient_type: "driver",
    subject: "Trip Completed - {{route_name}}",
    body: `
      <h2>Trip Completed Successfully</h2>
      <p>Dear {{driver_name}},</p>
      <p>Thank you for completing your trip successfully!</p>
      
      <div class="details-box">
        <h3>Trip Summary:</h3>
        <p><strong>Route:</strong> {{route_name}}</p>
        <p><strong>Started At:</strong> {{start_time}}</p>
        <p><strong>Completed At:</strong> {{end_time}}</p>
        <p><strong>Duration:</strong> {{duration}}</p>
        <p><strong>Passengers:</strong> {{passenger_count}}</p>
      </div>
      
      <p>Great job! Check your dashboard for your next assignment.</p>
    `,
    event_type: "trip_completed",
    variables: [
      "driver_name",
      "route_name",
      "start_time",
      "end_time",
      "duration",
      "passenger_count",
    ],
    is_active: true,
    description: "Email sent to drivers when trip is completed",
  },

  // OPERATOR TEMPLATES
  {
    name: "Operator - New Booking Alert",
    slug: "operator-new-booking",
    recipient_type: "operator",
    subject: "New Booking Received - {{pnr_no}}",
    body: `
      <h2>New Booking Received</h2>
      <p>Dear {{operator_name}},</p>
      <p>A new booking has been received for your route.</p>
      
      <div class="details-box">
        <h3>Booking Details:</h3>
        <p><strong>PNR:</strong> {{pnr_no}}</p>
        <p><strong>Customer:</strong> {{customer_name}}</p>
        <p><strong>Route:</strong> {{route_name}}</p>
        <p><strong>Date:</strong> {{booking_date}}</p>
        <p><strong>Seats:</strong> {{seat_count}}</p>
        <p><strong>Amount:</strong> {{total_amount}}</p>
      </div>
      
      <p>Please ensure the bus is prepared for this booking.</p>
      <a href="{{dashboard_url}}" class="button">View in Dashboard</a>
    `,
    event_type: "booking_confirmation",
    variables: [
      "operator_name",
      "pnr_no",
      "customer_name",
      "route_name",
      "booking_date",
      "seat_count",
      "total_amount",
      "dashboard_url",
    ],
    is_active: true,
    description: "Email sent to operators when new booking is received",
  },
  {
    name: "Operator - Welcome Email",
    slug: "operator-welcome",
    recipient_type: "operator",
    subject: "Welcome as Operator - {{app_name}}",
    body: `
      <h2>Welcome as an Operator!</h2>
      <p>Dear {{operator_name}},</p>
      <p>Welcome to {{app_name}}! You have been registered as a bus operator.</p>
      
      <div class="details-box">
        <h3>Your Access:</h3>
        <ul>
          <li>Manage your bus fleet</li>
          <li>View and manage bookings</li>
          <li>Assign drivers to trips</li>
          <li>Track revenue and reports</li>
          <li>Update route schedules</li>
        </ul>
      </div>
      
      <a href="{{dashboard_url}}" class="button">Access Dashboard</a>
      
      <p>Your login credentials have been sent separately.</p>
    `,
    event_type: "welcome",
    variables: ["operator_name", "app_name", "dashboard_url"],
    is_active: true,
    description: "Welcome email sent to new operators",
  },

  // ADMIN TEMPLATES
  {
    name: "Admin - System Alert",
    slug: "admin-system-alert",
    recipient_type: "admin",
    subject: "System Alert - {{alert_type}}",
    body: `
      <h2>System Alert</h2>
      <p>Dear Admin,</p>
      
      <div class="alert-box">
        <h3>{{alert_type}}</h3>
        <p><strong>Time:</strong> {{alert_time}}</p>
        <p><strong>Details:</strong> {{alert_details}}</p>
        <p><strong>Severity:</strong> {{severity}}</p>
      </div>
      
      <p>Please take necessary action immediately.</p>
      <a href="{{admin_url}}" class="button">Go to Admin Panel</a>
    `,
    event_type: "custom",
    variables: [
      "alert_type",
      "alert_time",
      "alert_details",
      "severity",
      "admin_url",
    ],
    is_active: true,
    description: "System alert email sent to administrators",
  },
  {
    name: "Admin - Daily Report",
    slug: "admin-daily-report",
    recipient_type: "admin",
    subject: "Daily Report - {{report_date}}",
    body: `
      <h2>Daily Report</h2>
      <p style="text-align: center; font-size: 18px; color: #666;">{{report_date}}</p>
      <p>Dear Admin,</p>
      <p>Here's your daily summary:</p>
      
      <div class="details-box">
        <h3>Today's Statistics:</h3>
        <p><strong>Total Bookings:</strong> {{total_bookings}}</p>
        <p><strong>Revenue:</strong> {{total_revenue}}</p>
        <p><strong>Trips Completed:</strong> {{trips_completed}}</p>
        <p><strong>Active Users:</strong> {{active_users}}</p>
        <p><strong>New Registrations:</strong> {{new_registrations}}</p>
        <p><strong>Cancellations:</strong> {{cancellations}}</p>
      </div>
      
      <a href="{{report_url}}" class="button">View Detailed Report</a>
    `,
    event_type: "custom",
    variables: [
      "report_date",
      "total_bookings",
      "total_revenue",
      "trips_completed",
      "active_users",
      "new_registrations",
      "cancellations",
      "report_url",
    ],
    is_active: true,
    description: "Daily report email sent to administrators",
  },
];

/**
 * Seed email templates
 */
const seedEmailTemplates = async () => {
  try {
       await EmailTemplate.deleteMany({});
    console.log("Seeding email templates...");
 
    for (const templateData of emailTemplates) {
      const existingTemplate = await EmailTemplate.findOne({
        slug: templateData.slug,
      });

      if (existingTemplate) {
        console.log(
          `Template "${templateData.name}" already exists, updating...`
        );
        await EmailTemplate.findByIdAndUpdate(
          existingTemplate._id,
          templateData
        );
      } else {
        console.log(`Creating template "${templateData.name}"...`);
        await EmailTemplate.create(templateData);
      }
    }

    console.log("Email templates seeded successfully!");
    return { success: true, count: emailTemplates.length };
  } catch (error) {
    console.error("Error seeding email templates:", error);
    throw error;
  }
};

module.exports = {
  emailTemplates,
  seedEmailTemplates,
};
