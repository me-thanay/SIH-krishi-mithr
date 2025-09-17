"use client"

import React, { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Mic, MicOff, Volume2, MessageCircle } from "lucide-react"
import { Card } from "./card"
import { Button } from "./button"
import { cn } from "@/lib/utils"

interface VoiceAssistantProps {
  onVoiceResult?: (text: string) => void
  className?: string
}

export const VoiceAssistant = ({ onVoiceResult, className }: VoiceAssistantProps) => {
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [response, setResponse] = useState("")
  const [duration, setDuration] = useState(0)
  const [audioLevel, setAudioLevel] = useState(0)
  
  const recognitionRef = useRef<any | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null)

  useEffect(() => {
    // Initialize speech recognition
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = 'en-US'

      recognitionRef.current.onstart = () => {
        setIsListening(true)
        setTranscript("")
        setResponse("")
        startAudioVisualization()
      }

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = ""
        let interimTranscript = ""

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript
          } else {
            interimTranscript += transcript
          }
        }

        setTranscript(finalTranscript || interimTranscript)
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
        stopAudioVisualization()
        if (transcript.trim()) {
          processVoiceInput(transcript)
        }
      }

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
        stopAudioVisualization()
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [transcript])

  const startAudioVisualization = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      analyserRef.current = audioContextRef.current.createAnalyser()
      microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream)
      
      microphoneRef.current.connect(analyserRef.current)
      analyserRef.current.fftSize = 256
      
      const bufferLength = analyserRef.current.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)
      
      const updateAudioLevel = () => {
        if (analyserRef.current && isListening) {
          analyserRef.current.getByteFrequencyData(dataArray)
          const average = dataArray.reduce((a, b) => a + b) / bufferLength
          setAudioLevel(average / 255)
          requestAnimationFrame(updateAudioLevel)
        }
      }
      
      updateAudioLevel()
    } catch (error) {
      console.error('Error accessing microphone:', error)
    }
  }

  const stopAudioVisualization = () => {
    if (microphoneRef.current) {
      microphoneRef.current.disconnect()
    }
    setAudioLevel(0)
  }

  const startListening = () => {
    if (recognitionRef.current) {
      setDuration(0)
      recognitionRef.current.start()
      
      // Start duration timer
      intervalRef.current = setInterval(() => {
        setDuration(prev => prev + 1)
      }, 1000)
    }
  }

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
  }

  const processVoiceInput = async (text: string) => {
    setIsProcessing(true)
    
    try {
      console.log('Processing voice input:', text)
      
      // Show processing message
      setResponse("Converting voice to text and redirecting to WhatsApp...")
      
      // Directly redirect to WhatsApp with the voice text + kissan prefix
      const phoneNumber = "7670997498"
      const message = `kissan ${text}`
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`
      
      console.log('Opening WhatsApp with message:', message)
      console.log('WhatsApp URL:', whatsappUrl)
      
      // Open WhatsApp immediately
      window.open(whatsappUrl, '_blank')
      
      // Update response
      setResponse(`✅ Voice converted to text: "${text}"\n📱 Redirected to WhatsApp chatbot (+91 76709 97498)\n💬 Message sent: "kissan ${text}"`)
      
    } catch (error) {
      console.error('Error processing voice input:', error)
      setResponse("❌ Error: " + error)
    } finally {
      setIsProcessing(false)
    }

    // Call the callback if provided
    if (onVoiceResult) {
      onVoiceResult(text)
    }
  }

  const speakResponse = () => {
    if (response && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(response)
      utterance.lang = 'en-US'
      utterance.rate = 0.8
      speechSynthesis.speak(utterance)
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const generateWaveform = () => {
    const bars = []
    const barCount = 20
    const baseHeight = 4
    
    for (let i = 0; i < barCount; i++) {
      const height = isListening 
        ? baseHeight + (Math.random() * 20 * audioLevel) 
        : baseHeight + Math.sin(Date.now() * 0.01 + i * 0.5) * 3
      
      bars.push(
        <motion.div
          key={i}
          className="bg-green-500 rounded-full"
          style={{ width: '3px' }}
          animate={{
            height: `${height}px`,
            opacity: isListening ? 0.8 : 0.4
          }}
          transition={{ duration: 0.1 }}
        />
      )
    }
    
    return bars
  }

  return (
    <Card className={cn("p-8 bg-gradient-to-br from-white to-green-50 border-green-200", className)}>
      <div className="text-center space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <h3 className="text-2xl font-bold text-gray-800">Try Our Voice Assistant</h3>
          <p className="text-gray-600">Ask questions about your crops in your preferred language</p>
        </div>

        {/* Voice Button */}
        <div className="flex justify-center">
          <motion.button
            onClick={isListening ? stopListening : startListening}
            className={cn(
              "w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300",
              isListening 
                ? "bg-red-500 hover:bg-red-600 shadow-lg shadow-red-200" 
                : "bg-green-500 hover:bg-green-600 shadow-lg shadow-green-200"
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={isListening ? { rotate: [0, 5, -5, 0] } : {}}
            transition={{ duration: 0.5, repeat: isListening ? Infinity : 0 }}
          >
            {isListening ? (
              <MicOff className="w-8 h-8 text-white" />
            ) : (
              <Mic className="w-8 h-8 text-white" />
            )}
          </motion.button>
        </div>

        {/* Timer */}
        <AnimatePresence>
          {isListening && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-2xl font-mono text-gray-700"
            >
              {formatDuration(duration)}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Audio Waveform */}
        <AnimatePresence>
          {isListening && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center justify-center gap-1 h-8"
            >
              {generateWaveform()}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Status */}
        <AnimatePresence>
          {isListening && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-green-600 font-medium"
            >
              Listening...
            </motion.div>
          )}
        </AnimatePresence>

        {/* Transcript */}
        <AnimatePresence>
          {transcript && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-3"
            >
              <div className="text-left">
                <h4 className="text-sm font-medium text-gray-600 mb-2">You said:</h4>
                <p className="text-gray-800 bg-gray-50 p-3 rounded-lg">{transcript}</p>
                <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                  <MessageCircle className="w-4 h-4" />
                  <span>Will be sent to WhatsApp as: "kissan {transcript}"</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Response */}
        <AnimatePresence>
          {response && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-3"
            >
              <div className="text-left">
                <h4 className="text-sm font-medium text-gray-600 mb-2">Response:</h4>
                <p className="text-gray-800 bg-green-50 p-3 rounded-lg">{response}</p>
              </div>
              
              <div className="flex gap-2 justify-center">
                <Button
                  onClick={speakResponse}
                  variant="outline"
                  size="sm"
                  className="border-green-600 text-green-600 hover:bg-green-50"
                >
                  <Volume2 className="w-4 h-4 mr-2" />
                  Speak Response
                </Button>
                
                <Button
                  onClick={() => {
                    const phoneNumber = "7670997498"
                    const message = `kissan ${transcript || "Hello, I need help with my crops"}`
                    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`
                    window.open(whatsappUrl, '_blank')
                  }}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Send to WhatsApp
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Processing Indicator */}
        <AnimatePresence>
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center gap-2 text-green-600"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full"
              />
              Processing your request...
            </motion.div>
          )}
        </AnimatePresence>

        {/* Instructions */}
        <div className="text-sm text-gray-500 space-y-1">
          <p>• Click the microphone to start listening</p>
          <p>• Ask about weather, pests, soil, or market prices</p>
          <p>• Your question will be processed by our AI assistant</p>
        </div>
      </div>
    </Card>
  )
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    webkitSpeechRecognition: any
    SpeechRecognition: any
  }
}
