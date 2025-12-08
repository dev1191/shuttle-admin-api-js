const fs = require("fs").promises;
const path = require("path");
const EmailTemplate = require("../models/emailTemplate.model");

/**
 * Email Service for rendering email templates
 */
class EmailService {
  constructor() {
    this.baseTemplatePath = path.join(
      __dirname,
      "../templates/email-base.html"
    );
    this.baseTemplate = null;
  }

  /**
   * Load base template from file system
   * @returns {Promise<string>}
   */
  async loadBaseTemplate() {
    if (!this.baseTemplate) {
      try {
        this.baseTemplate = await fs.readFile(this.baseTemplatePath, "utf-8");
      } catch (error) {
        console.error("Error loading base template:", error);
        throw new Error("Failed to load email base template");
      }
    }
    return this.baseTemplate;
  }

  /**
   * Get default variables for all emails
   * @returns {Object}
   */
  getDefaultVariables() {
    return {
      app_name: process.env.APP_NAME || "Bus Booking System",
      support_email: process.env.SUPPORT_EMAIL || "support@example.com",
      support_phone: process.env.SUPPORT_PHONE || "+1234567890",
      current_year: new Date().getFullYear().toString(),
      brand_color: process.env.BRAND_COLOR || "#4CAF50",
      brand_color_dark: process.env.BRAND_COLOR_DARK || "#388E3C",
      facebook_url: process.env.FACEBOOK_URL || "#",
      twitter_url: process.env.TWITTER_URL || "#",
      instagram_url: process.env.INSTAGRAM_URL || "#",
      app_url: process.env.APP_URL || "http://localhost:3000",
    };
  }

  /**
   * Replace variables in text
   * @param {string} text
   * @param {Object} variables
   * @returns {string}
   */
  replaceVariables(text, variables) {
    let result = text;
    Object.keys(variables).forEach((key) => {
      const regex = new RegExp(`{{${key}}}`, "g");
      const value = variables[key] !== undefined ? variables[key] : "";
      result = result.replace(regex, value);
    });
    return result;
  }

  /**
   * Render email template by slug
   * @param {string} slug - Template slug
   * @param {Object} variables - Variables to replace in template
   * @returns {Promise<{subject: string, html: string, text: string}>}
   */
  async renderEmail(slug, variables = {}) {
    try {
      // Get the template from database
      const template = await EmailTemplate.getBySlug(slug);
      if (!template) {
        throw new Error(`Template with slug "${slug}" not found`);
      }

      // Load base template
      const baseTemplate = await this.loadBaseTemplate();

      // Merge with default variables
      const allVariables = { ...this.getDefaultVariables(), ...variables };

      // Replace variables in template body (content)
      const content = this.replaceVariables(template.body, allVariables);

      // Replace subject variables
      const subject = this.replaceVariables(template.subject, allVariables);

      // Insert content into base template
      let finalHtml = baseTemplate.replace("{{content}}", content);

      // Replace base template variables
      finalHtml = this.replaceVariables(finalHtml, allVariables);

      return {
        subject,
        html: finalHtml,
        text: this.htmlToText(content),
      };
    } catch (error) {
      console.error("Error rendering email:", error);
      throw error;
    }
  }

  /**
   * Render email template by event type and recipient type
   * @param {string} eventType - Event type
   * @param {string} recipientType - Recipient type
   * @param {Object} variables - Variables to replace in template
   * @returns {Promise<{subject: string, html: string, text: string}>}
   */
  async renderEmailByEvent(eventType, recipientType, variables = {}) {
    try {
      const template = await EmailTemplate.findOne({
        event_type: eventType,
        recipient_type: recipientType,
        is_active: true,
      });

      if (!template) {
        throw new Error(
          `Template for event "${eventType}" and recipient "${recipientType}" not found`
        );
      }

      return this.renderEmail(template.slug, variables);
    } catch (error) {
      console.error("Error rendering email by event:", error);
      throw error;
    }
  }

  /**
   * Preview email template (for admin panel)
   * @param {string} subject - Email subject
   * @param {string} body - Email body content
   * @param {Object} variables - Variables to replace
   * @returns {Promise<{subject: string, html: string, text: string}>}
   */
  async previewEmail(subject, body, variables = {}) {
    try {
      const baseTemplate = await this.loadBaseTemplate();
      const allVariables = { ...this.getDefaultVariables(), ...variables };

      const renderedSubject = this.replaceVariables(subject, allVariables);
      const renderedContent = this.replaceVariables(body, allVariables);

      let finalHtml = baseTemplate.replace("{{content}}", renderedContent);
      finalHtml = this.replaceVariables(finalHtml, allVariables);

      return {
        subject: renderedSubject,
        html: finalHtml,
        text: this.htmlToText(renderedContent),
      };
    } catch (error) {
      console.error("Error previewing email:", error);
      throw error;
    }
  }

  /**
   * Convert HTML to plain text
   * @param {string} html
   * @returns {string}
   */
  htmlToText(html) {
    return html
      .replace(/<style[^>]*>.*?<\/style>/gi, "")
      .replace(/<script[^>]*>.*?<\/script>/gi, "")
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .trim();
  }

  /**
   * Validate template variables
   * @param {Array<string>} requiredVariables
   * @param {Object} providedVariables
   * @returns {Array<string>} Missing variables
   */
  validateVariables(requiredVariables, providedVariables) {
    const missing = [];
    requiredVariables.forEach((variable) => {
      if (!(variable in providedVariables)) {
        missing.push(variable);
      }
    });
    return missing;
  }
}

module.exports = new EmailService();
