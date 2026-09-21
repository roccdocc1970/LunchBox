/**
 * useVoice Hook
 *
 * Browser-native voice input (SpeechRecognition) and output (SpeechSynthesis)
 * for the chat interface. No API key, no backend involvement — voice becomes
 * plain text before it ever reaches /api/chat, and speech output just reads
 * the existing reply text aloud. Feature-detected: callers should hide/disable
 * UI for whichever direction isn't supported rather than show a dead control.
 */

import { useState, useRef, useCallback } from 'react'

const SpeechRecognitionImpl = typeof window !== 'undefined'
  ? (window.SpeechRecognition || window.webkitSpeechRecognition)
  : null

export function useVoice() {
  const [listening, setListening] = useState(false)
  const [speakEnabled, setSpeakEnabled] = useState(false)
  const recognitionRef = useRef(null)

  const supportsInput = !!SpeechRecognitionImpl
  const supportsOutput = typeof window !== 'undefined' && 'speechSynthesis' in window

  const startListening = useCallback((onResult) => {
    if (!supportsInput || listening) return
    const recognition = new SpeechRecognitionImpl()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognition.onresult = (e) => onResult(e.results[0][0].transcript)
    recognition.onend = () => setListening(false)
    recognition.onerror = () => setListening(false)
    recognitionRef.current = recognition
    setListening(true)
    recognition.start()
  }, [listening, supportsInput])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setListening(false)
  }, [])

  const speak = useCallback((text) => {
    if (!supportsOutput || !speakEnabled || !text) return
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(text))
  }, [supportsOutput, speakEnabled])

  return {
    listening, startListening, stopListening, supportsInput,
    speakEnabled, setSpeakEnabled, supportsOutput, speak,
  }
}
