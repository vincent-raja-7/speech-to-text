import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-speech-recognition',
  templateUrl: './speech-recognition.component.html',
  styleUrls: ['./speech-recognition.component.css']
})
export class SpeechRecognitionComponent {
  transcript: string = '';
  isRecording: boolean = false;
  recognition: any;
  audioContext!: AudioContext;
  analyser!: AnalyserNode;
  voiceMeterBars: number[] = new Array(20).fill(0);

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (isPlatformBrowser(this.platformId)) {
      const { webkitSpeechRecognition }: any = window;
      this.recognition = new webkitSpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.lang = 'en-IN';
      this.recognition.interimResults = false;

      this.recognition.onresult = (event: any) => {
        this.transcript = event.results[0][0].transcript;
        this.isRecording = false;
        this.stopMeter();
      };

      this.recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        this.isRecording = false;
        this.stopMeter();
      };

      this.recognition.onend = () => {
        this.isRecording = false;
        this.stopMeter();
      };
    }
  }

  startRecording() {
    if (!this.isRecording && this.recognition) {
      this.isRecording = true;
      this.transcript = '';
      this.recognition.start();
      this.initializeMeter();
    }
  }

  stopRecording() {
    if (this.isRecording && this.recognition) {
      this.isRecording = false;
      this.recognition.stop();
      this.stopMeter();
    }
  }

  initializeMeter() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn('Audio context not supported');
      return;
    }

    this.audioContext = new AudioContext();
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      const source = this.audioContext.createMediaStreamSource(stream);
      this.analyser = this.audioContext.createAnalyser();
      source.connect(this.analyser);
      this.analyser.fftSize = 32;

      this.updateMeter();
    });
  }

  updateMeter() {
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

    const animateBars = () => {
      if (this.isRecording) {
        this.analyser.getByteFrequencyData(dataArray);
        this.voiceMeterBars = Array.from(dataArray).slice(0, 20).map(value => (value / 255) * 100);
        requestAnimationFrame(animateBars);
      }
    };

    animateBars();
  }

  stopMeter() {
    if (this.audioContext) {
      this.audioContext.close();
    }
    this.voiceMeterBars.fill(0);
  }
}
