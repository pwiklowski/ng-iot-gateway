# ng-iot-gateway

This repository contains gateway used in my own iot solution. It exposes two interfaces REST and websocket. Over those interfaces connected "controlers" can control "devices". It used auth0 for authentication, express for http service, mongodb for db. 

This is a part of an ng-iot project. For more apps see:

- Common library used in all JS projects - https://github.com/pwiklowski/lib-ng-iot
- Web Iot dashboard for controlling connected devices - https://github.com/pwiklowski/ng-iot-webapp
- Common library used in all C projects - https://github.com/pwiklowski/ng-iot-esp-idf-library
- Esp32 firmware for PWM led drivers - https://github.com/pwiklowski/ng-iot-esp32-rgb-led-driver
- Esp32 firmware for addressable led strips - https://github.com/pwiklowski/ng-iot-esp32-ws2812
- Node application for iot<->Zigbee adapter - https://github.com/pwiklowski/ng-iot-router-box

# Development server

``` 
npm start
```


# Deploy

```
docker-compose up --build -d
```
