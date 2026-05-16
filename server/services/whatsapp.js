const DEFAULT_GRAPH_VERSION = "v21.0";

const cleanEnv = (key) => String(process.env[key] || "").trim();

const hasWhatsAppOtpConfig = () =>
  Boolean(
    cleanEnv("WHATSAPP_ACCESS_TOKEN") &&
      cleanEnv("WHATSAPP_PHONE_NUMBER_ID") &&
      cleanEnv("WHATSAPP_OTP_TEMPLATE_NAME")
  );

const isWhatsAppOtpDevMode = () =>
  ["1", "true", "yes"].includes(cleanEnv("WHATSAPP_OTP_DEV_MODE").toLowerCase());

const replaceCodePlaceholders = (value, otp) => {
  if (Array.isArray(value)) {
    return value.map((item) => replaceCodePlaceholders(item, otp));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, replaceCodePlaceholders(item, otp)])
    );
  }

  if (typeof value === "string") {
    return value.replace(/\{\{\s*(code|otp|1)\s*\}\}/gi, otp);
  }

  return value;
};

const getTemplateComponents = (otp) => {
  const customComponents = cleanEnv("WHATSAPP_OTP_COMPONENTS_JSON");

  if (customComponents) {
    return replaceCodePlaceholders(JSON.parse(customComponents), otp);
  }

  return [
    {
      type: "body",
      parameters: [{ type: "text", text: otp }],
    },
    {
      type: "button",
      sub_type: cleanEnv("WHATSAPP_OTP_BUTTON_SUB_TYPE") || "url",
      index: cleanEnv("WHATSAPP_OTP_BUTTON_INDEX") || "0",
      parameters: [{ type: "text", text: otp }],
    },
  ];
};

const formatWhatsAppRecipient = (mobile) => {
  const digits = String(mobile || "").replace(/\D/g, "");

  if (digits.length > 10) {
    return digits;
  }

  return `${cleanEnv("WHATSAPP_COUNTRY_CODE") || "91"}${digits}`;
};

const sendWhatsAppOtp = async ({ mobile, otp }) => {
  if (isWhatsAppOtpDevMode()) {
    return {
      deliveryMode: "dev",
      messageId: "dev-whatsapp-otp",
    };
  }

  if (!hasWhatsAppOtpConfig()) {
    const error = new Error(
      "WhatsApp OTP is not configured. Add WhatsApp Cloud API credentials on the server."
    );
    error.statusCode = 503;
    throw error;
  }

  if (typeof fetch !== "function") {
    const error = new Error("Server Node.js version does not support fetch for WhatsApp API calls.");
    error.statusCode = 500;
    throw error;
  }

  const graphVersion = cleanEnv("WHATSAPP_GRAPH_VERSION") || DEFAULT_GRAPH_VERSION;
  const phoneNumberId = cleanEnv("WHATSAPP_PHONE_NUMBER_ID");
  const endpoint = `https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cleanEnv("WHATSAPP_ACCESS_TOKEN")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: formatWhatsAppRecipient(mobile),
      type: "template",
      template: {
        name: cleanEnv("WHATSAPP_OTP_TEMPLATE_NAME"),
        language: {
          code: cleanEnv("WHATSAPP_OTP_TEMPLATE_LANGUAGE") || "en_US",
        },
        components: getTemplateComponents(otp),
      },
    }),
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(
      result?.error?.message || "WhatsApp failed to send the OTP. Please try again shortly."
    );
    error.statusCode = response.status >= 500 ? 502 : 400;
    error.providerError = result;
    throw error;
  }

  return {
    deliveryMode: "cloud_api",
    messageId: result?.messages?.[0]?.id || "",
  };
};

module.exports = {
  hasWhatsAppOtpConfig,
  isWhatsAppOtpDevMode,
  sendWhatsAppOtp,
};
