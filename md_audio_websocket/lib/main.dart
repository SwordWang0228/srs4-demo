import 'dart:async';
import 'dart:io';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:md_audio_websocket/DelayDetection.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'sound_stream/sound_stream.dart';

Future<void> main() async {
  runApp(const MyApp());
}
const int CHANNEL_OUT_MONO = 4;
// class ResampleParam {
//   int? inputsamples;
//   int? outputsamples;
//   int channels = CHANNEL_OUT_MONO;
//   int sum = 0;
//   double? dis;
//   List<double> databuffer = List.filled(3*CHANNEL_OUT_MONO, 0.0).toList();
// }
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
  List<Uint8List> _micChunks = [];

  bool _isRecording = false;
  bool _isPlaying = false;

  StreamSubscription? _recorderStatus;
  StreamSubscription? _playerStatus;
  StreamSubscription? _audioStream;

  IO.Socket? socket;

  int snCount = 1;


  @override
  void initState() {
    // TODO: implement initState
    super.initState();
    initRecorder();
  }

  @override
  void dispose() {
    socket?.dispose();
    _recorderStatus?.cancel();
    _playerStatus?.cancel();
    _audioStream?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("audio_websocket_demo"),
      ),
      body: Center(child: Container()),
      floatingActionButton: SizedBox(
        height: 100,
        width: MediaQuery.of(context).size.width,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.end,
          children: [

            FloatingActionButton(
              backgroundColor: (socket?.connected ?? false) ? Colors.green : Colors.blue,
              onPressed: () {
                if (_isPlaying) {
                  _player.stop();
                } else {
                  _play();
                }
                setState(() {});
              },
              tooltip: 'socket',
              child: Icon(_isPlaying ? Icons.pause : Icons.play_arrow),
            ),
            const VerticalDivider(
              width: 20,
              color: Colors.transparent,
            ),
            FloatingActionButton(
              backgroundColor: (socket?.connected ?? false) ? Colors.green : Colors.blue,
              onPressed: () {
                if (socket?.connected ?? false) {
                  stopSocket();
                } else {
                  initSocket();
                }
                setState(() {});
              },
              tooltip: 'socket',
              child: Icon((socket?.connected ?? false) ? Icons.link : Icons.link_off),
            ),
            const VerticalDivider(
              width: 20,
              color: Colors.transparent,
            ),
            FloatingActionButton(
              backgroundColor: !_isRecording ? Colors.blue : Colors.red,
              onPressed: () {
                if (!_isRecording) {
                  startRecord();
                } else {
                  stopRecord();
                }
                setState(() {});
              },
              tooltip: 'record',
              child: Icon(!_isRecording ? Icons.record_voice_over : Icons.stop_rounded),
            ),
          ],
        ),
      ), // This trailing comma makes auto-formatting nicer for build methods.
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
    // resampleInit(resampleParam, 44100, 8000, CHANNEL_OUT_MONO);
    int prevTime = DateTime.now().millisecondsSinceEpoch;
    // await _recorder.audioStream.transform().cast<Uint8List>();
    _audioStream = _recorder.audioStream.listen((data) {
      // Float32List pData = data.buffer.asFloat32List();
      // Int16List newData = resampleProcess(resampleParam, pData);

      if (_isPlaying) {
        _player.writeChunk(data);
      } else {
        _micChunks.add(data);
      }

      int nowTime = DateTime.now().millisecondsSinceEpoch;

      print("audioStream ${data}");
      print('>>>>> audio ${nowTime - prevTime}ms send ${data.length} >>>>>>');
      prevTime = nowTime;

      Map audioMsg = {
        "sts": nowTime,
        "dts": DelayDetection.ins().getRemoteTime(nowTime),
        "sn": snCount,
        "data": data,
      };
      snCount++;
      if(socket != null) {
        socket!.emit('audio', audioMsg);
      }
    });

    _recorderStatus = _recorder.status.listen((status) {
      print("_recorderStatus $status");
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

    await Future.wait([
      _recorder.initialize(),
      _player.initialize(),
    ]);
  }

  void _play() async {
    await _player.start();

    if (_micChunks.isNotEmpty) {
      for (var chunk in _micChunks) {
        await _player.writeChunk(chunk);
      }
      _micChunks.clear();
    }
  }

  void initSocket() {
    socket = IO.io('ws://192.168.2.48:3000/',
        IO.OptionBuilder().enableForceNew().enableAutoConnect().setTransports(['websocket']).setTimeout(5000).build());
    socket!.onConnect((_) {
      Map syncReqest = {'sts': DateTime.now().millisecondsSinceEpoch};
      socket!.emit('SyncReqest', syncReqest);
      setState(() { });
    });
    socket!.onDisconnect((_) => print('disconnect'));

    socket!.on('SyncReqest', (msg) {
      print('>>>>> SyncReqest ${msg} >>>>>>');
      int nowTime = DateTime.now().millisecondsSinceEpoch;
      DelayDetection.ins().updateTimestamp(msg['sts'], null, nowTime);
      Map syncRespone = {'sts': nowTime};
      socket!.emit('SyncResponse', syncRespone);
    });

    socket!.on('SyncResponse', (msg) {
      DelayDetection.ins().updateTimestamp(msg['sts'], null, DateTime.now().millisecondsSinceEpoch);
      print('>>>>> SyncResponse ${msg} >>>>>>');
    });

    int prevTime = DateTime.now().millisecondsSinceEpoch;
    socket!.on('audio', (msg) {
      int nowTime = DateTime.now().millisecondsSinceEpoch;
      DelayDetection.ins().updateTimestamp(msg['sts'], msg['dts'], nowTime);
      // print('>>>>> audio ${nowTime - prevTime}ms send ${msg['data'].length} >>>>>>');
      prevTime = nowTime;
      // print('>>>>> audio ${msg} >>>>>>');
      // print('>>>>> audio ${msg['data'].length} >>>>>>');
      // print('>>>>> audio ${msg['data']} >>>>>>');
    });

  }

  void stopSocket() {
    socket?.dispose();
  }
}
