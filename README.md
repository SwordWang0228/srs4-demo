# srs4-demo

## srs4-demo 启动步骤

1. 启动srs4服务
1. 启动httpServer

## 启动srs4服务

1. 使用docker启动srs4: `docker run -d --name srs4-demo-srs -v=/${项目目录}/srs4-demo/srsConf/srsConf/customize.conf:/usr/local/srs/conf/customize.conf -p 11935:11935 -p 11985:11985 -p 18080:18080 --env CANDIDATE="${ipv4 或者 ipv6}" -p 18000:18000/udp ossrs/srs:v4.0-b10 ./objs/srs -c conf/customize.conf`

## 启动httpServer

```bash
cd srs4-demo/httpServer
npm i
npm run restart
```
**打开浏览器访问**