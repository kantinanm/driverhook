# NodeJS , driverhook

### Features

Retrive jobs from booking to sent line messaging.

# How to install

Use powershell or cmd and type by order, please see below.

- `git clone https://github.com/kantinanm/driverhook.git`
- `cd driver-notify`
- > install package dependency in this project.
  > `npm install`
- > create .env and modify value.
  > `copy .env.example .env`
  > In linux use command `cp .env.example .env`
  > at .env file to modify value,
  ```javascript
  PORT=3000
  HOST=localhost
  HOST_URL=http://localhost:3000
  EXTERNAL_API =https://aaa/xxx/api
  ASSET_URL=https://localhost:8000
  LABEL_NOTIFICATION="Notification"
  LINE_CHANNEL_ACCESS_TOKEN=""
  DRIVER_ACC=user1,user2,user3
  APPROVER=master1,master2
  ```
- `npm run start`

# Test URL

http://localhost:3000
http://localhost:3000/onday
http://localhost:3000/push
