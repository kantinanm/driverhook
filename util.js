const moment = require("moment");
const momentz = require("moment-timezone");
const fetch = require("node-fetch");
const config = require("./config");
const LINE_Multicast = "https://api.line.me/v2/bot/message/multicast";
const LINE_Push = "https://api.line.me/v2/bot/message/push";

async function webHookDriverTask(username, check_date) {
  try {
    console.log(`Fetching data for user: ${username}, date: ${check_date}`);

    const response = await fetch(
      `${config.external_url}/driver/${username}/${check_date}`,
      {
        method: "GET",
        headers: { Accept: "application/json" },
      }
    );

    if (!response.ok) {
      throw new Error(
        `HTTP error! status: ${
          response.status
        }, message: ${await response.text()}`
      );
    }

    const objJSON = await response.json();
    const schedule = objJSON.map((item) => ({
      booking_number: item.booking_number,
      use_to: item.request_by_ou,
      title: item.title,
      detail: item.detail,
      travelers: item.travelers,
      user_request: item.request_by,
      phone: item.phone,
      car: item.vehicle_id === 3 ? "รถกระบะ" : "รถตู้",
      vehicle_id: item.vehicle_id,
      vehicle_number: item.vehicle_number,
      service_area: item.service_area,
      location: item.location,
      days: item.days,
      times_unit: item.times_unit,
      startdate: item.start_date,
      start_time: item.start_time,
      enddate: item.end_date,
      end_time: item.end_time,
      driver_nunet: item.driver_nunet,
      driver_name: item.driver_name,
      appointment: `${item.start_time} - ${item.end_time}`,
      appointment_type: item.days === 0 ? "onedays" : "period",
      token: item.user_token,
      status: item.status,
      send_status: item.send_status,
      approved_date: item.approved_date,
    }));

    console.log(`Fetched ${schedule.length} schedule items.`);
    return { schedule };
  } catch (err) {
    console.error("Error in webHookDriverTask:", err.message);
    throw err;
  }
}

async function toFlexMessage(schedule, date) {
  var bubbles = [];

  var cr = 1; // for increasing index of bubbles

  console.log("schedule length: " + schedule.length);
  //filter and split schedule to bubbles
  schedule = schedule.filter((item) => item.send_status > 0); // ประโพดเกษียนหนังสือ แล้ว
  console.log("split schedule and remain length: " + schedule.length);

  //manipulate location  in all elements.
  // then passing value to createMainBubble function
  // Collect all locations into a single variable
  const allLocations = schedule.map((item) => item.location).join(", ");
  console.log("allLocations is : " + allLocations);

  schedule.forEach((booking, index) => {
    console.log("index: " + index);

    if (index == 0) {
      //Header bubble
      bubbles[index] = createMainBubble(booking, date, allLocations);
    }

    bubbles[cr] = createFlexMessage(booking);
    cr++;
    //bubbles[index] = createFlexMessage(booking);
  });

  return bubbles; // bubbles only
}

const sendLineNotify = async (postData) => {
  try {
    var endpoint = "";
    //check if postData.to is an array or a single value
    const recipientsType = typeof postData.to;
    if (recipientsType === "string") {
      console.log(`'recipients' is a string: ${postData.to}`);
      endpoint = LINE_Push;
    } else if (recipientsType === "object") {
      console.log(`'recipients' is an object:`, postData.to);
      endpoint = LINE_Multicast;
    } else {
      console.log(`' unexpected type: ${postData.to}`);
      throw new Error("Invalid 'recipients' type. Must be string or object.");
    }

    console.log(`endpoint is ${endpoint} `);

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.line_channel_access_token}`,
      },
      body: JSON.stringify(postData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `HTTP error! status: ${response.status}, message: ${errorText}`
      );
    }

    const responseData = await response.json();
    console.log("Sent successfully:", responseData);
    return responseData;
  } catch (error) {
    console.error("Error sending LINE Notify:", error.message);
    throw error;
  }
};

function createFlexMessage(booking) {
  const startTime = booking.start_time.substring(0, 5);
  const endTime = booking.end_time.substring(0, 5);
  const timeRange = `${startTime} - ${endTime}`;

  var time_contents = [];

  console.log("appointment_type[days]: " + booking.days);

  if (booking.days > 0) {
    time_contents[0] = {
      type: "text",
      text: booking.appointment,
      align: "start",
      size: "sm",
    };
  } else {
    time_contents[0] = {
      type: "text",
      text: "เวลา:  ",
      weight: "bold",
      align: "end",
      size: "sm",
    };
    time_contents[1] = {
      type: "text",
      text: timeRange,
      align: "start",
      size: "sm",
    };
  }

  // Multi-dimensional array with key-value mapping for car
  const cars = [
    { car_id: 1, image: "1686801796.jpg" }, //นx xx97
    { car_id: 3, image: "1735115938.jpg" }, //xจ xx79
    { car_id: 5, image: "1735115803.jpg" }, //xข xx45
  ];

  // Find the profile image for the given user
  const carProfile = cars.find((car) => car.car_id === booking.vehicle_id);
  const carImage = carProfile ? carProfile.image : "default.png";

  // Create the Flex message structure
  return {
    type: "bubble",
    header: {
      type: "box",
      layout: "horizontal",
      contents: [
        {
          type: "text",
          text: booking.vehicle_number,
          size: "xl",
          color: "#f7cea8",
          decoration: "underline",
          align: "start",
        },
        {
          type: "text",
          text: booking.booking_number,
          color: "#FFFFFF",
        },
      ],
    },
    hero: {
      type: "image",
      url: `${config.asset_url}/images/cars/${carImage}`,
      aspectMode: "cover",
      aspectRatio: "1.51:1",
      size: "full",
    },
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: `ปลายทาง: ${booking.location}`,
          color: "#8c1c65",
          size: "sm",
          weight: "bold",
        },
        {
          type: "box",
          layout: "horizontal",
          contents: time_contents,
        },
        {
          type: "box",
          layout: "horizontal",
          contents: [
            {
              type: "text",
              text: "ผู้ร่วมเดินทาง :  ",
              weight: "bold",
              align: "end",
              size: "sm",
            },
            {
              type: "text",
              text: `${booking.travelers} ราย`,
              align: "start",
              size: "sm",
            },
          ],
        },
        {
          type: "separator",
        },
        {
          type: "text",
          text: booking.title,
          size: "sm",
        },
      ],
    },
    footer: {
      type: "box",
      layout: "horizontal",
      contents: [
        {
          type: "text",
          text: "ผู้ทำรายการ",
          color: "#FFFFFF",
        },
        {
          type: "text",
          text: booking.user_request,
          color: "#FFFFFF",
          size: "xl",
        },
      ],
      backgroundColor: "#1c4f8c",
    },
    styles: {
      header: {
        backgroundColor: "#1c4f8c",
        separator: true,
      },
    },
  };
}
function createMainBubble(booking, date_checked, locations) {
  // Multi-dimensional array with key-value mapping for usernames and profile images
  // const profiles = [
  //   { username: "prapotep", image: "prapotep.png" },
  //   { username: "phornchetj", image: "tae_cute.png" },
  //   {
  //     username: "chaiwattho",
  //     image: "wall-stickers-for-kids-mario-and-yoshi.jpg",
  //   },
  //   { username: "tongchaili", image: "Browser_Mario_Kart.png" }, //thongchaili.png
  // ];

  // // Find the profile image for the given user
  // const userProfile = profiles.find(
  //   (profile) => profile.username === booking.driver_nunet
  // );
  // const userImage = userProfile
  //   ? userProfile.image
  //   : "wall-stickers-for-kids-mario-and-yoshi.jpg";

  // List of images for randomization
  const randomImages = [
    "Browser_Mario_Kart.png",
    "wall-stickers-for-kids-mario-and-yoshi.jpg",
    //"diddy_kong.jpg",
    "donkey-kong-bananza.jpg",
  ];

  // Randomly select an image from the list
  const randomIndex = Math.floor(Math.random() * randomImages.length);
  const userImage = randomImages[randomIndex];

  //moment("2022/12/01", "YYYY-MM-DD")
  var myDate = moment(date_checked, "DD-MM-YYYY");
  //dateCheck = momentz.tz("Asia/Bangkok").format("DD-MM-YYYY");

  onDate =
    myDate.format("DD") +
    " " +
    getCurrentMonth(myDate.format("MM")) +
    " " +
    (parseInt(myDate.format("YYYY")) + 543);

  console.log("onDate: " + onDate);

  return {
    type: "bubble",
    header: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: `${config.label_notification}`,
          color: "#FFFFFF",
          align: "center",
          scaling: true,
          wrap: true,
          size: "xl",
        },
      ],
    },
    hero: {
      type: "image",
      //`${config.asset_url}/images/asset/driver_profile/${userImage}`
      url: `${config.asset_url}/images/asset/driver_profile/${userImage}`,
      aspectRatio: "1.51:1",
      aspectMode: "fit",
      size: "full",
    },
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: `สวัสดีคุณ ${booking.driver_name} `,
        },
        {
          type: "separator",
          color: "#48036f",
          margin: "sm",
        },
        {
          type: "text",
          text: "สถานที่ที่คุณต้องไป ในวันนี้ ",
          align: "end",
          weight: "bold",
          margin: "md",
          size: "sm",
        },
        {
          type: "text",
          text: `${locations} `,
          size: "sm",
          decoration: "underline",
          align: "center",
          color: "#1e5cb3",
        },
      ],
    },
    footer: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: `งานวันนี้ (${onDate})`,
          align: "center",
          weight: "regular",
          color: "#FFFFFF",
          scaling: true,
          wrap: true,
          size: "xl",
        },
      ],
      backgroundColor: "#8c743b",
    },
    styles: {
      header: {
        separator: true,
        backgroundColor: "#528238",
        separatorColor: "#44434a",
      },
    },
  };
}
function getCurrentMonth(month_num) {
  switch (month_num) {
    case "01":
      return "ม.ค."; //มกราคม
      break;
    case "02":
      return "ก.พ."; //กุมภาพันธ์
      break;
    case "03":
      return "มี.ค."; //มีนาคม
      break;
    case "04":
      return "เม.ย."; //เมษายน
      break;
    case "05":
      return "พ.ค."; //พฤษภาคม
      break;
    case "06":
      return "มิ.ย."; //มิถุนายน
      break;
    case "07":
      return "ก.ค."; //กรกฎาคม
      break;
    case "08":
      return "ส.ค."; //สิงหาคม
      break;
    case "09":
      return "ก.ย."; //กันยายน
      break;
    case "10":
      return "ต.ค."; // ตุลาคม
      break;
    case "11":
      return "พ.ย."; //  พฤศจิกายน
      break;
    case "12":
      return "ธ.ค."; //ธันวาคม
      break;
  }
}

module.exports = {
  webHookDriverTask,
  toFlexMessage,
  sendLineNotify,
};
