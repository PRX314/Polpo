import { useState, useRef, useCallback } from 'react'

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

export function useSpeechRecognition({ lang = 'it-IT', onResult } = {}) {
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef(null)

  const isSupported = !!SpeechRecognition

  const start = useCallback(() => {
    if (!SpeechRecognition) return
    if (recognitionRef.current) {
      recognitionRef.current.abort()
    }

    const recognition = new SpeechRecognition()
    recognition.lang = lang
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onresult = (event) => {
      let finalTranscript = ''
      let interimTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript
        } else {
          interimTranscript = transcript
        }
      }

      if (finalTranscript && onResult) {
        onResult(finalTranscript)
      }
    }

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error)
      if (event.error !== 'no-speech') {
        setIsListening(false)
      }
    }

    recognition.onend = () => {
      setIsListening(false)
      recognitionRef.current = null
    }

    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
  }, [lang, onResult])

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setIsListening(false)
  }, [])

  const toggle = useCallback(() => {
    if (isListening) {
      stop()
    } else {
      start()
    }
  }, [isListening, start, stop])

  return { isListening, isSupported, start, stop, toggle }
}
