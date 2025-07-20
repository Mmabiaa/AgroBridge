
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Mic, MicOff, Camera, Paperclip } from 'lucide-react';
import { useRef } from 'react';
import { useEffect } from 'react';

interface ChatInputProps {
  message: string;
  setMessage: (message: string) => void;
  onSendMessage: (attachments?: { audio?: Blob; image?: File }) => void;
  isListening: boolean;
  onVoiceToggle: () => void;
  currentLanguage: string;
}

export function ChatInput({
  message,
  setMessage,
  onSendMessage,
  isListening,
  onVoiceToggle,
  currentLanguage
}: ChatInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  // Add type definitions for browser speech recognition
  // @ts-ignore
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  // Add speech recognition
  useEffect(() => {
    let recognition: any = null;
    if (isListening && SpeechRecognition) {
      recognition = new SpeechRecognition();
      recognition.lang = currentLanguage === 'en' ? 'en-US' : 'en-US'; // Add more language support if needed
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setMessage(transcript);
        // Do NOT auto-send. User can review/edit and send manually.
      };
      recognition.onerror = (event: any) => {
        // Optionally handle errors
      };
      recognition.onend = () => {
        // Optionally auto-stop listening
      };
      recognition.start();
    }
    return () => {
      if (recognition) recognition.stop();
    };
  }, [isListening, setMessage, currentLanguage]);

  // --- AUDIO RECORDING LOGIC ---
  const handleStartRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia) return;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new window.MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    audioChunks.current = [];
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunks.current.push(e.data);
    };
    mediaRecorder.onstop = () => {
      const blob = new Blob(audioChunks.current, { type: 'audio/webm' });
      setAudioBlob(blob);
      setAudioUrl(URL.createObjectURL(blob));
    };
    mediaRecorder.start();
    setIsRecording(true);
  };

  const handleStopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const handleRemoveAudio = () => {
    setAudioBlob(null);
    setAudioUrl(null);
  };

  // --- SENDING LOGIC ---
  const handleSend = () => {
    if (!message.trim()) return; // Only send if there is text
    onSendMessage({ audio: audioBlob || undefined, image: imageFile || undefined });
    setMessage('');
    setAudioBlob(null);
    setAudioUrl(null);
    setImageFile(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
  };

  return (
    <div className="border-t bg-card/50 backdrop-blur-sm p-4">
      <div className="flex gap-3 items-end">
        <div className="flex-1 relative">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={`Ask me anything in ${currentLanguage}...`}
            onKeyDown={handleKeyPress}
            className="min-h-[50px] max-h-32 resize-none pr-24 border-2 focus:border-primary/50 transition-colors"
          />
          {/* Input Actions */}
          <div className="absolute right-2 bottom-2 flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={isRecording ? handleStopRecording : handleStartRecording}
              className={`transition-all duration-300 ${
                isRecording ? 'text-red-500 animate-pulse' : 'hover:text-primary'
              }`}
            >
              {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
            <label>
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImageChange}
              />
              <Button variant="ghost" size="sm" className="hover:text-primary" asChild>
              <Camera className="h-4 w-4" />
            </Button>
            </label>
          </div>
        </div>
        <Button 
          onClick={handleSend}
          variant="farmer" 
          size="lg"
          disabled={!message.trim()}
          className="px-6 shadow-strong hover:shadow-glow transition-all duration-300"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
      {/* Preview for audio and image */}
      {(audioUrl || imageFile) && (
        <div className="mt-2 flex gap-4 items-center">
          {audioUrl && (
            <div className="flex items-center gap-2">
              <audio controls src={audioUrl} className="h-8" />
              <Button size="icon" variant="ghost" onClick={handleRemoveAudio} title="Remove audio">
                ✕
              </Button>
            </div>
          )}
          {imageFile && (
            <div className="flex items-center gap-2">
              <img src={URL.createObjectURL(imageFile)} alt="preview" className="h-12 w-12 object-cover rounded" />
              <Button size="icon" variant="ghost" onClick={handleRemoveImage}>
                ✕
              </Button>
            </div>
          )}
        </div>
      )}
      {isListening && (
        <div className="mt-3 flex items-center gap-2 text-sm text-red-500">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          Listening in {currentLanguage}...
        </div>
      )}
    </div>
  );
}
