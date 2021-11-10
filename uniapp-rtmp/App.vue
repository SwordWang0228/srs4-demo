<template>
	<view>
		<view class="uni-padding-wrap uni-common-mt">
			<view>
				<video id="myVideo" src="rtmp://srs4.duoxing.org/live/livestream" @error="videoErrorCallback"
					controls></video>
			</view>
			<live-pusher id='livePusher' ref="livePusher" class="livePusher"
				url="rtmp://srs4.duoxing.org/live/livestream" mode="SD" :muted="true" :enable-camera="true"
				:auto-focus="true" :beauty="1" whiteness="2" aspect="9:16" @statechange="statechange"
				@netstatus="netstatus" @error="error"></live-pusher>
			<button class="btn" @click="start">开始推流</button>
			<button class="btn" @click="pause">暂停推流</button>
			<button class="btn" @click="resume">resume</button>
			<button class="btn" @click="stop">停止推流</button>
			<button class="btn" @click="snapshot">快照</button>
			<button class="btn" @click="startPreview">开启摄像头预览</button>
			<button class="btn" @click="stopPreview">关闭摄像头预览</button>
			<button class="btn" @click="switchCamera">切换摄像头</button>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				src: '',
				context: null
			}
		},
		onReady: function(res) {
			// #ifndef MP-ALIPAY
			this.videoContext = uni.createVideoContext('myVideo')
			// #endif
			this.$nextTick(() => {
				try {
					this.context = uni.createLivePusherContext("livePusher", this);
					this.context.switchCamera() // 摄像头切换（切换为后置）
					this.context.startPreview() // 摄像头预览 （不加会黑屏）
				} catch (err) {
					uni.showToast({
						title: err,
					})
				}
			})
		},
		methods: {
			videoErrorCallback: function(e) {
				uni.showModal({
					content: e.target.errMsg,
					showCancel: false
				})
			},

			statechange(e) {
				// uni.showToast({
				//  title: "statechange:" + JSON.stringify(e),
				// })
			},
			netstatus(e) {
				// uni.showToast({
				//  title: "netstatus:" + JSON.stringify(e),
				// })
			},
			error(e) {
				console.log("error:" + JSON.stringify(e));
				// uni.showToast({
				//  title: "error:" + JSON.stringify(e),
				//  duration: 0
				// })
			},
			start: function() {
				this.context.start({
					success: (a) => {
						uni.showToast({
							title: "livePusher.start:" + JSON.stringify(a)
						})
						console.log("livePusher.start:" + JSON.stringify(a));
					}
				});
			},
			close: function() {
				this.context.close({
					success: (a) => {
						uni.showToast({
							title: "livePusher.close:" + JSON.stringify(a)
						})
						console.log("livePusher.close:" + JSON.stringify(a));
					}
				});
			},
			snapshot: function() {
				this.context.snapshot({
					success: (e) => {
						console.log(JSON.stringify(e));
						// uni.showToast({
						//  title: JSON.stringify(e)
						// })
					}
				});
			},
			resume: function() {
				this.context.resume({
					success: (a) => {
						console.log("livePusher.resume:" + JSON.stringify(a));
						uni.showToast({
							title: "livePusher.resume:" + JSON.stringify(a)
						})
					}
				});
			},
			pause: function() {
				this.context.pause({
					success: (a) => {
						console.log("livePusher.pause:" + JSON.stringify(a));
						uni.showToast({
							title: "livePusher.pause:" + JSON.stringify(a)
						})
					}
				});
			},
			stop: function() {
				this.context.stop({
					success: (a) => {
						console.log(JSON.stringify(a));
						uni.showToast({
							title: "livePusher.stop:" + JSON.stringify(a)
						})
					}
				});
			},
			switchCamera: function() {
				this.context.switchCamera({
					success: (a) => {
						console.log("livePusher.switchCamera:" + JSON.stringify(a));
						uni.showToast({
							title: "livePusher.switchCamera:" + JSON.stringify(a)
						})
					}
				});
			},
			startPreview: function() {
				this.context.startPreview({
					success: (a) => {
						console.log("livePusher.startPreview:" + JSON.stringify(a));
						uni.showToast({
							title: "livePusher.startPreview:" + JSON.stringify(a)
						})
					}
				});
			},
			stopPreview: function() {
				this.context.stopPreview({
					success: (a) => {
						console.log("livePusher.stopPreview:" + JSON.stringify(a));
						uni.showToast({
							title: "livePusher.stopPreview:" + JSON.stringify(a)
						})
					}
				});
			}
		}
	}
</script>

<style>
</style>
