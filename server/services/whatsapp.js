const DEFAULT_GRAPH_VERSION = "v21.0";

const hasWhatsAppConfig = () =>
  Boolean(
    process.env.WHATSAPP_ACCESS_TOKEN &&
      process.env.WHATSAPP_PHONE_NUMBER_ID &&
      process.env.WHATSAPP_OTP_TEMPLATE_NAME
  );

const getRecipientNumber = (mobile) => {
  const countryCode = String(process.env.WHATSAPP_COUNTRY_CODE || "91").replace(/\D/g, "");
  return `${countryCode}${String(mobile || "").replace(/\D/g, "")}`;
};

const buildOtpTemplateComponents = (otp) => {
  const components = [
    {
      type: "body",
      parameters: [{ type: "text", text: otp }],
    },
  ];

  if (String(process.env.WHATSAPP_OTP_TEMPLATE_HAS_URL_BUTTON || "").toLowerCase() === "true") {
    components.push({
      type: "button",
      sub_type: "url",
      index: "0",
      parameters: [{ type: "text", text: otp }],
    });
  }

  return components;
};

const sendWhatsAppOtp = async ({ mobile, otp }) => {
  if (!hasWhatsAppConfig()) {
    const error = new Error("WhatsApp login is not configured.");
    error.code = "WHATSAPP_NOT_CONFIGURED";
    throw error;
  }

  const graphVersion = process.env.WHATSAPP_GRAPH_VERSION || DEFAULT_GRAPH_VERSION;
  const url = `https://graph.facebook.com/${graphVersion}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: getRecipientNumber(mobile),
      type: "template",
      template: {
        name: process.env.WHATSAPP_OTP_TEMPLATE_NAME,
        language: {
          code: process.env.WHATSAPP_TEMPLATE_LANGUAGE || "en",
        },
        components: buildOtpTemplateComponents(otp),
      },
    }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      payload?.error?.message ||
      payload?.message ||
      "WhatsApp OTP could not be sent.";
    const error = new Error(message);
    error.code = "WHATSAPP_SEND_FAILED";
    error.payload = payload;
    throw error;
  }

  return payload;
};

module.exports = {
  hasWhatsAppConfig,
  sendWhatsAppOtp,
};
