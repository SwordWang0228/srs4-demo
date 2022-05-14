## srs服务

- 创建`/www/wwwroot/docker-data/srs/conf/rtmp2rtc.conf`
- 启动srs服务: `docker run -d --name srs -v=/www/wwwroot/docker-data/srs/conf/rtmp2rtc.conf:/usr/local/srs/conf/rtmp2rtc.conf -p 1935:1935 -p 1985:1985 -p 8080:8080 --env CANDIDATE="${ipv6}" -p 8000:8000/udp ossrs/srs:latest ./objs/srs -c conf/rtmp2rtc.conf`
    > 注意: WebRTC需要配置 ===》CANDIDATE="ipv6" 
- 开放端口: 8000/UDP

## srs信令服务, Node实现

- 信令服务: websocket 1990
- srs 测试页面: 开启vscode golive; 然后打开 http://127.0.0.1:5500/srs4-demo/signaling/server-srs4/room.html?autostart=true&room=colin&host=${srs服务}&wsh=127.0.0.1&wss=ws&wsp=1990
