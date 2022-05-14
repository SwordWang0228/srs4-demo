# SRS服务器部署
SRS服务以及相关服务通过docker部署在云服务器上。
## 运行SRS服务

```
docker run --rm -p 1935:1935 -p 1985:1985 -p 8080:8080 --env CANDIDATE="47.242.123.251" -p 8000:8000/udp ossrs/srs:4 ./objs/srs -c conf/rtc2rtmp.conf 
```

- 其中CANDIDATE为外网可访问的地址，如云服务器上需要配置云服务的外网ip

## 运行信令服务
```
docker run --rm -p 1989:1989 registry.cn-hangzhou.aliyuncs.com/ossrs/signaling:v1.0.5
```
- 信令服务用于实现一对一聊天和多对多聊天

## HTTP特殊配置
  1. 需要将目录/rtc代理到 http://127.0.0.1:1985 用于实现webrtc链接



```
#PROXY-START/rtc
location /rtc
{
    proxy_pass http://127.0.0.1:1985;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header REMOTE-HOST $remote_addr;
    add_header X-Cache $upstream_cache_status;
    #Set Nginx Cache
    	add_header Cache-Control no-cache;
}
#PROXY-END/rtc
```

2. 需要将目录/sig代理到http://127.0.0.1:1989 用于实现与信令服务通信并实现wss转ws。

```
#PROXY-START/sig

location /sig
{
    proxy_pass http://127.0.0.1:1989;
    proxy_http_version 1.1;
    proxy_read_timeout 3600s;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}

#PROXY-END/sig
```
