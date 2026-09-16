import { useCallback, useEffect, useRef, useState } from "react";

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: SpeechRecognitionAlternativeLike;
  length: number;
}

interface SpeechRecognitionResultListLike {
  length: number;
  [index: number]: SpeechRecognitionResultLike;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: SpeechRecognitionResultListLike;
}

interface SpeechRecognitionErrorEventLike {
  error: string;
}

interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  }
}

const ERROR_LABEL: Record<string, string> = {
  "no-speech": "Ovoz eshitilmadi. Qaytadan urinib ko'ring.",
  "audio-capture": "Mikrofon topilmadi.",
  "not-allowed": "Mikrofonga ruxsat berilmadi.",
  network: "Tarmoq xatoligi yuz berdi.",
};

/** Brauzerning Web Speech API (SpeechRecognition) ustidan yupqa o'ram — ovozli qidiruv uchun. */
export function useVoiceRecognition(lang = "uz-UZ") {
  const [listening, setListening] = useState(false);
  const [interimText, setInterimText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const onFinalRef = useRef<((text: string) => void) | null>(null);

  const Ctor = typeof window !== "undefined" ? window.SpeechRecognition ?? window.webkitSpeechRecognition : undefined;
  const supported = !!Ctor;

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const start = useCallback(
    (onFinal: (text: string) => void) => {
      if (!Ctor) {
        setError("Ovozli qidiruv bu brauzerda qo'llab-quvvatlanmaydi");
        return;
      }
      recognitionRef.current?.abort();
      const recognition = new Ctor();
      recognition.lang = lang;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      onFinalRef.current = onFinal;
      setError(null);
      setInterimText("");

      recognition.onstart = () => setListening(true);
      recognition.onresult = (event) => {
        let interim = "";
        let final = "";
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const res = event.results[i];
          if (res.isFinal) final += res[0].transcript;
          else interim += res[0].transcript;
        }
        if (interim) setInterimText(interim);
        if (final.trim()) {
          setInterimText(final.trim());
          onFinalRef.current?.(final.trim());
        }
      };
      recognition.onerror = (event) => {
        setError(ERROR_LABEL[event.error] ?? "Xatolik yuz berdi. Qaytadan urinib ko'ring.");
        setListening(false);
      };
      recognition.onend = () => setListening(false);

      recognitionRef.current = recognition;
      try {
        recognition.start();
      } catch {
        setError("Ovozli qidiruvni boshlab bo'lmadi.");
      }
    },
    [Ctor, lang],
  );

  const reset = useCallback(() => {
    setInterimText("");
    setError(null);
  }, []);

  useEffect(() => () => recognitionRef.current?.abort(), []);

  return { supported, listening, interimText, error, start, stop, reset };
}
