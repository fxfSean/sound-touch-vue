<script>
import { ref } from "vue";

  export default {
    setup() {
      const value = ref(1)
      let stream
      let recording = false
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    

    const oscillator = () => {
      // create web audio api audioContext
      var audioCtx = new (window.AudioContext || window.webkitAudioContext)();

      // create Oscillator node
      var oscillator = audioCtx.createOscillator();

      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(200, audioCtx.currentTime); // value in hertz
      oscillator.connect(audioCtx.destination);
      oscillator.start();
    }

    const kick = (time) => {
      console.log('fxf', typeof time == 'object');
      var osc = audioContext.createOscillator();
      osc.frequency.setValueAtTime(150, audioContext.currentTime); // value in hertz

      if (typeof time == 'object') {
        time = audioContext.currentTime
      }
      var gain = audioContext.createGain();

      osc.connect(gain);
      gain.connect(audioContext.destination);

      osc.frequency.setValueAtTime(150, time);
      gain.gain.setValueAtTime(1, time);

      osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);

      osc.start(time);

      osc.stop(time + 0.5);
    }

    const snare = (time) => {
      let noise = audioContext.createBufferSource();
      noise.buffer = noiseBuffer();
      var noiseFilter = audioContext.createBiquadFilter();
      noiseFilter.type = 'highpass';
      noiseFilter.frequency.value = 1000;
      noise.connect(noiseFilter);

      let noiseEnvelope = audioContext.createGain();
      noiseFilter.connect(noiseEnvelope);
      noiseEnvelope.connect(audioContext.destination)

      let osc = audioContext.createOscillator();
      osc.type = 'triangle';

      let oscEnvelope = audioContext.createGain();
      osc.connect(oscEnvelope);
      oscEnvelope.connect(audioContext.destination);
      if (typeof time == 'object') {
        time = audioContext.currentTime
      }
      noiseEnvelope.gain.setValueAtTime(1, time);
      noiseEnvelope.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
      noise.start(time)

      osc.frequency.setValueAtTime(100, time);
      oscEnvelope.gain.setValueAtTime(0.7, time);
      oscEnvelope.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
      osc.start(time)

      osc.stop(time + 0.2);
      noise.stop(time + 0.2);

    }


    var sampleLoader = function(url) {
      var request = new XMLHttpRequest();
      request.open("GET", url, true);
      request.responseType = "arraybuffer";

      request.onload = function() {
        audioContext.decodeAudioData(request.response, function(buffer) {
          window.buffer = buffer;
        });
      };

      request.send();
    };
    sampleLoader('src/assets/hihat.wav');

    const hihat = (time) =>{
      if (typeof time == 'object') {
        time = audioContext.currentTime
      }
      let source = audioContext.createBufferSource();
      source.buffer = window.buffer;
      source.connect(audioContext.destination);
      source.start(time);
    }

    const compose = () => {
      Tone.Transport.bpm.value = 120;

      Tone.Transport.setInterval(function(time){ kick(time) }, "4n");
      Tone.Transport.setInterval(function(time){ snare(time) }, "2n");
      Tone.Transport.setInterval(function(time){ hihat(time) }, "8t");
      Tone.Transport.start();
    }

    function noiseBuffer () {
      var bufferSize = audioContext.sampleRate;
      var buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
      var output = buffer.getChannelData(0);

      for (var i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      return buffer;
    }

    const whiteNoise = () => {
      console.log('whiteNoise');
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const length = 48000; // 1 second of audio data at 44.1 kHz
      const float32ArrayData = new Float32Array(length * 2);

      for (let i = 0; i < float32ArrayData.length; i++) {
        float32ArrayData[i] = Math.random() * 2 - 1; // map to range [-1, 1]
      }
      const frameCount = audioCtx.sampleRate * 2; // 2 seconds

      const ab = new AudioBuffer({length: frameCount, 
        numberOfChannels: 1,
        sampleRate: audioCtx.sampleRate})
      ab.copyToChannel(float32ArrayData, 0)
      const audioBuffer = audioContext.createBufferSource();
      const outputSource = audioContext.createMediaStreamDestination();
      audioBuffer.buffer = ab
      audioBuffer.connect(outputSource)
      audioBuffer.start()
      const newStream = outputSource.stream;
      const node = audioContext.createMediaStreamSource(newStream)
      node.connect(audioContext.destination)
    }

    return {
      oscillator,
      kick,
      snare,
      whiteNoise,
      hihat,
      compose,
    }
    }
  }


</script>

<template>
  <div class="container">
    <button @click="whiteNoise">白噪声</button>
    <button @click="oscillator">震荡器</button>
    <button @click="kick">底鼓</button>
    <button @click="snare">军鼓</button>
    <button @click="hihat">镲</button>
    <button @click="compose">组合</button>



  </div>
</template>

<style scoped>
.container {
}
button {
  margin-top: 10px;
  margin-left: 10px;
}
.read-the-docs {
  color: #888;
}

.slider {
  width: 200px;
  height: 3px;
  margin-top: 20px;
  margin-bottom: 20px;
}
</style>
