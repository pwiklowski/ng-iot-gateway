# ng-iot-gateway

This repository contains gateway used in my own iot solution. It exposes two interfaces REST and websocket. Over those interfaces connected "controlers" can control "devices". It used auth0 for authentication, express for http service, mongodb for db. 


# Development server

``` 
npm start
```


# Deploy

```
docker-compose up --build -d
```
