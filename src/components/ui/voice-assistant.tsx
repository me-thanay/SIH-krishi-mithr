"use client"

import React, { useState, useRef, useEffect } from "react"
import { Mic, MicOff, Volume2, VolumeX, Loader2 } from "lucide-react"
import { Button } from "./button"

interface VoiceAssistantProps {
  onTranscript?: (text: string) => void
  onResponse?: (response: string) => void
  className?: string
}

export function VoiceAssistant({ onTranscript, onResponse, className }: VoiceAssistantProps) {
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [response, setResponse] = useState("")
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [language, setLanguage] = useState("en") // en, hi, te, ta, etc.
  
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
          onTranscript?.(finalTranscript)
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
      // Process agricultural voice commands
      const response = await processAgriculturalCommand(command.toLowerCase())
      setResponse(response)
      onResponse?.(response)
      
      // Speak the response
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
    // Extract location from voice command
    const locations = ['hyderabad', 'delhi', 'mumbai', 'bangalore', 'chennai', 'kolkata', 'pune', 'ahmedabad']
    for (const location of locations) {
      if (command.includes(location)) {
        return location
      }
    }
    return 'hyderabad' // default
  }

  const extractCrop = (command: string): string => {
    // Extract crop from voice command
    const crops = ['rice', 'wheat', 'maize', 'cotton', 'sugarcane', 'soybean', 'groundnut', 'mustard', 'potato', 'onion']
    for (const crop of crops) {
      if (command.includes(crop)) {
        return crop
      }
    }
    return 'rice' // default
  }

  const fetchWeatherData = async (location: string) => {
    const response = await fetch(`/api/weather?city=${location}&type=current`)
    return response.json()
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

  return (
    <div className={`voice-assistant ${className}`}>
      <div className="flex flex-col items-center space-y-4 p-6 bg-white rounded-lg shadow-lg">
        {/* Language Selector */}
        <div className="flex space-x-2">
          <Button
            variant={language === 'en' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setLanguage('en')}
          >
            English
          </Button>
          <Button
            variant={language === 'hi' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setLanguage('hi')}
          >
            हिंदी
          </Button>
          <Button
            variant={language === 'te' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setLanguage('te')}
          >
            తెలుగు
          </Button>
        </div>

        {/* Voice Controls */}
        <div className="flex space-x-4">
          <Button
            onClick={isListening ? stopListening : startListening}
            disabled={isProcessing}
            className={`w-16 h-16 rounded-full ${
              isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            {isListening ? (
              <MicOff className="w-8 h-8 text-white" />
            ) : (
              <Mic className="w-8 h-8 text-white" />
            )}
          </Button>

          {isSpeaking && (
            <Button
              onClick={stopSpeaking}
              className="w-16 h-16 rounded-full bg-blue-500 hover:bg-blue-600"
            >
              <VolumeX className="w-8 h-8 text-white" />
            </Button>
          )}
        </div>

        {/* Status */}
        <div className="text-center">
          {isListening && (
            <p className="text-green-600 font-medium">🎤 Listening... Speak now</p>
          )}
          {isProcessing && (
            <p className="text-blue-600 font-medium">🔄 Processing your request...</p>
          )}
          {isSpeaking && (
            <p className="text-purple-600 font-medium">🔊 Speaking response...</p>
          )}
        </div>

        {/* Transcript */}
        {transcript && (
          <div className="w-full max-w-md">
            <h4 className="font-medium text-gray-700 mb-2">You said:</h4>
            <p className="p-3 bg-gray-100 rounded-lg text-sm">{transcript}</p>
          </div>
        )}

        {/* Response */}
        {response && (
          <div className="w-full max-w-md">
            <h4 className="font-medium text-gray-700 mb-2">Response:</h4>
            <p className="p-3 bg-green-100 rounded-lg text-sm">{response}</p>
          </div>
        )}

        {/* Instructions */}
        <div className="text-center text-sm text-gray-600">
          <p>Try saying:</p>
          <p>"What's the weather in Hyderabad?"</p>
          <p>"What's the price of rice?"</p>
          <p>"Give me soil advice"</p>
        </div>
      </div>
    </div>
  )
}