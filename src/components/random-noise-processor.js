// random-noise-processor.js
class RandomNoiseProcessor extends AudioWorkletProcessor {
  
  process(inputs, outputs, parameters) {
    // console.log(outputs);
    const output = outputs[0];
    const input = inputs[0]
    // console.log(new AudioBuffer()); Audio API都用不了。。
    // 想通过Audio API异步操作实时流的方案也行不通
    try {
      for (let channel = 0; channel < output.length; channel++) {
            const inputData = input[channel];
            const outputData = output[channel];
            for (let i = 0; i < inputData.length; i++) {
              outputData[i] = Math.random(1) * 2 - 1;
            }
          }
    } catch(e) {
      console.log(e);
    }
    
    return true;
  }
}

registerProcessor("random-noise-processor", RandomNoiseProcessor);
