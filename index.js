require("dotenv").config();
const axios = require("axios");
const { App, ExpressReceiver } = require("@slack/bolt");

const receiver = new ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  endpoints: "/slack/events",
  port: Number(process.env.PORT || 3000)
});

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

app.command("/bohrbot-ping", async ({ ack, respond }) => {
  await ack();
  const start = Date.now();
  const latency = Date.now() - start;
  await respond({ text: `Pong!\nLatency: ${latency}ms` });
});

app.command("/bohrbot-catfact", async ({ ack, respond }) => {
  await ack();

  try {
    const response = await axios.get("https://catfact.ninja/fact");
    await respond({ text: `Cat Fact:\n${response.data.fact}` });
  } catch (err) {
    await respond({ text: "Failed to fetch a cat fact." });
  }
});

app.command("/bohrbot-joke", async ({ ack, respond }) => {
  await ack();

  try {
    const response = await axios.get("https://official-joke-api.appspot.com/random_joke");
    await respond({
      text: `${response.data.setup}\n\n${response.data.punchline}`
    });
  } catch (err) {
    await respond({ text: "Failed to fetch a joke." });
  }
});

app.command("/bohrbot-quote", async ({ ack, respond }) => {
  await ack();

  try {
    const response = await axios.get("https://api.quotable.io/random");
    await respond({ text: `Quote:\n"${response.data.content}" - ${response.data.author}` });
  } catch (err) {
    await respond({ text: "Failed to fetch a quote." });
  }
});

app.command("/bohrbot-randomemoji", async ({ ack, respond }) => {
  await ack();

  try {
    const response = await axios.get("https://emojihub.herokuapp.com/api/random");
    await respond({ text: `Random Emoji:\n${response.data.htmlCode}` });
  } catch (err) {
    await respond({ text: "Failed to fetch a random emoji." });
  }
});

app.command("/bohrbot-weather", async ({ ack, respond, command }) => {
  await ack();

  const city = (command.text || "").trim();
  if (!city) {
    await respond({ text: "Please provide a city name." });
    return;
  }

  try {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) {
      await respond({ text: "The weather API key is not configured." });
      return;
    }

    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`
    );
    await respond({
      text: `Weather in ${city}:\nTemperature: ${response.data.main.temp}°C\nWeather: ${response.data.weather[0].description}`
    });
  } catch (err) {
    await respond({ text: "Failed to fetch weather data." });
  }
});

(async () => {
  try {
    await app.start();
    console.log("bot is running!");
  } catch (err) {
    console.error("Failed to start Slack app:", err);
    process.exit(1);
  }
})();

