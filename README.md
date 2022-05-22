# srs4-demo

## srs4-demo 启动步骤

1. 启动srs4服务（非必要，可以直接使用 开源江湖的srs服务）
1. 启动httpServer

## 本地启动srs4服务

1. 创建配置文件
   ```bash
   cp ./srsConf/srs.example.conf srsConf/srs.conf
   # 修改配置${ipv4} 为docker 宿主机的内网地址
   ```   
1. 使用docker启动srs4: `docker run -d --name srs4-demo-srs -v=/${项目目录}/srs4-demo/srsConf/srs.conf:/usr/local/srs/conf/srs.conf -p 11935:11935 -p 11985:11985 -p 18080:18080 --env CANDIDATE="${ipv6 或者 ipv4}" -p 18000:18000/udp ossrs/srs:v4.0-b10 ./objs/srs -c conf/srs.conf`
> 注意: 
>  - 修改srsConf/srs.conf后需要手动 重启 srs4-demo-srs ===》`docker restart srs4-demo-srs`
>  - 进入docker容器: `docker exec -it --user root srs4-demo-srs /bin/bash`

## 启动httpServer

```bash
cd srs4-demo/httpServer
npm i
npm run dev
# Demo页面: http://127.0.0.1:7015
# 信令服务: ws://127.0.0.1:1990/sig/v1/rtc
```

## 本地调试（使用本地的 srs）

**打开浏览器访问**: http://127.0.0.1:7015/public/one2oneAudio.html?autostart=true&host=192.168.31.91
> 注意: 
>  - chrome浏览器下网页`推流&拉流`需要使用https(127.0.0.1页面除外)
>  - host: 必须使用ipv4 或者 ipv6, 否则无法推流
>  - 192.168.31.91 ===》 https://srs4.openjianghu.org/srs/httpApiProxy ====> webrtc://47.243.6.203:18000

## 本地调试（使用开源江湖的 srs）
**打开浏览器访问**: http://127.0.0.1:7015/public/one2oneAudio.html?autostart=true&host=srs4.openjianghu.org
> 备注: 
>  - srs4.openjianghu.org ===》 https://srs4.openjianghu.org/srs/httpApiProxy ====> webrtc://47.243.6.203:18000/live/2ae7abd



webrtc://srs4.openjianghu.org/live/colin1

./ffmpeg -f flv -i rtmp://127.0.0.1:11935/live/colin1 -f flv -i rtmp://127.0.0.1:11935/live/colin2 -filter_complex "[1:v]scale=w=96:h=72[ckout];[0:v][ckout]overlay=x=W-w-10:y=H-h-10[out]" -map "[out]" -c:v libx264 -profile:v high -preset medium -filter_complex amix -c:a aac -f flv -y rtmp://127.0.0.1:11935/live/colin