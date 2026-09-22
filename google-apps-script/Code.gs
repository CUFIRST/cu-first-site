const DISCORD_WEBHOOK_PROPERTY = "DISCORD_WEBHOOK_URL";
const MAX_ATTEMPTS = 5;
const RETRY_DELAY_MS = 5000;
const MAX_EMBEDS = 6;
const MAX_TOTAL_CHARACTERS = 5800;
const MAX_SECTION_CHARACTERS = 1024;

function doPost(e) {
  try {
    const params = (e && e.parameter) || {};
    const webhookUrl = String(
      PropertiesService.getScriptProperties().getProperty(DISCORD_WEBHOOK_PROPERTY) || ""
    ).trim();

    validateWebhookUrl_(webhookUrl);
    sendToDiscord_(webhookUrl, buildPayload_(params));
    return responseJson_({ success: true });
  } catch (error) {
    console.error(error);
    return responseJson_({ success: false, message: error.message });
  }
}

function buildPayload_(params) {
  const message = truncateText_(String(params.message || "No message provided"), MAX_SECTION_CHARACTERS * 5);
  const messageChunks = splitText_(message, MAX_SECTION_CHARACTERS);
  const embeds = [{
    title: "New Contact Form Submission",
    color: 16711680,
    fields: [
      { name: "Name:", value: truncateText_(String(params.name || "Anonymous"), MAX_SECTION_CHARACTERS), inline: false },
      { name: "Email:", value: truncateText_(String(params.email || "No email provided"), MAX_SECTION_CHARACTERS), inline: false },
      { name: "Role:", value: truncateText_(String(params.role || "No role provided"), MAX_SECTION_CHARACTERS), inline: false },
    ],
  }];

  messageChunks.forEach(function (chunk, index) {
    if (index === 0) {
      embeds.push({
        color: 16711680,
        fields: [{ name: "Message:", value: chunk, inline: false }],
      });
    } else {
      embeds.push({ color: 16711680, description: chunk });
    }
  });

  if (embeds.length > MAX_EMBEDS) {
    throw new Error("The message exceeds the six-embed limit.");
  }

  const totalEmbeds = embeds.length;
  embeds.forEach(function (embed, index) {
    embed.footer = { text: (index + 1) + "/" + totalEmbeds };
    embed.timestamp = new Date().toISOString();
  });

  const characterCount = embeds.reduce(function (total, embed) {
    return total + embedCharacterCount_(embed);
  }, 0);
  if (characterCount > MAX_TOTAL_CHARACTERS) {
    throw new Error("The message exceeds Discord's character limit.");
  }

  return {
    content: params.diagnostic === "true" ? "CU FIRST contact form test" : undefined,
    embeds: embeds,
  };
}

function sendToDiscord_(webhookUrl, payload) {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const response = UrlFetchApp.fetch(webhookUrl, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
    });
    const code = response.getResponseCode();
    const body = response.getContentText();
    console.log("Discord attempt " + attempt + ": HTTP " + code + " " + body);

    if (code >= 200 && code < 300) return;
    if (attempt === MAX_ATTEMPTS) {
      throw new Error("Discord returned HTTP " + code + ": " + body);
    }
    Utilities.sleep(RETRY_DELAY_MS);
  }
}

function validateWebhookUrl_(webhookUrl) {
  if (!webhookUrl) throw new Error("Missing DISCORD_WEBHOOK_URL script property.");
  if (!/^https:\/\/discord\.com\/api\/webhooks\//.test(webhookUrl)) {
    throw new Error("DISCORD_WEBHOOK_URL is not a valid Discord webhook URL.");
  }
}

function testWebhook() {
  const result = doPost({ parameter: {
    name: "CU FIRST diagnostic",
    email: "cufirst.info+contact@gmail.com",
    role: "Diagnostic",
    message: "Manual end-to-end webhook test with six-embed support.",
    diagnostic: "true",
  }});
  console.log("Webhook test result: " + result.getContent());
}

function splitText_(text, maxLength) {
  const chunks = [];
  for (let start = 0; start < text.length; start += maxLength) {
    chunks.push(text.substring(start, start + maxLength));
  }
  return chunks.length ? chunks : [""];
}

function truncateText_(text, maxLength) {
  return text.length > maxLength ? text.substring(0, maxLength) : text;
}

function embedCharacterCount_(embed) {
  const fieldCharacters = (embed.fields || []).reduce(function (total, field) {
    return total + field.name.length + field.value.length;
  }, 0);
  return (embed.title || "").length + (embed.description || "").length +
    (embed.footer ? embed.footer.text.length : 0) + fieldCharacters;
}

function responseJson_(result) {
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}
