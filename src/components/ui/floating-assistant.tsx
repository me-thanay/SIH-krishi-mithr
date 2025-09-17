"use client"

import React, { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Mic, 
  MicOff, 
  MessageCircle, 
  Volume2, 
  X, 
  Phone,
  Minimize2,
  Maximize2,
  Bot,
  Send,
  Loader2
} from "lucide-react"
import { Button } from "./button"
import { Card } from "./card"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
  type?: 'text' | 'voice'
}

export const FloatingAssistant = () => {
  const [activeAssistant, setActiveAssistant] = useState<'voice' | 'whatsapp' | null>(null)
  const [isMinimized, setIsMinimized] = useState(false)
  
  // Voice Assistant States
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [voiceResponse, setVoiceResponse] = useState("")
  const [duration, setDuration] = useState(0)
  const [audioLevel, setAudioLevel] = useState(0)
  
  // WhatsApp Chat States
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm your AgriTech AI assistant. How can I help you today?",
      sender: 'bot',
      timestamp: new Date(),
      type: 'text'
    }
  ])
  const [inputText, setInputText] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  
  const recognitionRef = useRef<any | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Initialize speech recognition
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition()
        
        recognitionRef.current.continuous = false
        recognitionRef.current.interimResults = false
        recognitionRef.current.lang = 'en-US'

        recognitionRef.current.onstart = () => {
          console.log('Speech recognition started')
          setIsListening(true)
          setTranscript("")
          setVoiceResponse("")
        }

        recognitionRef.current.onresult = (event: any) => {
          console.log('Speech recognition result:', event)
          const transcript = event.results[0][0].transcript
          setTranscript(transcript)
        }

        recognitionRef.current.onend = () => {
          console.log('Speech recognition ended')
          setIsListening(false)
          if (transcript.trim()) {
            processVoiceInput(transcript)
          }
        }

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error)
          setIsListening(false)
        }
      } else {
        console.error('Speech recognition not supported')
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [transcript])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

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
      try {
        console.log('Starting speech recognition...')
        setDuration(0)
        recognitionRef.current.start()
        
        intervalRef.current = setInterval(() => {
          setDuration(prev => prev + 1)
        }, 1000)
      } catch (error) {
        console.error('Error starting speech recognition:', error)
        setIsListening(false)
      }
    }
  }

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        console.log('Stopping speech recognition...')
        recognitionRef.current.stop()
      } catch (error) {
        console.error('Error stopping speech recognition:', error)
      }
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
      setVoiceResponse("Converting voice to text and redirecting to WhatsApp...")
      
      // Directly redirect to WhatsApp with the voice text + kissan prefix
      const phoneNumber = "7670997498"
      const message = `kissan ${text}`
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`
      
      console.log('Opening WhatsApp with message:', message)
      console.log('WhatsApp URL:', whatsappUrl)
      
      // Open WhatsApp immediately
      window.open(whatsappUrl, '_blank')
      
      // Update response
      setVoiceResponse(`✅ Voice converted to text: "${text}"\n📱 Redirected to WhatsApp chatbot (+91 76709 97498)\n💬 Message sent: "kissan ${text}"`)
      
    } catch (error) {
      console.error('Error processing voice input:', error)
      setVoiceResponse("❌ Error: " + error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleWhatsAppSend = async () => {
    if (!inputText.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    }

    setMessages(prev => [...prev, userMessage])
    setInputText("")
    setIsTyping(true)

    try {
      const response = await fetch('http://localhost:8000/api/webhook/whatsapp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entry: [{
            changes: [{
              value: {
                messages: [{
                  from: 'web_user',
                  type: 'text',
                  text: { body: inputText }
                }]
              }
            }]
          }]
        })
      })

      if (response.ok) {
        const data = await response.json()
        const botResponse = data.replies && data.replies.length > 0 
          ? data.replies[0].message 
          : "I received your message: " + inputText

        setTimeout(() => {
          const botMessage: Message = {
            id: (Date.now() + 1).toString(),
            text: botResponse,
            sender: 'bot',
            timestamp: new Date(),
            type: 'text'
          }
          setMessages(prev => [...prev, botMessage])
          setIsTyping(false)
        }, 1000)
      } else {
        throw new Error('Failed to send message')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I couldn't process your request. Please try again or contact support.",
        sender: 'bot',
        timestamp: new Date(),
        type: 'text'
      }
      setMessages(prev => [...prev, errorMessage])
      setIsTyping(false)
    }
  }

  const openWhatsApp = () => {
    const phoneNumber = "7670997498"
    const message = "kissan"
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  const speakResponse = () => {
    if (voiceResponse && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(voiceResponse)
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

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleWhatsAppSend()
    }
  }

  return (
    <>
      {/* Floating Assistant Buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50">
        {/* Voice Assistant Button */}
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          onClick={() => setActiveAssistant('voice')}
          className="w-14 h-14 bg-blue-500 hover:bg-blue-600 rounded-full shadow-lg flex items-center justify-center text-white transition-all duration-300 hover:scale-110"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <Mic className="w-6 h-6" />
        </motion.button>

        {/* WhatsApp Assistant Button */}
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          onClick={() => setActiveAssistant('whatsapp')}
          className="w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full shadow-lg flex items-center justify-center text-white transition-all duration-300 hover:scale-110"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <MessageCircle className="w-6 h-6" />
        </motion.button>
      </div>

      {/* Voice Assistant Window */}
      <AnimatePresence>
        {activeAssistant === 'voice' && (
          <motion.div
            initial={{ scale: 0, opacity: 0, x: 20, y: 20 }}
            animate={{ 
              scale: 1, 
              opacity: 1, 
              x: 0, 
              y: 0,
              height: isMinimized ? 'auto' : '500px'
            }}
            exit={{ scale: 0, opacity: 0, x: 20, y: 20 }}
            className={cn(
              "fixed bottom-6 right-6 w-80 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 flex flex-col",
              isMinimized ? "h-auto" : "h-[500px]"
            )}
          >
            {/* Header */}
            <div className="bg-blue-500 text-white p-4 rounded-t-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <Mic className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold">Voice Assistant</h3>
                  <p className="text-xs text-blue-100">AI-Powered</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1 hover:bg-white/20 rounded transition-colors"
                >
                  {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setActiveAssistant(null)}
                  className="p-1 hover:bg-white/20 rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <div className="flex-1 p-6 space-y-6 bg-gradient-to-br from-blue-50 to-white">
                {/* Voice Button */}
                <div className="flex justify-center">
                  <motion.button
                    onClick={isListening ? stopListening : startListening}
                    className={cn(
                      "w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300",
                      isListening 
                        ? "bg-red-500 hover:bg-red-600 shadow-lg shadow-red-200" 
                        : "bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-200"
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
                      className="text-center text-2xl font-mono text-gray-700"
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
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Response */}
                <AnimatePresence>
                  {voiceResponse && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-3"
                    >
                      <div className="text-left">
                        <h4 className="text-sm font-medium text-gray-600 mb-2">Response:</h4>
                        <p className="text-gray-800 bg-blue-50 p-3 rounded-lg">{voiceResponse}</p>
                      </div>
                      
              <div className="flex gap-2 justify-center">
                <Button
                  onClick={speakResponse}
                  variant="outline"
                  size="sm"
                  className="border-blue-600 text-blue-600 hover:bg-blue-50"
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
                  Open WhatsApp
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
                      className="flex items-center justify-center gap-2 text-blue-600"
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"
                      />
                      Processing your request...
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* WhatsApp Assistant Window */}
      <AnimatePresence>
        {activeAssistant === 'whatsapp' && (
          <motion.div
            initial={{ scale: 0, opacity: 0, x: 20, y: 20 }}
            animate={{ 
              scale: 1, 
              opacity: 1, 
              x: 0, 
              y: 0,
              height: isMinimized ? 'auto' : '500px'
            }}
            exit={{ scale: 0, opacity: 0, x: 20, y: 20 }}
            className={cn(
              "fixed bottom-6 right-6 w-80 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 flex flex-col",
              isMinimized ? "h-auto" : "h-[500px]"
            )}
          >
            {/* Header */}
            <div className="bg-green-500 text-white p-4 rounded-t-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold">WhatsApp Bot</h3>
                  <p className="text-xs text-green-100">Online</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1 hover:bg-white/20 rounded transition-colors"
                >
                  {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setActiveAssistant(null)}
                  className="p-1 hover:bg-white/20 rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "flex",
                        message.sender === 'user' ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[80%] p-3 rounded-lg",
                          message.sender === 'user'
                            ? "bg-green-500 text-white"
                            : "bg-white text-gray-800 border border-gray-200"
                        )}
                      >
                        <p className="text-sm">{message.text}</p>
                        <p className={cn(
                          "text-xs mt-1",
                          message.sender === 'user' ? "text-green-100" : "text-gray-500"
                        )}>
                          {formatTime(message.timestamp)}
                        </p>
                      </div>
                    </motion.div>
                  ))}

                  {/* Typing Indicator */}
                  <AnimatePresence>
                    {isTyping && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex justify-start"
                      >
                        <div className="bg-white text-gray-800 border border-gray-200 p-3 rounded-lg">
                          <div className="flex items-center gap-1">
                            <div className="flex gap-1">
                              <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                                className="w-2 h-2 bg-gray-400 rounded-full"
                              />
                              <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                                className="w-2 h-2 bg-gray-400 rounded-full"
                              />
                              <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                                className="w-2 h-2 bg-gray-400 rounded-full"
                              />
                            </div>
                            <span className="text-xs text-gray-500 ml-2">AgriTech AI is typing...</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-gray-200 bg-white">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                    />
                    <Button
                      onClick={handleWhatsAppSend}
                      disabled={!inputText.trim()}
                      size="sm"
                      className="bg-green-500 hover:bg-green-600"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {/* WhatsApp Direct Link */}
                  <div className="mt-3 flex justify-center">
                    <Button
                      onClick={openWhatsApp}
                      variant="outline"
                      size="sm"
                      className="border-green-600 text-green-600 hover:bg-green-50"
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Open WhatsApp
                    </Button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    webkitSpeechRecognition: any
    SpeechRecognition: any
  }
}
