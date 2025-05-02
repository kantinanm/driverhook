const dotenv = require("dotenv");

dotenv.config({ path: "./.env" });
const {
  PORT,
  HOST,
  HOST_URL,
  EXTERNAL_API,
  DRIVER_ACC,
  ASSET_URL,
  LINE_CHANNEL_ACCESS_TOKEN,
  APPROVER,
  LABEL_NOTIFICATION,
} = process.env;

module.exports = {
  port: PORT,
  host: HOST,
  host_url: HOST_URL,
  external_url: EXTERNAL_API,
  driver_acc: DRIVER_ACC,
  asset_url: ASSET_URL,
  line_channel_access_token: LINE_CHANNEL_ACCESS_TOKEN,
  approver: APPROVER,
  label_notification: LABEL_NOTIFICATION,
};
