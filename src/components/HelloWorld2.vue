<script>
import { ref } from "vue";
import {SoundTouch, PitchShifter} from 'soundtouchjs';
import { changeFormat } from './wav2mp3'

  export default {
    setup() {
      const audioSrc = ref("src/assets/sample_orig.mp3")
      const audio = ref("")
      const value = ref(1)
      let shifter
      let stream
      let totalBuffer
      let recording = false
      let chunks = []

    
      const play = ()=> {
        
        const url = audioSrc.value

        const request = new XMLHttpRequest()
        request.open('GET', url, true)
        request.responseType = 'arraybuffer'

        request.onload = function() {
          const audioData = request.response
          // context.decodeAudioData(audioData, function(buffer) {
          //   // buffer 包含音频数据
          //   console.log(buffer)
            
          // })
          const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const gainNode = audioCtx.createGain();

            // here you retrieved your file with 'fetch' or a new instance of the 'FileReader', and from the data...
            if (shifter) {
              shifter.off(); // remove any current listeners
            }
            audioCtx.decodeAudioData(audioData, (audioBuffer) => {
              console.log(audioBuffer);
              console.log(11);


              shifter = new PitchShifter(audioCtx, audioBuffer, 1024);
              shifter.on('play', (detail) => {
                console.log(detail);
              });
              shifter.tempo = 2;
              shifter.pitch = 2;
              shifter.pitchSemitones = 0.3
              
            });

            setTimeout(()=> {
              shifter.connect(gainNode); // connect it to a GainNode to control the volume
              gainNode.connect(audioCtx.destination); // attach the GainNode to the 'destination' to begin playback
            }, 2000)
            
        }

        request.send()
      // audio.value.play()
    }

    const voiceChanger = async () => {
      recording = true
      const audioContext = new AudioContext();
      stream = await navigator.mediaDevices
              .getUserMedia({
                audio: true,
                video: false
              })
              .catch((err) => {
                console.error(`The following error occured: ${err}`);
              });

      const sourceNode = audioContext.createMediaStreamSource(stream);
        
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processor.onaudioprocess = async event => {
        if (!recording) return
        const inputBuffer = event.inputBuffer;
        const outputBuffer = event.outputBuffer;

        shifter = new PitchShifter(audioContext, inputBuffer, 1024);
              shifter.on('play', (detail) => {
                console.log(detail);
              });
              shifter.tempo = 1;
              shifter.pitch = 1;
              shifter.pitchSemitones = 4
              shifter.connect(audioContext.destination)
      }
      sourceNode.connect(processor)
      processor.connect(audioContext.destination)

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
        const samples = inputBuffer.getChannelData(0);

      if (!value.value) return
      const renderedBuffer = await playSample(inputBuffer, value.value, audioContext)
      console.log(renderedBuffer);
      console.log('11111');
      // playRendered(renderedBuffer, audioContext)
      outputBuffer.copyToChannel(renderedBuffer, 0);
      };

      sourceNode.connect(processor);
      processor.connect(audioContext.destination)
      // sourceNode.connect(distortion)
      // distortion.connect(audioContext.destination);   
    }

    function playRendered(sample, context) {
      const source = context.createBufferSource()
      source.buffer = sample;
      source.playbackRate.value = 0.6;
      source.connect(context.destination);
      source.start();
    }

    function playSample(sample, rate, context) {
      const offlineCtx = new OfflineAudioContext(1, sample.duration * context.sampleRate, context.sampleRate);
      const source = offlineCtx.createBufferSource()
      source.buffer = sample;
      source.playbackRate.value = 1.5;
      source.connect(offlineCtx.destination);
      source.start();
      return offlineCtx.startRendering()
    }

      const speekStop = () => {
        recording = false
        const blob = new Blob(chunks, {type: 'audio/wav'})
        // const mp3Blob = changeFormat(blob)
        // saveBlobAsFile(mp3Blob, 'recording.mp3')
        stream.getTracks().forEach(function(track){
          console.log(track);
          console.log('停止：', track);
          track.stop()
        })
      }
      const saveBlobAsFile = (blob, filename) => {
        const audio = new Audio();
        audio.src = URL.createObjectURL(blob);
        audio.type = 'audio/mp3';
        audio.controls = true;
        document.body.appendChild(audio);

        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = filename;
        anchor.click();
        URL.revokeObjectURL(url);
      }

    const onChange = (value) => {
      console.log('当前值：' + value);
    }
    const up =() => {
      value.value = value.value + 1
      shifter.pitchSemitones = value.value

    }
    const down = () => {
      value.value = value.value - 1
      shifter.pitchSemitones = value.value
    }
    const pause = () => {
      audio.value.pause()
    }
    const onPlay =() => {
      console.log('播放中...')
    }
    const onPause =() => {
      console.log('已暂停。')
    }
      return {
        audioSrc,
        audio,
        play,
        speek,
        voiceChanger,
        speekStop,
        pause,
        onPause,
        onPlay,
        value,
        up,
        down,
        onChange
      }
    }
  }


</script>

<template>
  <div>
    <audio ref="audio" :src="audioSrc" @play="onPlay" @pause="onPause"></audio>
    <button @click="play">播放</button>
    <button @click="speek">录音</button>
    <button @click="voiceChanger">变声</button>
    <button @click="speekStop">停止录音</button>

    <button @click="pause">暂停</button>
    <button @click="up">增加</button>
    <button @click="down">降低</button>
    <van-slider v-model="value"
      :min="0"
      :max="2"
      :step="0.1"
     @change="onChange" />
    <input v-model="value"/>
    <div>音调： {{ value }}</div>
  </div>
</template>

<style scoped>
.read-the-docs {
  color: #888;
}
.van_slider {
  width: 200px;
  height: 3px;
}
</style>
