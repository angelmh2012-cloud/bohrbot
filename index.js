require("dotenv").config();
const axios = require("axios");
const { App } = require("@slack/bolt");

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true
});

// 1. /bohrbot-ping
app.command("/bohrbot-ping", async ({ ack, respond }) => {
  await ack();
  const start = Date.now();
  const latency = Date.now() - start;
  await respond({ text: `Pong!\nLatency: ${latency}ms` });
});


app.command("/bohrbot-hello", async ({ ack, respond, command }) => {
  await ack();
  const userName = command.user_name ? `@${command.user_name}` : "there";
  await respond({ text: `Hi ${userName}! I'm BohrBot, and I have some commands to probe dude!` });
});


app.command("/bohrbot-catfact", async ({ ack, respond }) => {
  await ack();
  try {
    const response = await axios.get("https://catfact.ninja/fact", { timeout: 2500 });
    await respond({ text: `Cat Fact:\n${response.data.fact}` });
  } catch (err) {
    await respond({ text: "Failed to fetch a cat fact." });
  }
});


app.command("/bohrbot-joke", async ({ ack, respond }) => {
  await ack();
  try {
    const response = await axios.get("https://official-joke-api.appspot.com/random_joke", { timeout: 2500 });
    await respond({
      text: `${response.data.setup}\n\n${response.data.punchline}`
    });
  } catch (err) {
    await respond({ text: "Failed to fetch a joke." });
  }
});


app.command("/bohrbot-randomspacefact", async ({ ack, respond, command }) => {
  await ack();
  const celestialObject = (command && command.text) ? command.text.trim() : "";
  if (!celestialObject) {
    await respond({ text: "Please provide a celestial object (e.g. `/bohrbot-randomspacefact Mars`)." });
    return;
  }
  try {
    const response = await axios.get(`https://api.bootprint.space/all/${encodeURIComponent(celestialObject)}`, { timeout: 2500 });
    const data = response.data || {};
    const title = data.title || data.object || celestialObject;
    const fact = data.fact || data.description || data.text || "";
    // try multiple common keys for images
    const imageUrl = data.image || data.image_url || (Array.isArray(data.images) && data.images[0]) || null;

    const blocks = [];
    if (title || fact) {
      const text = (fact ? `*${title}*\n${fact}` : `*${title}*`);
      blocks.push({ type: "section", text: { type: "mrkdwn", text } });
    }
    if (imageUrl) {
      blocks.push({ type: "image", image_url: imageUrl, alt_text: title || "image" });
    }

    // Provide a fallback `text` for clients that don't render blocks
    const fallbackText = `${title}${fact ? ' - ' + fact : ''}`;
    await respond({ text: fallbackText, blocks });
  } catch (err) {
    await respond({ text: "Failed to fetch a space fact (API might be down)." });
  }
});


app.command("/bohrbot-chucknorris", async ({ ack, respond }) => {
  await ack();
  try {
    const response = await axios.get("https://api.chucknorris.io/jokes/random", { timeout: 2500 });
    await respond({ text: `Chuck Norris Fact:\n${response.data.value}` });
  } catch (err) {
    await respond({ text: "Failed to fetch a Chuck Norris fact." });
  }
});

app.command("/bohrbot-pizzastatus", async ({ ack, respond, command }) => {
  await ack();
  const status = (command && command.text) ? command.text.trim() : "";
  if (!status) {
    await respond({ text: "Please provide a pizza status (e.g. `/bohrbot-pizzastatus 404`)." });
    return;
  }
  try {
    const response = await axios.get(`https://status.pizza/${encodeURIComponent(status)}`, { timeout: 5000});
    const html = response.data || '';

    let imageUrl = null;
    const imgMatch = html.match(/<img[^>]+src=["']?([^"' >]+)/i);
    if (imgMatch && imgMatch[1]) {
      imageUrl = imgMatch[1];
   imageUrl = 'https://status.pizza/' + status;
    }

    // extract title or header as text
    let title = null;
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch && titleMatch[1]) title = titleMatch[1].trim();
    const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    if (!title && h1Match && h1Match[1]) title = h1Match[1].trim();

    const blocks = [];
    const safeStatus = encodeURIComponent(status);
    const headerText = title
      ? `*Pizza Status:* ${title}`
      : `*Pizza Status:* ${status} — <https://status.pizza/${safeStatus}|view>`;
    blocks.push({ type: 'section', text: { type: 'mrkdwn', text: headerText } });
    if (imageUrl) {
      blocks.push({ type: 'image', image_url: imageUrl, alt_text: title || 'pizza status' });
    }

    const fallbackText = title || `Pizza status for ${status}`;
    await respond({ text: fallbackText, blocks });
  } catch (err) {
    console.error('pizza status error:', err && err.message ? err.message : err);
    await respond({ text: 'Failed to fetch pizza status.' });
  }
});


app.command("/bohrbot-weather", async ({ ack, respond, command }) => {
  await ack();
  const city = command.text.trim();
  
  if (!city) {
    await respond({ text: "Please provide a city name (e.g. `/bohrbot-weather London`)." });
    return;
  }

  try {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) {
      await respond({ text: "API Key for OpenWeather is missing in .env file." });
      return;
    }

    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`,
      { timeout: 2500 }
    );
    await respond({
      text: `Weather in ${city}:\nTemperature: ${response.data.main.temp}°C\nWeather: ${response.data.weather[0].description}`
    });
  } catch (err) {
    await respond({ text: "Failed to fetch weather data. Check city name or API Key." });
  }
});

(async () => {
  await app.start();
  console.log("bot is running!");
})();