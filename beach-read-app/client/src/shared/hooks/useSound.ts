import { useCallback, useRef, useEffect } from 'react';

type SoundType = 'click' | 'hover' | 'success' | 'tab' | 'paper';

export function useSound() {
    const audioContext = useRef<AudioContext | null>(null);

    useEffect(() => {
        // AudioContext should be created on user interaction, but we can initialize it here
        // and resume it later
        return () => {
            if (audioContext.current) {
                audioContext.current.close();
            }
        };
    }, []);

    const initAudio = useCallback(() => {
        if (!audioContext.current) {
            audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (audioContext.current.state === 'suspended') {
            audioContext.current.resume();
        }
        return audioContext.current;
    }, []);

    const playSound = useCallback((type: SoundType) => {
        const ctx = initAudio();
        const masterGain = ctx.createGain();
        masterGain.connect(ctx.destination);
        
        const now = ctx.currentTime;

        if (type === 'click') {
            // Subtle high-frequency "tick"
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1200, now);
            osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);
            
            gain.gain.setValueAtTime(0.05, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
            
            osc.connect(gain);
            gain.connect(masterGain);
            
            osc.start(now);
            osc.stop(now + 0.05);
        }

        if (type === 'tab') {
            // Soft "slide" or "thud"
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(200, now);
            osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
            
            gain.gain.setValueAtTime(0.03, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
            
            osc.connect(gain);
            gain.connect(masterGain);
            
            osc.start(now);
            osc.stop(now + 0.1);
        }

        if (type === 'paper') {
            // Soft noise for paper texture interaction
            const bufferSize = ctx.sampleRate * 0.1;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            
            const noise = ctx.createBufferSource();
            noise.buffer = buffer;
            
            const filter = ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(1000, now);
            
            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.02, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
            
            noise.connect(filter);
            filter.connect(gain);
            gain.connect(masterGain);
            
            noise.start(now);
            noise.stop(now + 0.1);
        }
    }, [initAudio]);

    return { playSound };
}
