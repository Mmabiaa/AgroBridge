
// Guidance for Twi Audio Replies:
// 1. Record clear .wav files for each common Twi response.
// 2. Name files consistently, e.g., 001_tomato_leaf_curl.wav, 002_maize_fertilizer.wav, etc.
// 3. Place all files in /public/audio/twi/.
// 4. Map English answer text to audio file path in twiAudioMap in AgriGPT.tsx.
// 5. To add more, record new clips, save in /public/audio/twi/, and update the mapping.

import { Bot, User } from 'lucide-react';
import { useRef } from 'react';

interface ChatMessageProps {
  id: number;
  type: 'user' | 'bot';
  message: string;
  time: string;
  audio?: string; // Add optional audio prop
  image?: string; // Add optional image prop
  showPlayButton?: boolean; // NEW: show play button for TTS
  onPlayTTS?: () => void; // NEW: handler for play button
}

function speakEnglish(text: string, userInitiated = false) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utter = new window.SpeechSynthesisUtterance(text);
    utter.lang = 'en-US';
    window.speechSynthesis.speak(utter);
  }
}

export function ChatMessage({ type, message, time, audio, image, showPlayButton, onPlayTTS }: ChatMessageProps) {
  // Show TTS play button for all bot messages without pre-recorded audio
  const canSpeak = type === 'bot' && !audio;

  const handleSpeak = () => {
    if (onPlayTTS) {
      onPlayTTS();
    } else {
      speakEnglish(message, true);
    }
  };

  return (
    <div className={`flex ${type === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex items-start gap-3 max-w-[85%] ${type === 'user' ? 'flex-row-reverse' : ''}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          type === 'user' 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-gradient-primary text-primary-foreground shadow-glow'
        }`}>
          {type === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </div>

        {/* Message Bubble */}
        <div className={`relative p-4 rounded-2xl shadow-soft transition-all duration-300 hover:shadow-strong ${
          type === 'user'
            ? 'bg-primary text-primary-foreground rounded-tr-sm'
            : 'bg-card text-card-foreground border rounded-tl-sm'
        }`}>
          <p className="text-sm leading-relaxed whitespace-pre-line">{message}</p>
          {/* Audio player for bot messages with audio */}
          {type === 'bot' && audio && (
            <audio controls src={audio} className="mt-2 w-full">
              Your browser does not support the audio element.
            </audio>
          )}
          {/* TTS play button for all bot messages without pre-recorded audio */}
          {(canSpeak && (showPlayButton || showPlayButton === undefined)) && (
            <button
              onClick={handleSpeak}
              className="mt-2 px-3 py-1 bg-primary/10 text-primary rounded hover:bg-primary/20 transition"
              title="Play audio"
            >
              🔊 Play
            </button>
          )}
          {/* Image preview for user or bot messages */}
          {image && (
            <img src={image} alt="attachment" className="mt-2 max-h-40 rounded shadow border" />
          )}
          <p className={`text-xs mt-2 ${
            type === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
          }`}>
            {time}
          </p>
          {/* Message tail */}
          <div className={`absolute top-4 w-0 h-0 ${
            type === 'user' 
              ? 'right-0 translate-x-full border-l-8 border-l-primary border-t-4 border-b-4 border-t-transparent border-b-transparent'
              : 'left-0 -translate-x-full border-r-8 border-r-card border-t-4 border-b-4 border-t-transparent border-b-transparent'
          }`} />
        </div>
      </div>
    </div>
  );
}
