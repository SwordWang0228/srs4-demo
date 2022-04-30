import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';
import 'package:intl/intl.dart';

import 'package:flutter/material.dart';
import 'package:md_audio_websocket/DelayDetection.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:webview_flutter/webview_flutter.dart';
import 'sound_stream/sound_stream.dart';

Future<void> main() async {
  runApp(const MyApp());
}

const int CHANNEL_OUT_MONO = 4;

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  // This widget is the root of your application.
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Flutter Demo',
      theme: ThemeData(
        primarySwatch: Colors.blue,
      ),
      home: const MyHomePage(),
    );
  }
}

class MyHomePage extends StatefulWidget {
  const MyHomePage({Key? key}) : super(key: key);

  @override
  State<MyHomePage> createState() => _MyHomePageState();
}

class _MyHomePageState extends State<MyHomePage> {
  final int tSampleRate = 44000;
  final RecorderStream _recorder = RecorderStream();
  final PlayerStream _player = PlayerStream();

  bool _isRecording = false;
  bool _isPlaying = false;

  StreamSubscription? _recorderStatus;
  StreamSubscription? _playerStatus;
  StreamSubscription? _audioStream;

  IO.Socket? socket;

  late WebViewController webViewController;

  late String sampleRate;

  String? loginId;

  late StateSetter infomationState;

  String? onAudioString;
  String? emitAudioString;

  DateTime? syncReqestTime;

  DateTime? syncSendResponseTime;
  DateTime? syncResponseTime;

  @override
  void initState() {
    // TODO: implement initState
    super.initState();
    if (Platform.isAndroid) WebView.platform = SurfaceAndroidWebView();
    initSocket();
    initRecorder();
  }

  @override
  void dispose() {
    stopRecord();
    socket?.dispose();
    _recorderStatus?.cancel();
    _playerStatus?.cancel();
    _audioStream?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("音频直播"),),
      body: SafeArea(
          child: Stack(
        children: [
          WebView(
            initialUrl: 'https://audio-ws.openjianghu.org/',
            javascriptMode: JavascriptMode.unrestricted,
            onWebViewCreated: (WebViewController _webViewController) {
              webViewController = _webViewController;
            },
            onProgress: (int progress) async {},
            javascriptChannels: <JavascriptChannel>{
              JavascriptChannel(
                  name: 'audioWsApp',
                  onMessageReceived: (JavascriptMessage message) async {
                    print(">>>>>> message ${jsonDecode(message.message)}");
                    Map result = jsonDecode(message.message);
                    if (result['action'] == 'login') {
                      if (result['value'] != null && result['value'] != '') {
                        webViewController.runJavascript("alert('登录成功')");
                        String audioMode = "var username = document.createElement(\"div\");"
                            "username.innerHTML = \"登录用户：${result['value']}\";"
                            "document.body.children[1].after(username);";
                        webViewController.runJavascript(audioMode);
                        socket!.emit('login', {"userName": result['value']});
                        loginId = result['value'];
                      } else {
                        webViewController.runJavascript("alert('登录失败')");
                      }
                    }
                    if (result['action'] == 'audioMode') {
                      if (result['value'] == 'live') {
                        sampleRate = "48000";
                      } else if (result['value'] == 'call') {
                        sampleRate = "24000";
                      } else {
                        sampleRate = "8000";
                      }
                      String sampleRateDiv = "var sampleRate = document.getElementById('sampleRateDiv');"
                          "if(!sampleRate) { sampleRate = document.createElement(\"div\");"
                          "document.getElementById(\"audio_mode\").after(sampleRate);"
                          "sampleRate.id = 'sampleRateDiv';}"
                          "sampleRate.innerHTML = \"当前采样率：$sampleRate\";";
                      webViewController.runJavascript(sampleRateDiv);
                    }
                    if (result['action'] == 'startComm') {
                      if (loginId == null || loginId == '') {
                        webViewController.runJavascript("alert('请先登录')");
                      } else if (socket?.connected ?? false) {
                        syncReqestTime = DateTime.now();
                        infomationState(() {});
                        Map syncReqest = {'sts': syncReqestTime!.millisecondsSinceEpoch};
                        socket!.emit('SyncReqest', syncReqest);
                        webViewController.runJavascript("document.getElementById('status').innerHTML = 'Connected'");
                        if (!_isRecording) {
                          startRecord();
                        }
                      } else {
                        webViewController.runJavascript("alert('连接失败')");
                      }
                    }
                    if (result['action'] == 'stopComm') {
                      webViewController.runJavascript("document.getElementById('status').innerHTML = 'Disconnected'");
                      if (_isRecording) {
                        stopRecord();
                      }
                    }
                  })
            },
            navigationDelegate: (NavigationRequest request) async {
              return NavigationDecision.navigate;
            },
            onPageStarted: (String url) async {},
            onPageFinished: (String url) async {
              // add meta
              String meta = "var oMeta = document.createElement('meta');"
                  "oMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0,minimum-scale=1.0, user-scalable=0';"
                  "oMeta.name = 'viewport';"
                  "document.getElementsByTagName('head')[0].appendChild(oMeta);";
              await webViewController.runJavascript(meta);
              Future.delayed(const Duration(milliseconds: 300), () async {
                // intercept login and btn
                String loginListener =
                    "document.body.children[1].onclick = (event) => { audioWsApp.postMessage(JSON.stringify({'action': 'login', value: document.getElementById('userName').value})) }";
                await webViewController.runJavascript(loginListener);
                String selectListener =
                    "document.getElementById(\"audio_mode\").onchange = (event) => { audioWsApp.postMessage(JSON.stringify({'action': 'audioMode', value: document"
                    ".getElementById(\"audio_mode\").value})) }";
                await webViewController.runJavascript(selectListener);
                String audioMode = "audioWsApp.postMessage(JSON.stringify({'action': 'audioMode', value: document.getElementById(\"audio_mode\").value}))";
                await webViewController.runJavascript(audioMode);
                String startComm = "document.getElementsByTagName('button')[1].onclick = (event) => { audioWsApp.postMessage(JSON.stringify({'action': 'startComm'})) }";
                await webViewController.runJavascript(startComm);
                String stopComm = "document.getElementsByTagName('button')[2].onclick = (event) => { audioWsApp.postMessage(JSON.stringify({'action': 'stopComm'})) }";
                await webViewController.runJavascript(stopComm);
              });
            },
            gestureNavigationEnabled: true,
          ),
          Positioned(
            child: StatefulBuilder(
              builder: (context, _setState) {
                infomationState = _setState;
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text("SyncLocalRequestTime：$syncReqestTime", style: const TextStyle(fontSize: 14, color: Colors.black, fontWeight: FontWeight.normal)),
                    Text("SyncLocalResponseTime：$syncResponseTime", style: const TextStyle(fontSize: 14, color: Colors.black, fontWeight: FontWeight.normal)),
                    Text("syncSendResponseTime：$syncSendResponseTime", style: const TextStyle(fontSize: 14, color: Colors.black, fontWeight: FontWeight.normal)),
                    Text(
                      "local time diff：${(syncResponseTime?.millisecondsSinceEpoch??0) - (syncReqestTime?.millisecondsSinceEpoch??0)}",
                      style: const TextStyle(fontSize: 14, color: Colors.black, fontWeight: FontWeight.normal),
                    ),
                    Text("收到的流：$onAudioString", style: const TextStyle(fontSize: 14, color: Colors.black, fontWeight: FontWeight.normal)),
                    Text("发送的流：$emitAudioString", style: const TextStyle(fontSize: 14, color: Colors.black, fontWeight: FontWeight.normal)),
                  ],
                );
              },
            ),
            bottom: 10,
            left: 10,
            right: 10,
            height: 250,
          )
        ],
      )),
    );
  }

  Future<void> stopRecord() async {
    await _recorder.stop();
    setState(() {
      _isRecording = false;
    });
  }

  Future<void> startRecord() async {
    await _recorder.start();
    setState(() {
      _isRecording = true;
    });
  }

  Future<void> initRecorder() async {
    _audioStream = _recorder.audioStream.listen((data) {
      int nowTime = DateTime.now().millisecondsSinceEpoch;
      Map audioMsg = {"sts": nowTime, "dts": DelayDetection.ins().getRemoteTime(nowTime), "data": data, "samplerate": "48000"};
      if (socket != null) {
        socket!.emit('audio', audioMsg);
        emitAudioString = "len: ${audioMsg['data'].length}，sendTime: ${DateTime.fromMillisecondsSinceEpoch(nowTime)}，"
            "willTime: ${DateTime.fromMillisecondsSinceEpoch(audioMsg['dts'])}，应延迟：${audioMsg['dts'] - nowTime  - (DelayDetection.ins().localDiffNetwork??0)}ms";
        infomationState(() {});
      }
    });

    _recorderStatus = _recorder.status.listen((status) {
      if (mounted) {
        setState(() {
          _isRecording = status == SoundStreamStatus.Playing;
        });
      }
    });

    _playerStatus = _player.status.listen((status) {
      print("_playerStatus $status");
      if (mounted) {
        setState(() {
          _isPlaying = status == SoundStreamStatus.Playing;
        });
      }
    });

    await Future.wait([_recorder.initialize(), _player.initialize(), _player.start()]);
  }

  void _play() async {
    await _player.start();
  }

  void initSocket() {
    socket = IO.io('https://audio-ws.openjianghu.org/', IO.OptionBuilder().enableForceNew().enableAutoConnect().setTransports(['websocket']).setTimeout(5000).build());
    socket!.onConnect((_) {
      setState(() {});
    });
    socket!.onDisconnect((_) => print('disconnect'));
    //
    // socket!.on('SyncReqest', (msg) {
    //   print('>>>>> SyncReqest ${msg} >>>>>>');
    //   int nowTime = DateTime.now().millisecondsSinceEpoch;
    //   DelayDetection.ins().updateTimestamp(msg['sts'], null, nowTime);
    //   Map syncRespone = {'sts': nowTime};
    //   socket!.emit('SyncResponse', syncRespone);
    // });

    socket!.on('error', (msg) {
      print('>>>>> error $msg >>>>>>');
    });

    socket!.on('SyncResponse', (msg) {
      syncResponseTime = DateTime.now();
      syncSendResponseTime = DateTime.fromMillisecondsSinceEpoch(msg['sts']);
      DelayDetection.ins().updateTimestamp(msg['sts'], null, syncResponseTime!.millisecondsSinceEpoch);
      infomationState(() {});
      print('>>>>> SyncResponse ${msg} >>>>>>');
    });

    socket!.on('audio', (msg) async {
      int nowTime = DateTime.now().millisecondsSinceEpoch;
      DelayDetection.ins().updateTimestamp(msg['sts'], msg['dts'], nowTime);
      _player.writeChunk(msg['data'] as Uint8List);
      onAudioString = "len: ${msg['data'].length}，sendTime: ${DateTime.fromMillisecondsSinceEpoch(msg['sts'])}，"
          "nowTime: ${DateTime.fromMillisecondsSinceEpoch(nowTime)}，延迟：${nowTime - msg['sts'] - (DelayDetection.ins().localDiffNetwork??0)}ms";
      infomationState(() {});
    });
  }

  void stopSocket() {
    socket?.dispose();
  }
}
