const proxy = require("./proxy");

const {
  TELEGRAM_TOKEN,
  GITLAB_TOKEN,
  BOT_PORT,
  SECRET_PATH,
  SECRET_LOCATION,
  ADMIN_ID,
  DB_USER,
  DB_PASS,
  DB_HOST = "localhost",
  DB_PORT = "27017",
  DB_NAME,
  DEFAULT_PROJECT,
  SOCKS_URL
} = process.env;

const botConfig = {
  telegram: {}
};
if (SOCKS_URL) {
  botConfig.telegram = { ...botConfig.telegram, agent: proxy(SOCKS_URL) };
}

const DB_URL = `mongodb://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;

module.exports = {
  TELEGRAM_TOKEN,
  GITLAB_TOKEN,
  BOT_PORT: parseInt(BOT_PORT, 10), // webhook only
  EXPRESS_PATH: `/${SECRET_PATH}`, // webhook only
  SECRET_LOCATION, // webhook only
  SECRET_PATH, // webhook only
  ADMIN_ID: parseInt(ADMIN_ID, 10),
  DB_URL,
  DEFAULT_PROJECT,
  BOT_CONFIG: botConfig,
  DEFAULT_MESSAGE: "¯\\_(ツ)_/¯"
};
