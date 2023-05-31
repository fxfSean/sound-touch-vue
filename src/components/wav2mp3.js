
export function changeFormat(recorderData){
  importScripts('lame.all.js')

  // new Int16Array(this.recorder.getWAV().buffer) 取录音的buffer
  const channels = 1; //1 单声道 2 立体声
  const sampleRate = 44100; //44.1khz
  const kbps = 128; //128kbps mp3
  var mp3encoder = Mp3Encoder(channels, sampleRate, kbps);
  var mp3Data = [];
  var samples = new Int16Array(recorderData.buffer); // 从源中获取数据
  const sampleBlockSize = 1152; //576的倍数
  for (var i = 0; i < samples.length; i += sampleBlockSize) {
    var sampleChunk = samples.subarray(i, i + sampleBlockSize);
    var mp3buf = mp3encoder.encodeBuffer(sampleChunk);
    if (mp3buf.length > 0) {
        mp3Data.push(mp3buf);
    }
  }
  var mp3buf = mp3encoder.flush();   //finish writing mp3
  if (mp3buf.length > 0) {
      mp3Data.push(new Int8Array(mp3buf));
  }
  var blob = new Blob(mp3Data, {type: 'audio/mp3'});
  return blob;
}
