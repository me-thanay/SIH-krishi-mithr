"use client"

import React, { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Mic, MicOff, Volume2, Loader2 } from "lucide-react"
import { Button } from "./button"
import { Card } from "./card"
import { cn } from "@/lib/utils"

export const SimpleVoiceAssistant = () => {
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [response, setResponse] = useState("")
  const [error, setError] = useState("")
  
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition()
        
        recognitionRef.current.continuous = false
        recognitionRef.current.interimResults = false
        recognitionRef.current.lang = 'en-US'

        recognitionRef.current.onstart = () => {
          setIsListening(true)
          setTranscript("")
          setResponse("")
          setError("")
        }

        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript
          setTranscript(transcript)
        }

        recognitionRef.current.onend = () => {
          setIsListening(false)
          if (transcript.trim()) {
            processVoiceInput(transcript)
          }
        }

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error)
          setIsListening(false)
          setError(`Speech recognition error: ${event.error}`)
        }
      } else {
        setError("Speech recognition not supported in this browser")
      }
    }
  }, [transcript])

  const startListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start()
      } catch (error) {
        console.error('Error starting speech recognition:', error)
        setError("Failed to start speech recognition")
      }
    }
  }

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
  }

  const processVoiceInput = async (text: string) => {
    setIsProcessing(true)
    
    try {
      const response = await fetch('http://localhost:8000/api/voice/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          user_id: 'voice_user'
        })
      })

      if (response.ok) {
        const data = await response.json()
        setResponse(data.bot_response)
      } else {
        setResponse("Sorry, I couldn't process your request. Please try again.")
      }
    } catch (error) {
      console.error('Error processing voice input:', error)
      setResponse("Sorry, there was an error processing your request.")
    } finally {
      setIsProcessing(false)
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

  return (
    <Card className="p-6 bg-gradient-to-br from-white to-blue-50 border-blue-200 max-w-md mx-auto">
      <div className="text-center space-y-4">
        {/* Title */}
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-gray-800">Voice Assistant</h3>
          <p className="text-gray-600 text-sm">Click and speak your farming question</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
            {error}
          </div>
        )}

        {/* Voice Button */}
        <div className="flex justify-center">
          <motion.button
            onClick={isListening ? stopListening : startListening}
            disabled={isProcessing}
            className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300",
              isListening 
                ? "bg-red-500 hover:bg-red-600 shadow-lg shadow-red-200" 
                : "bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-200",
              isProcessing && "opacity-50 cursor-not-allowed"
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={isListening ? { rotate: [0, 5, -5, 0] } : {}}
            transition={{ duration: 0.5, repeat: isListening ? Infinity : 0 }}
          >
            {isProcessing ? (
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            ) : isListening ? (
              <MicOff className="w-6 h-6 text-white" />
            ) : (
              <Mic className="w-6 h-6 text-white" />
            )}
          </motion.button>
        </div>

        {/* Status */}
        <div className="text-sm">
          {isListening && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-blue-600 font-medium"
            >
              Listening... Speak now
            </motion.div>
          )}
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-blue-600 font-medium"
            >
              Processing your request...
            </motion.div>
          )}
        </div>

        {/* Transcript */}
        <AnimatePresence>
          {transcript && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-2"
            >
              <div className="text-left">
                <h4 className="text-sm font-medium text-gray-600 mb-1">You said:</h4>
                <p className="text-gray-800 bg-gray-50 p-3 rounded-lg text-sm">{transcript}</p>
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
                <h4 className="text-sm font-medium text-gray-600 mb-1">Response:</h4>
                <p className="text-gray-800 bg-blue-50 p-3 rounded-lg text-sm">{response}</p>
              </div>
              
              <Button
                onClick={speakResponse}
                variant="outline"
                size="sm"
                className="border-blue-600 text-blue-600 hover:bg-blue-50"
              >
                <Volume2 className="w-4 h-4 mr-2" />
                Speak Response
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Instructions */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Click the microphone to start</p>
          <p>• Ask about weather, pests, soil, or market prices</p>
          <p>• Speak clearly and wait for response</p>
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
