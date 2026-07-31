require("dotenv").config();
const axios = require("axios");
const qs = require("querystring");

function parseBody(body, contentType = "") {
  if (!body) return {};

  if (typeof body === "object") return body;

  if (contentType.includes("application/json")) {
    return JSON.parse(body);
  }

  const parsed = qs.parse(body);
  if (typeof parsed.payload === "string") {
    try {
      return JSON.parse(parsed.payload);
    } catch (err) {
      return parsed;
    }
  }

  return parsed;
}

async function buildCommandResponse(payload) {
  const command = payload.command || "";
  const text = (payload.text || "").trim();

  switch (command) {
    case "/bohrbot-ping": {
      return `Pong!\nYour command was received successfully.`;
    }
    case "/bohrbot-catfact": {
      try {
        const response = await axios.get("https://catfact.ninja/fact");
        return `Cat Fact:\n${response.data.fact}`;
      } catch (err) {
        return "Failed to fetch a cat fact.";
      }
    }
    case "/bohrbot-joke": {
      try {
        const response = await axios.get("https://official-joke-api.appspot.com/random_joke");
        return `${response.data.setup}\n\n${response.data.punchline}`;
      } catch (err) {
        return "Failed to fetch a joke.";
      }
    }
    case "/bohrbot-quote": {
      try {
        const response = await axios.get("https://api.quotable.io/random");
        return `Quote:\n"${response.data.content}" - ${response.data.author}`;
      } catch (err) {
        return "Failed to fetch a quote.";
      }
    }
    case "/bohrbot-randomemoji": {
      try {
        const response = await axios.get("https://emojihub.herokuapp.com/api/random");
        return `Random Emoji:\n${response.data.htmlCode}`;
      } catch (err) {
        return "Failed to fetch a random emoji.";
      }
    }
    case "/bohrbot-weather": {
      if (!text) {
        return "Please provide a city name.";
      }

      try {
        const apiKey = process.env.OPENWEATHER_API_KEY;
        if (!apiKey) {
          return "The weather API key is not configured.";
        }

        const response = await axios.get(
          `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(text)}&appid=${apiKey}&units=metric`
        );
        return `Weather in ${text}:\nTemperature: ${response.data.main.temp}°C\nWeather: ${response.data.weather[0].description}`;
      } catch (err) {
        return "Failed to fetch weather data.";
      }
    }
    default:
      return `Unknown command: ${command}`;
  }
}

async function handleSlashCommand(req, res) {
  let body = "";

  for await (const chunk of req) {
    body += chunk.toString();
  }

  const payload = parseBody(body, req.headers["content-type"] || "");
  const command = payload.command || "";

  if (!command) {
    res.status(400).send("Missing Slack command payload");
    return;
  }

  const responseText = await buildCommandResponse(payload);

  if (payload.response_url) {
    try {
      await axios.post(payload.response_url, { text: responseText });
    } catch (err) {
      console.error("Failed to send Slack response:", err.message);
    }
  }

  res.status(200).send("");
}

module.exports = {
  handleSlashCommand,
  buildCommandResponse
};

