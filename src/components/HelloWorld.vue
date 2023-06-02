<script>
import { ref } from "vue";
import {SoundTouch, PitchShifter} from 'soundtouchjs';
import { changeFormat } from './wav2mp3'
import { Jungle } from './jungle'

  export default {
    setup() {
      const audioSrc = ref("src/assets/sample_orig.mp3")
      const value = ref(1)
      let shifter
      let stream
      let totalBuffer
      let recording = false
      let chunks = []
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
      const play = ()=> {
        
        const url = audioSrc.value

        const request = new XMLHttpRequest()
        request.open('GET', url, true)
        request.responseType = 'arraybuffer'

        request.onload = function() {
          const audioData = request.response
          const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const gainNode = audioCtx.createGain();

            // here you retrieved your file with 'fetch' or a new instance of the 'FileReader', and from the data...
            if (shifter) {
              shifter.off(); // remove any current listeners
            }
            audioCtx.decodeAudioData(audioData, (audioBuffer) => {
              let source = audioCtx.createBufferSource();
              source.buffer = audioBuffer;
              source.playbackRate.value = 2;
              source.connect(audioCtx.destination);
              source.loop = true;
              source.start(0);
              
              // shifter = new PitchShifter(audioCtx, audioBuffer, 1024);
              // shifter.on('play', (detail) => {
              //   console.log(detail);
              // });
              // shifter.tempo = 1;
              // shifter.pitch = 1;
              // shifter.pitchSemitones = value.value
              
            });

            setTimeout(()=> {
              shifter.connect(gainNode); // connect it to a GainNode to control the volume
              gainNode.connect(audioCtx.destination); // attach the GainNode to the 'destination' to begin playback
            }, 200)
        }
        request.send()
    }

    const oscillator = () => {
      // create web audio api context
      var audioCtx = new (window.AudioContext || window.webkitAudioContext)();

      // create Oscillator node
      var oscillator = audioCtx.createOscillator();

      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(200, audioCtx.currentTime); // value in hertz
      oscillator.connect(audioCtx.destination);
      oscillator.start();
    }

    const gain = () => {
      var oscillator = audioContext.createOscillator();
      oscillator.frequency.setValueAtTime(150, audioContext.currentTime); // value in hertz


      var gain = audioContext.createGain();

      oscillator.connect(gain);
      gain.connect(audioContext.destination);

      var now = audioContext.currentTime;

      gain.gain.setValueAtTime(1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      oscillator.start(now);
      oscillator.stop(now + 0.5);
    }

    const snare = () => {
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

      let time = audioContext.currentTime
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

    const audioprocess = async () => {
      const audioContext = new AudioContext();

      stream = await navigator.mediaDevices
        .getUserMedia({ audio: true})
        .catch(function (error) {
          console.log(error);
        });

      const sourceNode = audioContext.createMediaStreamSource(stream);

      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processor.onaudioprocess = async event => {
        const inputBuffer = event.inputBuffer;
        // const renderedBuffer = await playSample(inputBuffer, audioContext)
        
        const outputSource = audioContext.createMediaStreamDestination();
        const audioBuffer = audioContext.createBufferSource();
        audioBuffer.buffer = inputBuffer;
        audioBuffer.playbackRate.value = 0.6
        audioBuffer.connect(outputSource);
        audioBuffer.start();

        // 返回新的 MediaStream
        const newStream = outputSource.stream;
        const node = audioContext.createMediaStreamSource(newStream)
        node.connect(audioContext.destination)
      };
      sourceNode.connect(processor);
      processor.connect(audioContext.destination)
    }
   
    const worklet = async () => {
      const audioContext = new AudioContext();

      await audioContext.audioWorklet.addModule("src/components/random-noise-processor.js");
      
      const randomNoiseNode = new AudioWorkletNode(
        audioContext,
        "random-noise-processor", {
          // 传参只能传可序列化对象，想把audioContext传过去也传不了
          processorOptions: {
            someUsefulVariable: new Map([
              [1, '1'],
              [2, "two"],
            ]),
        },
        }
      );
      stream = await navigator.mediaDevices
        .getUserMedia({ audio: true})
        .catch(function (error) {
          console.log(error);
        });

        const sourceNode = audioContext.createMediaStreamSource(stream);

      sourceNode.connect(randomNoiseNode);
      randomNoiseNode.connect(audioContext.destination)

    }

    const newStream = () => {
        // 获取音频流
        var audioContext = new AudioContext();
        navigator.mediaDevices.getUserMedia({ audio: true })
          .then(function(stream) {

            // 创建一个AudioContext对象

            // 创建一个MediaStreamAudioSourceNode对象
            var source = audioContext.createMediaStreamSource(stream);
            console.log(stream);
            // 创建一个音调器
            var audioprocess = audioContext.createScriptProcessor(2048, 1, 1);

            // 在音调器的回调函数中实现音调变换
            audioprocess.onaudioprocess = async function(event) {
              let inputBuffer = event.inputBuffer;
              let outputBuffer = event.outputBuffer;
              inputBuffer = await playSample(inputBuffer, value.value, audioContext)

              for (var channel = 0; channel < 1; channel++) {
                var inputData = inputBuffer.getChannelData(channel);
                console.log(inputData);
                var outputData = outputBuffer.getChannelData(channel);
                for (var sample = 0; sample < inputBuffer.length; sample++) {
                  outputData[sample] = inputData[sample]; // 将音调乘以2
                }
              }
            };

            // 创建一个MediaStreamAudioDestinationNode对象
            var destination = audioContext.createMediaStreamDestination();

            // 将音源连接到音调器
            // 将音调器连接到输出
            audioprocess.connect(destination);
            source.connect(audioprocess);
            // 将处理后的音频流包装成MediaStream对象并将其返回
            var processedStream = destination.stream;

            // 将原始音频流的音轨添加到MediaStream对象中
            processedStream.addTrack(stream.getAudioTracks()[0]);

            // 将处理后的音频流返回
            return processedStream;

          })
          .then(function(processedStream) {
            console.log(processedStream);
            // 将处理后的音频流播放出来
            var audioElement = document.createElement('audio');
            audioElement.srcObject = processedStream;
            audioElement.play();
            // const node = audioContext.createMediaStreamSource(processedStream)
            // node.connect(audioContext.destination)
          })
          .catch(function(err) {
            console.log('Error: ' + err);
          });

    }
    
    const speek = async () => {
      recording = true
      const audioContext = new AudioContext();

      stream = await navigator.mediaDevices
        .getUserMedia({ audio: true})
        .catch(function (error) {
          console.log(error);
        });
      
        const sourceNode = audioContext.createMediaStreamSource(stream);
        
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processor.onaudioprocess = async event => {
        if (!recording) return
        const inputBuffer = event.inputBuffer;
        const outputBuffer = event.outputBuffer;
        console.log(inputBuffer);
        console.log(22222);
        const samples = inputBuffer.getChannelData(0);
        console.log(samples);
        

      if (!value.value) return
      const renderedBuffer = await playSample(inputBuffer, value.value, audioContext)
      const samples2 = renderedBuffer.getChannelData(0);
      // for (let channel = 0; channel < outputBuffer.numberOfChannels; channel++) {
      //     const inputData = renderedBuffer.getChannelData(channel);
      //     const outputData = outputBuffer.getChannelData(channel);
      //     for (let i = 0; i < inputData.length; i++) {
      //       outputData[i] = inputData[i];
      //     }
      //   }
      // await setTimeout(() => {
      //   console.log(' ');
      //   outputBuffer.copyToChannel(samples, 0);

      // }, 200);
      const bfs = audioContext.createBufferSource()
      bfs.buffer = renderedBuffer
      bfs.connect(audioContext.destination)
      bfs.start()
      console.log(JSON.stringify(samples2));
      console.log('11111');
      // playRendered(renderedBuffer, audioContext)
      // outputBuffer.copyToChannel(samples2, 0);
      };

      sourceNode.connect(processor);
      processor.connect(audioContext.destination)
      // sourceNode.connect(distortion)
      // distortion.connect(audioContext.destination);   
    }

    var lpInputFilter=null;
    var effectInput = null,
      wetGain = null,
      dryGain = null,
      outputMix = null,
      currentEffectNode = null;
    const jungle = async () => {
      var audioInput = null,

      stream = await navigator.mediaDevices
        .getUserMedia({ audio: true})
        .catch(function (error) {
          console.log(error);
        });
      var input = audioContext.createMediaStreamSource(stream);
      audioInput = convertToMono( input );

      if (true) {
          audioInput.connect( createLPInputFilter() );
          audioInput = lpInputFilter;
      }
      outputMix = audioContext.createGain();
      dryGain = audioContext.createGain();
      wetGain = audioContext.createGain();
      effectInput = audioContext.createGain();
      audioInput.connect(dryGain);
      audioInput.connect(effectInput);
      dryGain.connect(outputMix);
      wetGain.connect(outputMix);
      outputMix.connect( audioContext.destination);
      crossfade(1.0)
      currentEffectNode = createPitchShifter();
      audioInput.connect(currentEffectNode)

    }
    function crossfade(value) {
      // equal-power crossfade
      var gain1 = Math.cos(value * 0.5*Math.PI);
      var gain2 = Math.cos((1.0-value) * 0.5*Math.PI);

      dryGain.gain.value = gain1;
      wetGain.gain.value = gain2;
    }

    function createPitchShifter() {
      let effect = new Jungle( audioContext );
      effect.output.connect( wetGain );
      effect.setPitchOffset(-0.7)
      return effect.input;
    }


    function convertToMono( input ) {
      var splitter = audioContext.createChannelSplitter(2);
      var merger = audioContext.createChannelMerger(2);

      input.connect( splitter );
      splitter.connect( merger, 0, 0 );
      splitter.connect( merger, 0, 1 );
      return merger;
    }
    function createLPInputFilter() {
      lpInputFilter = audioContext.createBiquadFilter();
      lpInputFilter.frequency.value = 2048;
      return lpInputFilter;
    }

    function playRendered(sample, context) {
      const source = context.createBufferSource()
      source.buffer = sample;
      source.playbackRate.value = 0.6;
      source.connect(context.destination);
      source.start();
    }

    function playSample(sample, context) {
      const offlineCtx = new OfflineAudioContext(1, sample.duration * context.sampleRate, context.sampleRate);
      const source = offlineCtx.createBufferSource()
      source.buffer = sample;
      source.playbackRate.value = 0.7;
      source.connect(offlineCtx.destination);
      source.start();
      return offlineCtx.startRendering()
    }
    const trackProcessor = async () => {
      stream = await navigator.mediaDevices
        .getUserMedia({ audio: true})
        .catch(function (error) {
          console.log(error);
        });
      const videoTrack = stream.getVideoTracks()[0];

      const trackProcessor = new MediaStreamTrackProcessor({ track: videoTrack });
      const trackGenerator = new MediaStreamTrackGenerator({ kind: "video" });

      const transformer = new TransformStream({
        async transform(videoFrame, controller) {
          const barcodes = await detectBarcodes(videoFrame);
          const newFrame = highlightBarcodes(videoFrame, barcodes);
          videoFrame.close();
          controller.enqueue(newFrame);
        },
      });

      trackProcessor.readable
        .pipeThrough(transformer)
        .pipeTo(trackGenerator.writable);

    }
    const onChange = (value) => {
      shifter.pitchSemitones = value
    }
    return {
      play,
      oscillator,
      gain,
      snare,
      speek,
      jungle,
      trackProcessor,
      newStream,
      audioprocess,
      value,
      whiteNoise,
      worklet,
      onChange
    }
    }
  }


</script>

<template>
  <div class="container">
    <button @click="play">soundTouch</button>
    <button @click="oscillator">震荡器</button>
    <button @click="gain">增益</button>
    <button @click="snare">军鼓</button>
    <button @click="speek">speek</button>
    <button @click="audioprocess">audioprocess</button>
    <button @click="newStream">新声音流</button>
    <button @click="worklet">worklet</button>
    <button @click="jungle">jungle</button>
    <button @click="trackProcessor">trackProcessor</button>
    <button @click="whiteNoise">白噪声</button>

    <van-slider v-model="value"
      class="slider"
      :min="0"
      :max="2"
      :step="0.1"
     @change="onChange" />
    <input v-model="value"/>
    <div>音调： {{ value }}</div>
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
