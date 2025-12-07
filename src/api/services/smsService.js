const axios = require("axios");
const SmsNotification = require("../models/smsNotification.model");
const SmsLog = require("../models/smsLog.model");

/**
 * SMS Service for MSG91 Integration
 */
class SmsService {
  /**
   * Send SMS using MSG91
   */
  static async sendSms(data) {
    try {
      const {
        phone,
        country_code = "91",
        message,
        event_type,
        userId,
        driverId,
        bookingId,
        metadata,
      } = data;

      // Get SMS configuration
      const config = await SmsNotification.getConfig();

      if (!config.is_enabled) {
        console.log("SMS service is disabled");
        return { success: false, message: "SMS service is disabled" };
      }

      // Create SMS log entry
      const smsLog = await SmsLog.logSms({
        userId,
        driverId,
        bookingId,
        phone,
        country_code,
        message,
        event_type: event_type || "custom",
        provider: "msg91",
        status: "pending",
        metadata: metadata || {},
      });

      // Send via MSG91
      const result = await this.sendViaMSG91(
        config,
        phone,
        country_code,
        message,
        smsLog._id
      );

      // Update statistics
      await SmsNotification.updateStats(result.success);

      return result;
    } catch (error) {
      console.error("SMS Service Error:", error);
      return { success: false, message: error.message, error };
    }
  }

  /**
   * Send SMS with template
   */
  static async sendTemplatedSms(data) {
    try {
      const {
        phone,
        country_code = "91",
        event_type,
        variables,
        userId,
        driverId,
        bookingId,
        metadata,
      } = data;

      // Get template
      const template = await SmsNotification.getTemplateByEvent(event_type);
      if (!template) {
        throw new Error(`Template not found for event: ${event_type}`);
      }

      // Send via MSG91 with template
      return await this.sendViaMSG91WithTemplate(
        phone,
        country_code,
        template.template_id,
        variables,
        event_type,
        userId,
        driverId,
        bookingId,
        metadata
      );
    } catch (error) {
      console.error("Templated SMS Error:", error);
      return { success: false, message: error.message, error };
    }
  }

  /**
   * Send SMS via MSG91
   */
  static async sendViaMSG91(config, phone, country_code, message, smsLogId) {
    try {
      if (!config.auth_key) {
        throw new Error("MSG91 auth_key is not configured");
      }

      const fullPhone = `${country_code}${phone}`;
      const baseUrl = "https://api.msg91.com/api";

      const payload = {
        sender: config.sender_id || "TXTIND",
        route: "4",
        country: country_code,
        sms: [
          {
            message: message,
            to: [fullPhone],
          },
        ],
      };

      const response = await axios.post(`${baseUrl}/v5/flow/`, payload, {
        headers: {
          authkey: config.auth_key,
          "Content-Type": "application/json",
        },
      });

      // Update SMS log with success
      await SmsLog.updateStatus(smsLogId, "sent", {
        message_id: response.data.message_id || response.data.request_id,
        request_id: response.data.request_id,
        response_code: response.data.type,
        response_message: response.data.message,
        raw_response: response.data,
      });

      return {
        success: true,
        message: "SMS sent successfully",
        data: response.data,
        smsLogId,
      };
    } catch (error) {
      console.error("MSG91 Error:", error.response?.data || error.message);

      // Update SMS log with error
      await SmsLog.updateError(smsLogId, {
        code: error.response?.data?.type || "UNKNOWN_ERROR",
        message: error.response?.data?.message || error.message,
        details: error.response?.data || {},
      });

      return {
        success: false,
        message: error.response?.data?.message || error.message,
        error: error.response?.data || error,
        smsLogId,
      };
    }
  }

  /**
   * Send SMS via MSG91 with template
   */
  static async sendViaMSG91WithTemplate(
    phone,
    country_code,
    template_id,
    variables,
    event_type,
    userId,
    driverId,
    bookingId,
    metadata
  ) {
    try {
      const config = await SmsNotification.getConfig();

      if (!config.auth_key) {
        throw new Error("MSG91 auth_key is not configured");
      }

      const fullPhone = `${country_code}${phone}`;
      const baseUrl = "https://api.msg91.com/api";

      // Create SMS log entry
      const smsLog = await SmsLog.logSms({
        userId,
        driverId,
        bookingId,
        phone,
        country_code,
        message: `Template: ${template_id}`,
        template_id,
        event_type,
        provider: "msg91",
        status: "pending",
        metadata: metadata || {},
      });

      const payload = {
        template_id: template_id,
        short_url: "0",
        recipients: [
          {
            mobiles: fullPhone,
            var: variables || {},
          },
        ],
      };

      const response = await axios.post(`${baseUrl}/v5/flow/`, payload, {
        headers: {
          authkey: config.auth_key,
          "Content-Type": "application/json",
        },
      });

      // Update SMS log with success
      await SmsLog.updateStatus(smsLog._id, "sent", {
        message_id: response.data.message_id || response.data.request_id,
        request_id: response.data.request_id,
        response_code: response.data.type,
        response_message: response.data.message,
        raw_response: response.data,
      });

      // Update statistics
      await SmsNotification.updateStats(true);

      return {
        success: true,
        message: "SMS sent successfully",
        data: response.data,
        smsLogId: smsLog._id,
      };
    } catch (error) {
      console.error(
        "MSG91 Template Error:",
        error.response?.data || error.message
      );

      return {
        success: false,
        message: error.response?.data?.message || error.message,
        error: error.response?.data || error,
      };
    }
  }

  /**
   * Send OTP via SMS
   */
  static async sendOTP(phone, country_code = "91", otp, userId = null) {
    try {
      const message = `Your OTP is: ${otp}. Valid for 10 minutes. Do not share with anyone.`;

      return await this.sendSms({
        phone,
        country_code,
        message,
        event_type: "otp_verification",
        userId,
        metadata: { otp_sent: true },
      });
    } catch (error) {
      console.error("OTP SMS Error:", error);
      return { success: false, message: error.message, error };
    }
  }

  /**
   * Send booking confirmation SMS
   */
  static async sendBookingConfirmation(booking, user) {
    try {
      const variables = {
        customer_name: `${user.firstname} ${user.lastname}`,
        pnr_no: booking.pnr_no,
        bus_name: booking.busId?.name || "N/A",
        departure_time: booking.start_time,
        pickup_location: booking.pickupId?.title || "N/A",
        dropoff_location: booking.dropoffId?.title || "N/A",
      };

      return await this.sendTemplatedSms({
        phone: user.phone,
        country_code: user.country_code || "91",
        event_type: "booking_confirmation",
        variables,
        userId: user._id,
        bookingId: booking._id,
      });
    } catch (error) {
      console.error("Booking Confirmation SMS Error:", error);
      return { success: false, message: error.message, error };
    }
  }

  /**
   * Retry failed SMS
   */
  static async retryFailedSms() {
    try {
      const pendingRetries = await SmsLog.getPendingRetries();

      const results = [];
      for (const smsLog of pendingRetries) {
        // Increment retry count
        await SmsLog.incrementRetry(smsLog._id);

        // Retry sending
        const result = await this.sendSms({
          phone: smsLog.phone,
          country_code: smsLog.country_code,
          message: smsLog.message,
          event_type: smsLog.event_type,
          userId: smsLog.userId,
          driverId: smsLog.driverId,
          bookingId: smsLog.bookingId,
          metadata: smsLog.metadata,
        });

        results.push({
          smsLogId: smsLog._id,
          result,
        });
      }

      return {
        success: true,
        retried: results.length,
        results,
      };
    } catch (error) {
      console.error("Retry Failed SMS Error:", error);
      return { success: false, message: error.message, error };
    }
  }
}

module.exports = SmsService;
