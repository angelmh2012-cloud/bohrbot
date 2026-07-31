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


app.command("/bohrbot-quote", async ({ ack, respond }) => {
  await ack();
  try {
    const response = await axios.get("https://api.quotable.io/random", { timeout: 2500 });
    await respond({ text: `Quote:\n"${response.data.content}" - ${response.data.author}` }); 
  } catch (err) {
    await respond({ text: "Failed to fetch a quote (API might be down)." });
  }
});


app.command("/bohrbot-randomemoji", async ({ ack, respond }) => {
  await ack();
  try {
    const response = await axios.get("https://emojihub.herokuapp.com/api/random", { timeout: 2500 });
    await respond({ text: `Random Emoji:\n${response.data.htmlCode}` });
  } catch (err) {
    await respond({ text: "Failed to fetch a random emoji." });
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