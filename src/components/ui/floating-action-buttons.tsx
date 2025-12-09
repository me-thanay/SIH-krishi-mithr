"use client"

import React, { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Mic, 
  MicOff, 
  MessageCircle, 
  Volume2, 
  VolumeX, 
  Loader2,
  X,
  Phone
} from "lucide-react"
import { cn } from "@/lib/utils"

interface FloatingActionButtonsProps {
  className?: string
}

export function FloatingActionButtons({ className }: FloatingActionButtonsProps) {
  const [isVoiceActive, setIsVoiceActive] = useState(false)
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [response, setResponse] = useState("")
  const [language, setLanguage] = useState("en")
  
  const recognitionRef = useRef<any>(null)
  const speechSynthesisRef = useRef<any>(null)

  useEffect(() => {
    // Initialize speech recognition
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      recognitionRef.current = new (window as any).webkitSpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = getLanguageCode(language)

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = ""
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript
          }
        }
        if (finalTranscript) {
          setTranscript(finalTranscript)
          processVoiceCommand(finalTranscript)
        }
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
      }
    }
  }, [language])

  const getLanguageCode = (lang: string) => {
    const languageCodes: { [key: string]: string } = {
      'en': 'en-US',
      'hi': 'hi-IN',
      'te': 'te-IN',
      'ta': 'ta-IN',
      'bn': 'bn-IN',
      'gu': 'gu-IN',
      'kn': 'kn-IN',
      'ml': 'ml-IN',
      'mr': 'mr-IN',
      'pa': 'pa-IN',
      'ur': 'ur-IN'
    }
    return languageCodes[lang] || 'en-US'
  }

  const startListening = () => {
    if (recognitionRef.current) {
      setIsListening(true)
      setTranscript("")
      setResponse("")
      recognitionRef.current.start()
    }
  }

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }

  const processVoiceCommand = async (command: string) => {
    setIsProcessing(true)
    
    try {
      const response = await processAgriculturalCommand(command.toLowerCase())
      setResponse(response)
      speakResponse(response)
    } catch (error) {
      console.error('Error processing voice command:', error)
      const errorResponse = "Sorry, I couldn't process your request. Please try again."
      setResponse(errorResponse)
      speakResponse(errorResponse)
    } finally {
      setIsProcessing(false)
    }
  }

  const processAgriculturalCommand = async (command: string) => {
    // Weather queries
    if (command.includes('weather') || command.includes('मौसम') || command.includes('వాతావరణం')) {
      const location = extractLocation(command)
      const weatherData = await fetchWeatherData(location)
      return formatWeatherResponse(weatherData, location)
    }
    
    // Market price queries
    if (command.includes('price') || command.includes('rate') || command.includes('भाव') || command.includes('రేటు')) {
      const crop = extractCrop(command)
      const priceData = await fetchPriceData(crop)
      return formatPriceResponse(priceData, crop)
    }
    
    // Soil analysis queries
    if (command.includes('soil') || command.includes('मिट्टी') || command.includes('నేల')) {
      const soilData = await fetchSoilData()
      return formatSoilResponse(soilData)
    }
    
    // Crop advice queries
    if (command.includes('advice') || command.includes('सलाह') || command.includes('సలహా')) {
      return getCropAdvice(command)
    }
    
    // General help
    if (command.includes('help') || command.includes('सहायता') || command.includes('సహాయం')) {
      return getHelpResponse()
    }
    
    // Default response
    return "I can help you with weather, market prices, soil analysis, and crop advice. Please ask me about farming."
  }

  const extractLocation = (command: string): string => {
    const locations = ['hyderabad', 'delhi', 'mumbai', 'bangalore', 'chennai', 'kolkata', 'pune', 'ahmedabad']
    for (const location of locations) {
      if (command.includes(location)) {
        return location
      }
    }
    return 'hyderabad'
  }

  const extractCrop = (command: string): string => {
    const crops = ['rice', 'wheat', 'maize', 'cotton', 'sugarcane', 'soybean', 'groundnut', 'mustard', 'potato', 'onion']
    for (const crop of crops) {
      if (command.includes(crop)) {
        return crop
      }
    }
    return 'rice'
  }

  const fetchWeatherData = async (location: string) => {
    // Weather API is disabled - return mock data
    return {
      success: true,
      data: {
        current: {
          temperature: { current: 28 },
          humidity: 65,
          farming_conditions: { good_growing: true }
        }
      }
    }
  }

  const fetchPriceData = async (crop: string) => {
    const response = await fetch(`/api/agmarknet-prices?crop=${crop}`)
    return response.json()
  }

  const fetchSoilData = async () => {
    const response = await fetch('/api/soil-analysis?lat=17.3850&lon=78.4867&source=openlandmap')
    return response.json()
  }

  const formatWeatherResponse = (data: any, location: string): string => {
    if (data.success) {
      const current = data.data.current
      return `Weather in ${location}: Temperature ${current.temperature.current} degrees Celsius, Humidity ${current.humidity} percent. ${current.farming_conditions.good_growing ? 'Good conditions for farming.' : 'Monitor crop stress.'}`
    }
    return `Weather data for ${location} is not available right now.`
  }

  const formatPriceResponse = (data: any, crop: string): string => {
    if (data.success) {
      const prices = data.data.prices[0]
      return `${crop} prices: Minimum ${prices.min_price} rupees per quintal, Maximum ${prices.max_price} rupees per quintal. ${data.data.recommendation}`
    }
    return `${crop} price data is not available right now.`
  }

  const formatSoilResponse = (data: any): string => {
    if (data.success) {
      const soil = data.data
      return `Soil analysis: pH level ${soil.ph_level}, Organic carbon ${soil.organic_carbon} percent. ${soil.recommendations[0]}`
    }
    return 'Soil analysis data is not available right now.'
  }

  const getCropAdvice = (command: string): string => {
    const advice = [
      "Use quality seeds and maintain proper spacing between plants.",
      "Monitor soil moisture and irrigate when needed.",
      "Apply fertilizers based on soil test results.",
      "Control weeds and pests regularly.",
      "Practice crop rotation for better soil health."
    ]
    return advice[Math.floor(Math.random() * advice.length)]
  }

  const getHelpResponse = (): string => {
    return "I can help you with weather updates, market prices, soil analysis, and crop advice. Just ask me about farming!"
  }

  const speakResponse = (text: string) => {
    if ('speechSynthesis' in window) {
      speechSynthesisRef.current = new SpeechSynthesisUtterance(text)
      speechSynthesisRef.current.lang = getLanguageCode(language)
      speechSynthesisRef.current.rate = 0.8
      speechSynthesisRef.current.pitch = 1
      
      speechSynthesisRef.current.onstart = () => setIsSpeaking(true)
      speechSynthesisRef.current.onend = () => setIsSpeaking(false)
      
      speechSynthesis.cancel()
      speechSynthesis.speak(speechSynthesisRef.current)
    }
  }

  const stopSpeaking = () => {
    if (speechSynthesisRef.current) {
      speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }

  const handleWhatsAppClick = () => {
    const phoneNumber = "7670997498"
    const message = "Hello! I need agricultural support."
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  return (
    <>
      {/* Main Floating Action Buttons */}
      <div className={cn("fixed bottom-6 right-6 z-50 flex flex-col gap-3", className)}>
        {/* Voice Assistant Button */}
        <motion.button
          onClick={() => setIsVoiceActive(!isVoiceActive)}
          className={cn(
            "w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300",
            isVoiceActive 
              ? "bg-red-500 hover:bg-red-600 text-white" 
              : "bg-green-500 hover:bg-green-600 text-white"
          )}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          {isVoiceActive ? (
            <X className="w-6 h-6" />
          ) : (
            <Mic className="w-6 h-6" />
          )}
        </motion.button>

        {/* WhatsApp Button */}
        <motion.button
          onClick={handleWhatsAppClick}
          className="w-14 h-14 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <MessageCircle className="w-6 h-6" />
        </motion.button>
      </div>

      {/* Voice Assistant Panel */}
      <AnimatePresence>
        {isVoiceActive && (
          <motion.div
            initial={{ opacity: 0, x: 100, y: 100 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: 100, y: 100 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-24 right-6 z-50 w-80 bg-white rounded-lg shadow-2xl border border-gray-200 p-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Mic className="w-5 h-5 text-green-600" />
                Voice Assistant
              </h3>
              <button
                onClick={() => setIsVoiceActive(false)}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Language Selector */}
            <div className="flex gap-1 mb-4">
              {[
                { code: 'en', label: 'English' },
                { code: 'hi', label: 'हिंदी' },
                { code: 'te', label: 'తెలుగు' }
              ].map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={cn(
                    "px-3 py-1 text-xs rounded-full transition-colors",
                    language === lang.code
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  {lang.label}
                </button>
              ))}
            </div>

            {/* Voice Controls */}
            <div className="flex items-center justify-center gap-4 mb-4">
              <motion.button
                onClick={isListening ? stopListening : startListening}
                disabled={isProcessing}
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300",
                  isListening 
                    ? "bg-red-500 hover:bg-red-600 text-white" 
                    : "bg-green-500 hover:bg-green-600 text-white"
                )}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isProcessing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isListening ? (
                  <MicOff className="w-5 h-5" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </motion.button>

              {isSpeaking && (
                <motion.button
                  onClick={stopSpeaking}
                  className="w-12 h-12 rounded-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <VolumeX className="w-5 h-5" />
                </motion.button>
              )}
            </div>

            {/* Status */}
            <div className="text-center mb-4">
              {isListening && (
                <p className="text-green-600 font-medium text-sm">🎤 Listening... Speak now</p>
              )}
              {isProcessing && (
                <p className="text-blue-600 font-medium text-sm">🔄 Processing...</p>
              )}
              {isSpeaking && (
                <p className="text-purple-600 font-medium text-sm">🔊 Speaking...</p>
              )}
              {!isListening && !isProcessing && !isSpeaking && (
                <p className="text-gray-500 text-sm">Click microphone to start</p>
              )}
            </div>

            {/* Transcript */}
            {transcript && (
              <div className="mb-3">
                <h4 className="font-medium text-gray-700 mb-1 text-sm">You said:</h4>
                <p className="p-2 bg-gray-100 rounded text-sm">{transcript}</p>
              </div>
            )}

            {/* Response */}
            {response && (
              <div className="mb-3">
                <h4 className="font-medium text-gray-700 mb-1 text-sm">Response:</h4>
                <p className="p-2 bg-green-100 rounded text-sm">{response}</p>
              </div>
            )}

            {/* Instructions */}
            <div className="text-center text-xs text-gray-500">
              <p>Try saying:</p>
              <p>"What's the weather in Hyderabad?"</p>
              <p>"What's the price of rice?"</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
