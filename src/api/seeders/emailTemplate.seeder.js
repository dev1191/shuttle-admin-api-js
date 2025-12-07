const EmailTemplate = require("../models/emailTemplate.model");

/**
 * Email Template Seeders with Recipient Types
 */
const emailTemplates = [
  // CUSTOMER TEMPLATES
  {
    name: "Customer - Booking Confirmation",
    slug: "customer-booking-confirmation",
    recipient_type: "customer",
    subject: "Booking Confirmed - {{pnr_no}}",
    body: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .details { background-color: white; padding: 15px; margin: 10px 0; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          .button { background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Booking Confirmed!</h1>
          </div>
          <div class="content">
            <p>Dear {{customer_name}},</p>
            <p>Your bus booking has been confirmed successfully.</p>
            
            <div class="details">
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
          </div>
          <div class="footer">
            <p>Thank you for choosing our service!</p>
            <p>For support, contact us at {{support_email}}</p>
          </div>
        </div>
      </body>
      </html>
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
      "support_email",
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
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #673AB7; color: white; padding: 30px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .button { background-color: #673AB7; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
          .features { background-color: white; padding: 15px; margin: 10px 0; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to {{app_name}}!</h1>
          </div>
          <div class="content">
            <p>Dear {{customer_name}},</p>
            <p>Thank you for joining {{app_name}}! We're excited to have you on board.</p>
            
            <div class="features">
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
          </div>
          <div class="footer">
            <p>Happy travels!</p>
            <p>For support, contact us at {{support_email}}</p>
          </div>
        </div>
      </body>
      </html>
    `,
    event_type: "welcome",
    variables: ["customer_name", "app_name", "app_url", "support_email"],
    is_active: true,
    description: "Welcome email sent to new customers",
  },

  // DRIVER TEMPLATES
  {
    name: "Driver - Trip Assigned",
    slug: "driver-trip-assigned",
    recipient_type: "driver",
    subject: "New Trip Assigned - {{route_name}}",
    body: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .details { background-color: white; padding: 15px; margin: 10px 0; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Trip Assigned</h1>
          </div>
          <div class="content">
            <p>Dear {{driver_name}},</p>
            <p>A new trip has been assigned to you.</p>
            
            <div class="details">
              <h3>Trip Details:</h3>
              <p><strong>Route:</strong> {{route_name}}</p>
              <p><strong>Bus:</strong> {{bus_name}}</p>
              <p><strong>Date:</strong> {{trip_date}}</p>
              <p><strong>Departure Time:</strong> {{departure_time}}</p>
              <p><strong>Passengers:</strong> {{passenger_count}}</p>
              <p><strong>From:</strong> {{start_location}}</p>
              <p><strong>To:</strong> {{end_location}}</p>
            </div>
            
            <p>Please ensure the bus is ready 30 minutes before departure.</p>
          </div>
          <div class="footer">
            <p>For support, contact dispatch at {{dispatch_phone}}</p>
          </div>
        </div>
      </body>
      </html>
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
      "dispatch_phone",
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
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #FF5722; color: white; padding: 30px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .features { background-color: white; padding: 15px; margin: 10px 0; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to the Team!</h1>
          </div>
          <div class="content">
            <p>Dear {{driver_name}},</p>
            <p>Welcome to {{app_name}}! We're excited to have you as part of our driver team.</p>
            
            <div class="features">
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
          </div>
          <div class="footer">
            <p>For support, contact us at {{support_email}}</p>
          </div>
        </div>
      </body>
      </html>
    `,
    event_type: "welcome",
    variables: ["driver_name", "app_name", "support_email"],
    is_active: true,
    description: "Welcome email sent to new drivers",
  },

  // OPERATOR TEMPLATES
  {
    name: "Operator - New Booking Alert",
    slug: "operator-new-booking",
    recipient_type: "operator",
    subject: "New Booking Received - {{pnr_no}}",
    body: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #009688; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .details { background-color: white; padding: 15px; margin: 10px 0; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Booking Received</h1>
          </div>
          <div class="content">
            <p>Dear {{operator_name}},</p>
            <p>A new booking has been received for your route.</p>
            
            <div class="details">
              <h3>Booking Details:</h3>
              <p><strong>PNR:</strong> {{pnr_no}}</p>
              <p><strong>Customer:</strong> {{customer_name}}</p>
              <p><strong>Route:</strong> {{route_name}}</p>
              <p><strong>Date:</strong> {{booking_date}}</p>
              <p><strong>Seats:</strong> {{seat_count}}</p>
              <p><strong>Amount:</strong> {{total_amount}}</p>
            </div>
            
            <p>Please ensure the bus is prepared for this booking.</p>
          </div>
          <div class="footer">
            <p>Login to dashboard for more details</p>
          </div>
        </div>
      </body>
      </html>
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
    ],
    is_active: true,
    description: "Email sent to operators when new booking is received",
  },

  // ADMIN TEMPLATES
  {
    name: "Admin - System Alert",
    slug: "admin-system-alert",
    recipient_type: "admin",
    subject: "System Alert - {{alert_type}}",
    body: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #F44336; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .alert { background-color: #fff3cd; padding: 15px; margin: 10px 0; border-left: 4px solid #ffc107; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>System Alert</h1>
          </div>
          <div class="content">
            <p>Dear Admin,</p>
            
            <div class="alert">
              <h3>{{alert_type}}</h3>
              <p><strong>Time:</strong> {{alert_time}}</p>
              <p><strong>Details:</strong> {{alert_details}}</p>
              <p><strong>Severity:</strong> {{severity}}</p>
            </div>
            
            <p>Please take necessary action immediately.</p>
          </div>
          <div class="footer">
            <p>Automated system notification</p>
          </div>
        </div>
      </body>
      </html>
    `,
    event_type: "custom",
    variables: ["alert_type", "alert_time", "alert_details", "severity"],
    is_active: true,
    description: "System alert email sent to administrators",
  },
  {
    name: "Admin - Daily Report",
    slug: "admin-daily-report",
    recipient_type: "admin",
    subject: "Daily Report - {{report_date}}",
    body: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #3F51B5; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .stats { background-color: white; padding: 15px; margin: 10px 0; border-radius: 5px; }
          .stat-item { display: inline-block; width: 45%; margin: 5px; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Daily Report</h1>
            <p>{{report_date}}</p>
          </div>
          <div class="content">
            <p>Dear Admin,</p>
            <p>Here's your daily summary:</p>
            
            <div class="stats">
              <h3>Today's Statistics:</h3>
              <div class="stat-item"><strong>Total Bookings:</strong> {{total_bookings}}</div>
              <div class="stat-item"><strong>Revenue:</strong> {{total_revenue}}</div>
              <div class="stat-item"><strong>Trips Completed:</strong> {{trips_completed}}</div>
              <div class="stat-item"><strong>Active Users:</strong> {{active_users}}</div>
            </div>
          </div>
          <div class="footer">
            <p>Automated daily report</p>
          </div>
        </div>
      </body>
      </html>
    `,
    event_type: "custom",
    variables: [
      "report_date",
      "total_bookings",
      "total_revenue",
      "trips_completed",
      "active_users",
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
