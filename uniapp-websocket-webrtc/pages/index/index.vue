<template>
	<view>


		<web-view :webview-styles="webviewStyles" src="https://srs4.duoxing.org/test/m1.html"></web-view>

		<!-- <video id="videoElement" class="centeredVideo" x5-video-player-type='h5-page' controls autoplay width="1024" height="576">Your -->
		<!-- browser is too old which doesn't support HTML5 video.</video> -->
		<!-- 		<view id="myPlayer">
			
		</view>	 -->
		<!-- 		<button @click="flv_start()">开始</button>
		<button @click="flv_pause()">暂停</button>
		<button @click="flv_destroy()">停止</button>
		<button @click="flv_seekto()">跳转</button> -->
	</view>
</template>

<script>
	export default {
		data() {
			return {
				enableProgressGesture: false,
				autoplay: true,
				showPlayBtn: false,
				showCenterPlayBtn: false,
				showFullscreenBtn: false,
				controls: false,
				windowWidth: '',
				windowHeight: '',
				flvPlayer: null,
				player: null,
				"rtmpUrl": "rtmp://play.jyzqd.com/shoucqApp/user60?auth_key=1614590810-0-0-cb3d750e0de978cde317f746d0d660cc",
				"flvUrl": "http://play.jyzqd.com/shoucqApp/user60.flv?auth_key=1614590810-0-0-cb4508a7bd12cf62af314646b821257d",
				"m3u8Url": "http://play.jyzqd.com/shoucqApp/user60.m3u8?auth_key=1614590810-0-0-692d0bc2e21190541101bf468db28273"
			};
		},
		onLoad() {
			console.log('aaaa')
			plus.android.requestPermissions([
				'android.permission.MODIFY_AUDIO_SETTINGS',
				'android.permission.RECORD_AUDIO'
			], function(e) {
				console.log('aaaa1')
				if (e.deniedAlways.length > 0) { // 权限被永久拒绝    
					// 弹出提示框解释为何需要权限，引导用户打开设置页面开启    
					console.log('权限被永久拒绝' + e.deniedAlways.toString())
				}
				if (e.deniedPresent.length > 0) { //权限被临时拒绝    
					// 弹出提示框解释为何需要权限，可再次调用plus.android.requestPermissions申请权限    
					console.log('权限被临时拒绝' + e.deniedPresent.toString());
				}
				console.log('aaaa2')
				if (e.granted.length > 0) { //权限被允许    
					console.log('权限被允许：' + e.granted.toString());
					// #ifdef APP-PLUS  
					let wv = plus.webview.create("", "custom-webview", {
						plusrequire: "none",
						'uni-app': 'none', // 不加载uni-app渲染层框架，避免样式冲突  
						top: uni.getSystemInfoSync().statusBarHeight + 45
					})
					console.log('aaaa3')
					wv.loadURL("https://srs4.duoxing.org/test/m1.html")
					var currentWebview = this.$mp.page.$getAppWebview() //获取当前页面的webview对象
					currentWebview.append(wv);
					console.log('aaa4', wv)
					// #endif  
				}
			})

		},
		mounted() {
			console.log('mounted()')
		},
		methods: {
			getLivePlayer() { // 生成需要的video 组件



				// var player = document.getElementById('videoElement');
				// var player = document.createElement('video')
				// player.id = 'video'
				// player.style = 'width:' + this.windowWidth + 'px;height: '+ this.windowHeight + 'px'
				// player.enableProgressGesture = this.enableProgressGesture
				// player.controls=this.controls
				// player.showCenterPlayBtn=this.showCenterPlayBtn
				// player.showPlayBtn=this.showPlayBtn
				// player.showFullscreenBtn=this.showFullscreenBtn
				// player.x5VideoPlayerType='h5-page'
				// player.x5VideoPlayerFullscreen="false" 
				// player.autoplay=this.autoplay   // 以上均为 video标签的属性配置
				// document.getElementById("myPlayer").appendChild(player);
				// console.log(player)
				// console.log(flvjs.isSupported())
				// if (flvjs.isSupported()) {
				// 	this.flvPlayer = flvjs.createPlayer({
				// 		type: 'flv',
				// 		isLive: true, //<====直播的话，加个这个 
				// 		url: 'http://weapi.lelitao.net:8080/live/111.flv', //<==自行修改
				// 	});
				// 	console.log(this.flvPlayer)
				// 	this.flvPlayer.attachMediaElement(player);
				// 	this.flvPlayer.load(); //加载
				// 	player.play()
				// 	this.flv_start();
				// }
			},
			flv_start() { //开始
				// console.log(this.player)
				// this.player.play()
			},
			flv_pause() { //暂停
				// this.player.pause();
			},
			flv_destroy() { //停止
				// this.player.pause();
				// this.player.unload();
				// this.player.detachMediaElement();
				// this.player.destroy();
				// this.player = null;
			},
			flv_seekto() { // 复制其他人的  我还没用这个
				// this.player.currentTime = parseFloat(document.getElementsByName('seekpoint')[0].value);
			},
		}
	}
</script>

<style lang="scss">

</style>
