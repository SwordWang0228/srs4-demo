# srs4-demo

## srs4-demo 启动步骤

1. 启动srs4服务
1. 启动httpServer

## 启动srs4服务

1. 创建配置文件
   ```bash
   cp ./srsConf/srs.example.conf srsConf/srs.conf
   # 修改配置${ipv4} 为docker 宿主机的内网地址
   ```   
1. 使用docker启动srs4: `docker run -d --name srs4-demo-srs -v=/${项目目录}/srs4-demo/srsConf/srs.conf:/usr/local/srs/conf/srs.conf -p 11935:1935 -p 11985:1985 -p 18080:8080 --env CANDIDATE="${ipv4 或者 ipv6}" -p 18000:8000/udp ossrs/srs:v4.0-b10 ./objs/srs -c conf/srs.conf`
> 注意: 修改srsConf/srs.conf后需要手动 重启 srs4-demo-srs ===》`docker restart srs4-demo-srs`

## 启动httpServer

```bash
cd srs4-demo/httpServer
npm i
npm run restart
# Demo页面: http://127.0.0.1:7015
# 信令服务: ws://127.0.0.1:1990/sig/v1/rtc
```

## 本地开发

**打开浏览器访问**: http://127.0.0.1:7015/public/one2oneAudio.html?autostart=true&room=colin&host=192.168.31.91:1985&wsh=192.168.31.91&wss=ws&wsp=1990
> 注意: 
>  - chrome浏览器下网页`推流&拉流`需要使用https(127.0.0.1页面除外)
>  - host: 必须使用ipv4 或者 ipv6, 否则无法推流
>  - wsh=192.168.31.91&wss=ws&wsp=1990 ===> ws://127.0.0.1:1990/sig/v1/rtc

## 开源江湖Demo

