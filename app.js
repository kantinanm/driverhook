const config = require("./config");
const express = require("express");

var util = require("./util");
const cors = require("cors");

var app = express();

app.use(cors());

//old_schedule_driver
app.get("/", function (req, res) {
  console.log("Hello World");

  res.json({
    message: "Hello World",
  });
});

app.get("/onday", async (req, res) => {
  // res.json({
  //   message: "Hello World",
  // });

  const nunet = "chaiwattho"; //prapotep //phornchetj
  const date_filter = "08-05-2025";

  try {
    const data = await util.webHookDriverTask(nunet, date_filter);

    const filter = data.schedule.filter(
      (item) => item.token != null && item.token !== ""
    );

    console.log("Before filter:", data.schedule.length);
    console.log("After filter:", filter.length);

    if (filter.length > 0) {
      //res.json({ schedule: filter });
      //to create flex message
      const flex = await util.toFlexMessage(filter, date_filter);
      console.log("Flex message prepared.");
      console.log("Ready to sent  to LINE Notify");
      res.json(flex);
    } else {
      console.log("No token found in schedule.");
      res.json({ message: "No token found in schedule" });
    }
  } catch (err) {
    console.error("Error:", err.message);
    res.json({ Error: err.message });
  }
});

//test push message to line notify with single user token
app.get("/push", async (req, res) => {
  //
  const nunet = "chaiwattho";
  const date_filter = "02-05-2025";

  try {
    const data = await util.webHookDriverTask(nunet, date_filter);

    const filter = data.schedule.filter(
      (item) => item.token != null && item.token !== ""
    );

    console.log("Before filter:", data.schedule.length);
    console.log("After filter:", filter.length);

    if (filter.length > 0) {
      const target_user = filter[0].token;
      console.log("Target user:", target_user);

      const flex = await util.toFlexMessage(filter, date_filter);
      console.log("Flex message prepared.");

      const postData = {
        //to: "U8f8e4b03ef6f41a4be11a1f08b0f4c88",
        to: ["U8f8e4b03ef6f41a4be11a1f08b0f4c88", target_user],
        messages: [
          {
            type: "flex",
            altText: `${config.label_notification}`,
            contents: {
              type: "carousel",
              contents: flex,
            },
          },
        ],
      };

      const response = await util.sendLineNotify(postData);
      console.log("Notification sent:", response);

      res.json({ message: "Notification sent", response: response });
    } else {
      console.log("No token found in schedule.");
      res.json({ message: "No token found in schedule" });
    }
  } catch (err) {
    console.error("Error:", err.message);
    res.json({ Error: err.message });
  }
});

var port = process.env.port || config.port;

console.log(" Port config: " + port);
console.log(" API URL: " + config.external_url);

app.listen(port, function () {
  console.log("Starting node.js on port " + port);
});
