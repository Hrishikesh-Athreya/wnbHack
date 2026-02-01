import { useState, useRef, useCallback } from "react";

interface AudioPlayerResult {
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    play: (src: string) => Promise<void>;
    pause: () => void;
    stop: () => void;
    error: string | null;
}

export function useAudioPlayer(): AudioPlayerResult {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const resolveRef = useRef<(() => void) | null>(null);

    const play = useCallback((src: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            // Stop any existing audio
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }

            const audio = new Audio(src);
            audioRef.current = audio;
            resolveRef.current = resolve;

            audio.onloadedmetadata = () => {
                setDuration(audio.duration);
            };

            audio.ontimeupdate = () => {
                setCurrentTime(audio.currentTime);
            };

            audio.onplay = () => {
                setIsPlaying(true);
                setError(null);
            };

            audio.onended = () => {
                setIsPlaying(false);
                setCurrentTime(0);
                if (resolveRef.current) {
                    resolveRef.current();
                    resolveRef.current = null;
                }
            };

            audio.onerror = () => {
                setIsPlaying(false);
                setError("Failed to load audio");
                reject(new Error("Failed to load audio"));
            };

            audio.play().catch((e) => {
                setError("Playback failed");
                setIsPlaying(false);
                reject(e);
            });
        });
    }, []);

    const pause = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
        }
    }, []);

    const stop = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            audioRef.current = null;
            setIsPlaying(false);
            setCurrentTime(0);
            if (resolveRef.current) {
                resolveRef.current();
                resolveRef.current = null;
            }
        }
    }, []);

    return {
        isPlaying,
        currentTime,
        duration,
        play,
        pause,
        stop,
        error,
    };
}
