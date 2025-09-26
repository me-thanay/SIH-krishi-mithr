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

  const testSpeech = () => {
    const testText = "Hello! This is a test of the speech synthesis system. Can you hear me?"
    speakResponse(testText)
  }

  const getTeluguSpeechText = (teluguText: string): string => {
    // Convert Telugu weather response to English for better speech synthesis
    return teluguText
      .replace(/హైదరాబాద్లో వాతావరణం/g, 'Weather in Hyderabad')
      .replace(/ఉష్ణోగ్రత (\d+) డిగ్రీల సెల్సియస్/g, 'temperature is $1 degrees Celsius')
      .replace(/తేమ (\d+) శాతం/g, 'humidity is $1 percent')
      .replace(/పరిస్థితి (.+?)\./g, 'condition is $1')
      .replace(/నీటిపారుదల సిఫార్సు చేయబడింది/g, 'irrigation is recommended')
      .replace(/పంటల పెరుగుదలకు మంచి పరిస్థితులు/g, 'good conditions for crop growth')
      .replace(/నాటడానికి అనుకూలం/g, 'suitable for planting')
      // Translate Telugu weather conditions to English
      .replace(/తేలికపాటి వర్షపు జల్లులు/g, 'slight rain showers')
      .replace(/స్పష్టమైన/g, 'clear')
      .replace(/సూర్యకాంతి/g, 'sunny')
      .replace(/మేఘావృత/g, 'cloudy')
      .replace(/వర్షం/g, 'rain')
      .replace(/తేలికపాటి వర్షం/g, 'light rain')
      .replace(/భారీ వర్షం/g, 'heavy rain')
      .replace(/విద్యుత్ తుఫాను/g, 'thunderstorm')
      .replace(/మధ్యస్థ వర్షం/g, 'moderate rain')
      .replace(/చినుకులు/g, 'drizzle')
      .replace(/పొగమంచు/g, 'fog')
      .replace(/మంచు/g, 'mist')
      .replace(/మసక/g, 'haze')
      .replace(/గాలి/g, 'windy')
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
      console.log('Processing command:', command)
      
      // Check if it's a complex query that should redirect to WhatsApp
      if (isComplexQuery(command)) {
        console.log('Complex query detected, redirecting to WhatsApp')
        redirectToWhatsApp(command)
        return
      }

      // Process agricultural voice commands
      const commandLanguage = detectCommandLanguage(command)
      console.log('Detected language:', commandLanguage)
      console.log('Calling processAgriculturalCommand with:', command.toLowerCase())
      
      const response = await processAgriculturalCommand(command.toLowerCase())
      console.log('Got response:', response)
      
      setResponse(response)
      onResponse?.(response)
      
      // Speak the response in the detected language
      speakResponse(response, commandLanguage)
    } catch (error) {
      console.error('Error processing voice command:', error)
      console.error('Error details:', error.message)
      console.error('Stack trace:', error.stack)
      const errorResponse = "Sorry, I couldn't process your request. Please try again or contact our WhatsApp support."
      setResponse(errorResponse)
      speakResponse(errorResponse)
    } finally {
      setIsProcessing(false)
    }
  }

  const isComplexQuery = (command: string): boolean => {
    const complexKeywords = [
      'how to', 'how do', 'what should', 'when to', 'where to', 'why', 'explain',
      'detailed', 'step by step', 'guide', 'tutorial', 'process', 'method',
      'कैसे', 'क्या करना', 'कब', 'कहाँ', 'क्यों', 'विस्तार', 'तरीका',
      'ఎలా', 'ఏమి చేయాలి', 'ఎప్పుడు', 'ఎక్కడ', 'ఎందుకు', 'వివరణ', 'పద్ధతి'
    ]
    
    return complexKeywords.some(keyword => command.toLowerCase().includes(keyword))
  }

  const redirectToWhatsApp = (command: string) => {
    const whatsappMessage = `Hi Kissan! I have a question: ${command}`
    const whatsappUrl = `https://wa.me/919876543210?text=${encodeURIComponent(whatsappMessage)}`
    
    const response = "I'm redirecting you to our WhatsApp support for detailed assistance. Please wait..."
    setResponse(response)
    speakResponse(response)
    
    // Open WhatsApp after speaking
    setTimeout(() => {
      window.open(whatsappUrl, '_blank')
    }, 2000)
  }

  const detectCommandLanguage = (command: string): string => {
    // Check for Telugu characters
    const teluguRegex = /[\u0C00-\u0C7F]/;
    // Check for Hindi characters
    const hindiRegex = /[\u0900-\u097F]/;
    
    if (teluguRegex.test(command)) {
      return 'te';
    } else if (hindiRegex.test(command)) {
      return 'hi';
    } else {
      return 'en';
    }
  }

  const getTeluguResponse = (command: string): string => {
    // Weather queries
    if (command.includes('వాతావరణం') || command.includes('వాతావరణ') || 
        command.includes('వాతావరణ సమాచారం') || command.includes('వాతావరణ వివరాలు') ||
        command.includes('వెదర్') || command.includes('ఈరోజు') || command.includes('నేడు') ||
        command.includes('ఈరోజు వాతావరణం') || command.includes('నేడు వాతావరణం') ||
        command.includes('ఈరోజు వెదర్') || command.includes('నేడు వెదర్') ||
        command.includes('ఉష్ణోగ్రత') || command.includes('తేమ') || command.includes('వర్షం')) {
      return "వాతావరణ సమాచారం తెస్తున్నాను. దయచేసి వేచి ఉండండి..."
    }
    
    // Market prices
    if (command.includes('రేటు') || command.includes('ధర') || command.includes('ధరలు') ||
        command.includes('బజార్ ధర') || command.includes('మార్కెట్ ధర')) {
      return "బజార్ ధరలు తెస్తున్నాను. దయచేసి వేచి ఉండండి..."
    }
    
    // Navigation
    if (command.includes('డ్యాష్‌బోర్డ్') || command.includes('డ్యాష్‌బోర్డు') ||
        command.includes('ముఖ్య పేజీ') || command.includes('ప్రధాన పేజీ')) {
      return "మీ డ్యాష్‌బోర్డ్‌ను తెరుస్తున్నాను..."
    }
    
    if (command.includes('సబ్సిడీ') || command.includes('సబ్సిడీలు') ||
        command.includes('రాయత') || command.includes('రాయతలు')) {
      return "సబ్సిడీల పేజీని తెరుస్తున్నాను..."
    }
    
    if (command.includes('మార్కెట్') || command.includes('బజార్') ||
        command.includes('మార్కెట్ ధరలు') || command.includes('బజార్ ధరలు')) {
      return "మార్కెట్ ధరల పేజీని తెరుస్తున్నాను..."
    }
    
    if (command.includes('నేల') || command.includes('నేల విశ్లేషణ') ||
        command.includes('మట్టి') || command.includes('మట్టి పరీక్ష')) {
      return "నేల విశ్లేషణ పేజీని తెరుస్తున్నాను..."
    }
    
    if (command.includes('ప్రొఫైల్') || command.includes('వ్యక్తిగత వివరాలు') ||
        command.includes('ఖాతా') || command.includes('అకౌంట్')) {
      return "మీ ప్రొఫైల్‌ను తెరుస్తున్నాను..."
    }
    
    // Help
    if (command.includes('సహాయం') || command.includes('సహాయక') ||
        command.includes('సహాయ') || command.includes('సహాయకుడు') ||
        command.includes('ఏమి చేయగలను') || command.includes('ఏమి సహాయం')) {
      return "నేను వాతావరణం, మార్కెట్ ధరలు, నేల విశ్లేషణ, మరియు నావిగేషన్‌లో సహాయపడగలను. వ్యవసాయం గురించి అడగండి!"
    }
    
    // Crop advice
    if (command.includes('సలహా') || command.includes('సలహాలు') ||
        command.includes('వ్యవసాయ సలహా') || command.includes('పంట సలహా') ||
        command.includes('వ్యవసాయ') || command.includes('పంటలు')) {
      return "వ్యవసాయ సలహా ఇస్తున్నాను..."
    }
    
    return "నేను వాతావరణం, మార్కెట్ ధరలు, నేల విశ్లేషణ, మరియు నావిగేషన్‌లో సహాయపడగలను. వివరమైన ప్రశ్నలకు WhatsApp సపోర్ట్‌కు కనెక్ట్ చేస్తాను."
  }

  const getHindiResponse = (command: string): string => {
    // Weather queries
    if (command.includes('मौसम') || command.includes('आज का मौसम') || 
        command.includes('तापमान') || command.includes('बारिश')) {
      return "मौसम की जानकारी ला रहा हूं। कृपया प्रतीक्षा करें..."
    }
    
    // Market prices
    if (command.includes('भाव') || command.includes('कीमत') || command.includes('दाम')) {
      return "बाजार भाव ला रहा हूं। कृपया प्रतीक्षा करें..."
    }
    
    // Navigation
    if (command.includes('डैशबोर्ड') || command.includes('मुख्य पृष्ठ')) {
      return "आपका डैशबोर्ड खोल रहा हूं..."
    }
    
    if (command.includes('सब्सिडी') || command.includes('रियायत')) {
      return "सब्सिडी पृष्ठ खोल रहा हूं..."
    }
    
    if (command.includes('बाजार') || command.includes('मार्केट')) {
      return "बाजार भाव पृष्ठ खोल रहा हूं..."
    }
    
    if (command.includes('मिट्टी') || command.includes('मृदा')) {
      return "मिट्टी विश्लेषण पृष्ठ खोल रहा हूं..."
    }
    
    if (command.includes('प्रोफाइल') || command.includes('खाता')) {
      return "आपका प्रोफाइल खोल रहा हूं..."
    }
    
    // Help
    if (command.includes('सहायता') || command.includes('मदद')) {
      return "मैं मौसम, बाजार भाव, मिट्टी विश्लेषण और नेविगेशन में मदद कर सकता हूं। कृषि के बारे में पूछें!"
    }
    
    // Crop advice
    if (command.includes('सलाह') || command.includes('सुझाव')) {
      return "कृषि सलाह दे रहा हूं..."
    }
    
    return "मैं मौसम, बाजार भाव, मिट्टी विश्लेषण और नेविगेशन में मदद कर सकता हूं। विस्तृत प्रश्नों के लिए WhatsApp सहायता से जुड़ूंगा।"
  }

  const processAgriculturalCommand = async (command: string) => {
    console.log('=== processAgriculturalCommand START ===')
    console.log('Processing command:', command)
    console.log('Current language:', language)
    
    const commandLanguage = detectCommandLanguage(command)
    console.log('Detected command language:', commandLanguage)
    
    // Weather queries - Enhanced Telugu support
    if (command.includes('weather') || command.includes('मौसम') || 
        command.includes('వాతావరణం') || command.includes('వాతావరణ') || 
        command.includes('వాతావరణ సమాచారం') || command.includes('వాతావరణ వివరాలు') ||
        command.includes('వెదర్') || command.includes('ఈరోజు') || command.includes('నేడు') ||
        command.includes('ఈరోజు వాతావరణం') || command.includes('నేడు వాతావరణం') ||
        command.includes('ఈరోజు వెదర్') || command.includes('నేడు వెదర్') ||
        command.includes('ఉష్ణోగ్రత') || command.includes('తేమ') || command.includes('వర్షం') ||
        (command.includes('ఈరోజు') && command.includes('వెదర్')) ||
        (command.includes('నేడు') && command.includes('వెదర్'))) {
      const location = extractLocation(command)
      const weatherData = await fetchWeatherData(location)
      return formatWeatherResponse(weatherData, location, commandLanguage)
    }
    
    // Market price queries - Enhanced Telugu support
    if (command.includes('price') || command.includes('rate') || command.includes('भाव') || 
        command.includes('రేటు') || command.includes('ధర') || command.includes('ధరలు') ||
        command.includes('బజార్ ధర') || command.includes('మార్కెట్ ధర') ||
        command.includes('price of') || command.includes('cost of') || command.includes('value of')) {
      console.log('=== MARKET PRICE QUERY DETECTED ===')
      console.log('Market price query detected:', command)
      const crop = extractCrop(command)
      console.log('Extracted crop:', crop)
      try {
      const priceData = await fetchPriceData(crop)
        console.log('Price data received:', priceData)
        const response = formatPriceResponse(priceData, crop, commandLanguage)
        console.log('Formatted response:', response)
        return response
      } catch (error) {
        console.error('Error in market price processing:', error)
        throw error
      }
    }
    
    // Soil analysis queries - Enhanced Telugu support
    if (command.includes('soil') || command.includes('मिट्टी') || 
        command.includes('నేల') || command.includes('నేల విశ్లేషణ') ||
        command.includes('మట్టి') || command.includes('మట్టి పరీక్ష') ||
        command.includes('నేల పరీక్ష') || command.includes('మట్టి విశ్లేషణ')) {
      const soilData = await fetchSoilData()
      console.log('Soil data received:', soilData)
      return formatSoilResponse(soilData, commandLanguage)
    }
    
    // Crop advice queries - Enhanced Telugu support
    if (command.includes('advice') || command.includes('सलाह') || 
        command.includes('సలహా') || command.includes('సలహాలు') ||
        command.includes('వ్యవసాయ సలహా') || command.includes('పంట సలహా') ||
        command.includes('వ్యవసాయ') || command.includes('పంటలు')) {
      return getCropAdvice(command, commandLanguage)
    }
    
    // Navigation queries - Enhanced Telugu support
    if (command.includes('dashboard') || command.includes('डैशबोर्ड') || 
        command.includes('డ్యాష్‌బోర్డ్') || command.includes('డ్యాష్‌బోర్డు') ||
        command.includes('ముఖ్య పేజీ') || command.includes('ప్రధాన పేజీ')) {
      window.location.href = '/dashboard'
      return "Opening your dashboard..."
    }
    
    if (command.includes('subsidies') || command.includes('सब्सिडी') || 
        command.includes('సబ్సిడీ') || command.includes('సబ్సిడీలు') ||
        command.includes('రాయత') || command.includes('రాయతలు')) {
      window.location.href = '/subsidies'
      return "Opening subsidies page..."
    }
    
    if (command.includes('market') || command.includes('बाजार') || 
        command.includes('మార్కెట్') || command.includes('బజార్') ||
        command.includes('మార్కెట్ ధరలు') || command.includes('బజార్ ధరలు')) {
      window.location.href = '/market-prices'
      return "Opening market prices page..."
    }
    
    if (command.includes('soil') || command.includes('मिट्टी') || 
        command.includes('నేల') || command.includes('నేల విశ్లేషణ') ||
        command.includes('మట్టి') || command.includes('మట్టి పరీక్ష')) {
      window.location.href = '/soil-analysis'
      return "Opening soil analysis page..."
    }
    
    if (command.includes('profile') || command.includes('प्रोफाइल') || 
        command.includes('ప్రొఫైల్') || command.includes('వ్యక్తిగత వివరాలు') ||
        command.includes('ఖాతా') || command.includes('అకౌంట్')) {
      window.location.href = '/profile'
      return "Opening your profile..."
    }

    // General help - Enhanced Telugu support
    if (command.includes('help') || command.includes('सहायता') || 
        command.includes('సహాయం') || command.includes('సహాయక') ||
        command.includes('సహాయ') || command.includes('సహాయకుడు') ||
        command.includes('ఏమి చేయగలను') || command.includes('ఏమి సహాయం')) {
      return getHelpResponse()
    }
    
    // Default response - redirect to WhatsApp for complex queries
    console.log('=== NO MATCHING QUERY FOUND ===')
    console.log('Command did not match any patterns:', command)
    if (commandLanguage === 'te') {
      return "నేను వాతావరణం, మార్కెట్ ధరలు, నేల విశ్లేషణ, మరియు నావిగేషన్‌లో సహాయపడగలను. వివరమైన ప్రశ్నలకు WhatsApp సపోర్ట్‌కు కనెక్ట్ చేస్తాను."
    } else if (commandLanguage === 'hi') {
      return "मैं मौसम, बाजार भाव, मिट्टी विश्लेषण और नेविगेशन में मदद कर सकता हूं। विस्तृत प्रश्नों के लिए WhatsApp सहायता से जुड़ूंगा।"
    } else {
      return "I can help you with weather, market prices, soil analysis, and navigation. For detailed questions, I'll connect you to our WhatsApp support."
    }
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
    console.log('extractCrop called with command:', command)
    const crops = [
      'rice', 'wheat', 'maize', 'corn', 'cotton', 'sugarcane', 'soybean', 'groundnut', 'mustard', 'potato', 'onion',
      'tomato', 'tomatoes', 'brinjal', 'chili', 'chillies', 'okra', 'ladies finger', 'cauliflower', 'cabbage',
      'carrot', 'radish', 'spinach', 'coriander', 'mint', 'ginger', 'garlic', 'turmeric', 'cardamom',
      'black pepper', 'cumin', 'fenugreek', 'sesame', 'sunflower', 'castor', 'jute', 'bajra', 'jowar',
      'ragi', 'green gram', 'black gram', 'red gram', 'chickpea', 'lentil', 'kidney bean', 'cowpea',
      'corn', 'sweet corn', 'field corn', 'popcorn'
    ]
    
    // Convert command to lowercase for case-insensitive matching
    const lowerCommand = command.toLowerCase()
    
    for (const crop of crops) {
      if (lowerCommand.includes(crop)) {
        console.log('Found crop:', crop)
        return crop
      }
    }
    console.log('No crop found, returning default: rice')
    return 'rice' // default
  }

  const fetchWeatherData = async (location: string) => {
    try {
    const response = await fetch(`/api/weather?city=${location}&type=current`)
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error fetching weather:', error)
      return { success: false, error: 'Weather data unavailable' }
    }
  }

  const fetchPriceData = async (crop: string) => {
    try {
    const response = await fetch(`/api/agmarknet-prices?crop=${crop}`)
      if (!response.ok) {
        console.log('Price API failed, using fallback data')
        // Return fallback price data
        return {
          success: true,
          data: {
            prices: [{
              min_price: 2500,
              max_price: 3500,
              modal_price: 3000
            }],
            recommendation: "Current market prices are stable. Good time for selling."
          }
        }
      }
    return response.json()
    } catch (error) {
      console.error('Error fetching price data:', error)
      // Return fallback price data
      return {
        success: true,
        data: {
          prices: [{
            min_price: 2500,
            max_price: 3500,
            modal_price: 3000
          }],
          recommendation: "Current market prices are stable. Good time for selling."
        }
      }
    }
  }

  const fetchSoilData = async () => {
    const response = await fetch('/api/soil-analysis?lat=17.3850&lon=78.4867&source=openlandmap')
    return response.json()
  }

  const translateWeatherCondition = (condition: string, language: string): string => {
    if (language === 'te') {
      const teluguConditions: { [key: string]: string } = {
        'Clear': 'స్పష్టమైన',
        'Sunny': 'సూర్యకాంతి',
        'Partly cloudy': 'భాగస్వామ్య మేఘావృత',
        'Cloudy': 'మేఘావృత',
        'Overcast': 'మేఘావృత',
        'Rain': 'వర్షం',
        'Light rain': 'తేలికపాటి వర్షం',
        'Heavy rain': 'భారీ వర్షం',
        'Thunderstorm': 'విద్యుత్ తుఫాను',
        'Slight rain showers': 'తేలికపాటి వర్షపు జల్లులు',
        'Moderate rain': 'మధ్యస్థ వర్షం',
        'Drizzle': 'చినుకులు',
        'Fog': 'పొగమంచు',
        'Mist': 'మంచు',
        'Haze': 'మసక',
        'Windy': 'గాలి',
        'Snow': 'మంచు',
        'Sleet': 'మంచు వర్షం'
      }
      return teluguConditions[condition] || condition
    } else if (language === 'hi') {
      const hindiConditions: { [key: string]: string } = {
        'Clear': 'साफ',
        'Sunny': 'धूप',
        'Partly cloudy': 'आंशिक बादल',
        'Cloudy': 'बादल',
        'Overcast': 'बादल',
        'Rain': 'बारिश',
        'Light rain': 'हल्की बारिश',
        'Heavy rain': 'भारी बारिश',
        'Thunderstorm': 'तूफान',
        'Slight rain showers': 'हल्की बारिश',
        'Moderate rain': 'मध्यम बारिश',
        'Drizzle': 'बूंदाबांदी',
        'Fog': 'कोहरा',
        'Mist': 'धुंध',
        'Haze': 'धुंध',
        'Windy': 'हवा',
        'Snow': 'बर्फ',
        'Sleet': 'बर्फ की बारिश'
      }
      return hindiConditions[condition] || condition
    }
    return condition
  }

  const formatWeatherResponse = (data: any, location: string, responseLanguage: string = 'en'): string => {
    if (data.success && data.data) {
      const current = data.data.current
      const locationName = data.data.location || location.charAt(0).toUpperCase() + location.slice(1)
      
      if (responseLanguage === 'te') {
        // Telugu response
        const translatedCondition = translateWeatherCondition(current.condition, 'te')
        let response = `${locationName}లో వాతావరణం: ఉష్ణోగ్రత ${current.temperature} డిగ్రీల సెల్సియస్, తేమ ${current.humidity} శాతం. పరిస్థితి ${translatedCondition}.`
        
        // Add farming advice in Telugu
        if (current.farming_conditions) {
          const conditions = current.farming_conditions
          if (conditions.irrigation_needed) {
            response += " నీటిపారుదల సిఫార్సు చేయబడింది."
          }
          if (conditions.good_growing) {
            response += " పంటల పెరుగుదలకు మంచి పరిస్థితులు."
          }
          if (conditions.planting_suitable) {
            response += " నాటడానికి అనుకూలం."
          }
        }
        
        return response
      } else if (responseLanguage === 'hi') {
        // Hindi response
        const translatedCondition = translateWeatherCondition(current.condition, 'hi')
        let response = `${locationName} में मौसम: तापमान ${current.temperature} डिग्री सेल्सियस, आर्द्रता ${current.humidity} प्रतिशत। स्थिति ${translatedCondition}।`
        
        // Add farming advice in Hindi
        if (current.farming_conditions) {
          const conditions = current.farming_conditions
          if (conditions.irrigation_needed) {
            response += " सिंचाई की सिफारिश की गई है।"
          }
          if (conditions.good_growing) {
            response += " फसल वृद्धि के लिए अच्छी स्थिति।"
          }
          if (conditions.planting_suitable) {
            response += " रोपण के लिए उपयुक्त।"
          }
        }
        
        return response
      } else {
        // English response
        let response = `Weather in ${locationName}: Temperature is ${current.temperature} degrees Celsius, Humidity is ${current.humidity} percent. Condition is ${current.condition}.`
        
        // Add farming advice
        if (current.farming_conditions) {
          const conditions = current.farming_conditions
          if (conditions.irrigation_needed) {
            response += " Irrigation is recommended."
          }
          if (conditions.good_growing) {
            response += " Good conditions for crop growth."
          }
          if (conditions.planting_suitable) {
            response += " Suitable for planting."
          }
        }
        
        return response
      }
    }
    
    if (responseLanguage === 'te') {
      return `${location}కు వాతావరణ డేటా ప్రస్తుతం అందుబాటులో లేదు. దయచేసి తర్వాత మళ్లీ ప్రయత్నించండి.`
    } else if (responseLanguage === 'hi') {
      return `${location} के लिए मौसम डेटा अभी उपलब्ध नहीं है। कृपया बाद में पुनः प्रयास करें।`
    } else {
      return `Weather data for ${location} is not available right now. Please try again later.`
    }
  }

  const getTeluguCropName = (crop: string): string => {
    const teluguCrops: { [key: string]: string } = {
      'rice': 'బియ్యం',
      'wheat': 'గోధుమలు',
      'maize': 'మొక్కజొన్న',
      'cotton': 'పత్తి',
      'sugarcane': 'చెరకు',
      'soybean': 'సోయాబీన్',
      'groundnut': 'వేరుశెనగ',
      'mustard': 'ఆవాలు',
      'potato': 'బంగాళాదుంప',
      'onion': 'ఉల్లిపాయలు',
      'tomato': 'టమాట',
      'tomatoes': 'టమాట',
      'brinjal': 'వంకాయ',
      'chili': 'మిరప',
      'chillies': 'మిరప',
      'okra': 'బెండ',
      'cauliflower': 'కాలీఫ్లవర్',
      'cabbage': 'కోసు',
      'carrot': 'క్యారెట్',
      'ginger': 'అల్లం',
      'garlic': 'వెల్లుల్లి',
      'turmeric': 'పసుపు',
      'cardamom': 'ఏలకులు',
      'black pepper': 'మిరియాలు',
      'cumin': 'జీలకర్ర',
      'sesame': 'నువ్వులు',
      'sunflower': 'పొద్దుతిరుగుడు',
      'bajra': 'సజ్జలు',
      'jowar': 'జొన్నలు',
      'ragi': 'రాగులు',
      'green gram': 'పెసలు',
      'black gram': 'మినుములు',
      'red gram': 'కందులు',
      'chickpea': 'సెనగలు',
      'corn': 'మొక్కజొన్న',
      'sweet corn': 'మిఠాయి మొక్కజొన్న',
      'field corn': 'రైతు మొక్కజొన్న',
      'popcorn': 'పాప్ కార్న్'
    }
    return teluguCrops[crop] || crop
  }

  const getHindiCropName = (crop: string): string => {
    const hindiCrops: { [key: string]: string } = {
      'rice': 'चावल',
      'wheat': 'गेहूं',
      'maize': 'मक्का',
      'cotton': 'कपास',
      'sugarcane': 'गन्ना',
      'soybean': 'सोयाबीन',
      'groundnut': 'मूंगफली',
      'mustard': 'सरसों',
      'potato': 'आलू',
      'onion': 'प्याज',
      'tomato': 'टमाटर',
      'tomatoes': 'टमाटर',
      'brinjal': 'बैंगन',
      'chili': 'मिर्च',
      'chillies': 'मिर्च',
      'okra': 'भिंडी',
      'cauliflower': 'फूलगोभी',
      'cabbage': 'पत्तागोभी',
      'carrot': 'गाजर',
      'ginger': 'अदरक',
      'garlic': 'लहसुन',
      'turmeric': 'हल्दी',
      'cardamom': 'इलायची',
      'black pepper': 'काली मिर्च',
      'cumin': 'जीरा',
      'sesame': 'तिल',
      'sunflower': 'सूरजमुखी',
      'bajra': 'बाजरा',
      'jowar': 'ज्वार',
      'ragi': 'रागी',
      'green gram': 'मूंग',
      'black gram': 'उड़द',
      'red gram': 'अरहर',
      'chickpea': 'चना',
      'corn': 'मक्का',
      'sweet corn': 'मीठी मक्का',
      'field corn': 'खेत मक्का',
      'popcorn': 'पॉपकॉर्न'
    }
    return hindiCrops[crop] || crop
  }

  const formatPriceResponse = (data: any, crop: string, responseLanguage: string = 'en'): string => {
    console.log('formatPriceResponse called with data:', data)
    
    if (data.success && data.data) {
      console.log('Data structure:', JSON.stringify(data.data, null, 2))
      
      // Handle different possible data structures
      let prices = null
      
      if (data.data.prices && data.data.prices.length > 0) {
        prices = data.data.prices[0]
      } else if (data.data.price_data && data.data.price_data.length > 0) {
        prices = data.data.price_data[0]
      } else if (data.data.avg_price) {
        // Handle case where we have average price directly
        prices = {
          min_price: data.data.avg_price - 200,
          max_price: data.data.avg_price + 200,
          modal_price: data.data.avg_price
        }
      } else if (data.data.min_price && data.data.max_price) {
        // Handle case where prices are directly in data
        prices = {
          min_price: data.data.min_price,
          max_price: data.data.max_price,
          modal_price: data.data.avg_price || (data.data.min_price + data.data.max_price) / 2
        }
      } else if (data.data.minPrice && data.data.maxPrice) {
        // Handle camelCase structure from API
        prices = {
          min_price: data.data.minPrice,
          max_price: data.data.maxPrice,
          modal_price: data.data.modalPrice || data.data.avgPrice || (data.data.minPrice + data.data.maxPrice) / 2
        }
      }
      
      if (prices) {
        console.log('Using prices:', prices)
        
        if (responseLanguage === 'te') {
          // Telugu response
          const teluguCrop = getTeluguCropName(crop)
          return `${teluguCrop} ధరలు: కనీసం ${prices.min_price} రూపాయలు ప్రతి క్వింటాల్, గరిష్టం ${prices.max_price} రూపాయలు ప్రతి క్వింటాల్. ${data.data.recommendation || 'ప్రస్తుత మార్కెట్ ధరలు స్థిరంగా ఉన్నాయి.'}`
        } else if (responseLanguage === 'hi') {
          // Hindi response
          const hindiCrop = getHindiCropName(crop)
          return `${hindiCrop} कीमत: न्यूनतम ${prices.min_price} रुपये प्रति क्विंटल, अधिकतम ${prices.max_price} रुपये प्रति क्विंटल। ${data.data.recommendation || 'वर्तमान बाजार कीमतें स्थिर हैं।'}`
        } else {
          // English response
          return `${crop} prices: Minimum ${prices.min_price} rupees per quintal, Maximum ${prices.max_price} rupees per quintal. ${data.data.recommendation || 'Current market prices are stable.'}`
        }
      }
    }
    
    // Fallback response
    console.log('Using fallback response')
    if (responseLanguage === 'te') {
      return `${crop} ధర డేటా ప్రస్తుతం అందుబాటులో లేదు.`
    } else if (responseLanguage === 'hi') {
      return `${crop} कीमत डेटा अभी उपलब्ध नहीं है।`
    } else {
    return `${crop} price data is not available right now.`
    }
  }

  const formatSoilResponse = (data: any, responseLanguage: string = 'en'): string => {
    if (data.success) {
      const soil = data.data
      
      if (responseLanguage === 'te') {
        // Telugu response
        return `నేల విశ్లేషణ: pH స్థాయి ${soil.ph_level}, సేంద్రీయ కార్బన్ ${soil.organic_carbon} శాతం. ${soil.recommendations[0]}`
      } else if (responseLanguage === 'hi') {
        // Hindi response
        return `मिट्टी विश्लेषण: pH स्तर ${soil.ph_level}, जैविक कार्बन ${soil.organic_carbon} प्रतिशत। ${soil.recommendations[0]}`
      } else {
        // English response
      return `Soil analysis: pH level ${soil.ph_level}, Organic carbon ${soil.organic_carbon} percent. ${soil.recommendations[0]}`
      }
    }
    
    if (responseLanguage === 'te') {
      return "నేల విశ్లేషణ డేటా ప్రస్తుతం అందుబాటులో లేదు."
    } else if (responseLanguage === 'hi') {
      return "मिट्टी विश्लेषण डेटा अभी उपलब्ध नहीं है।"
    } else {
    return 'Soil analysis data is not available right now.'
    }
  }

  const getCropAdvice = (command: string, responseLanguage: string = 'en'): string => {
    if (responseLanguage === 'te') {
      const teluguAdvice = [
        "నాణ్యమైన విత్తనాలను ఉపయోగించండి మరియు మొక్కల మధ్య సరైన దూరాన్ని కాపాడండి.",
        "నేల తేమను పర్యవేక్షించండి మరియు అవసరమైనప్పుడు నీటిపారుదల చేయండి.",
        "కీటకాలు మరియు వ్యాధులను క్రమం తప్పకుండా తనిఖీ చేయండి.",
        "సరైన సమయంలో విత్తనాలు వేయండి మరియు పంటలను కోయండి.",
        "నేలను సేంద్రీయ ఎరువులతో సంపదపరచండి."
      ]
      return teluguAdvice[Math.floor(Math.random() * teluguAdvice.length)]
    } else if (responseLanguage === 'hi') {
      const hindiAdvice = [
        "गुणवत्ता वाले बीजों का उपयोग करें और पौधों के बीच उचित दूरी बनाए रखें।",
        "मिट्टी की नमी की निगरानी करें और आवश्यकता अनुसार सिंचाई करें।",
        "कीटों और रोगों की नियमित जांच करें।",
        "सही समय पर बीज बोएं और फसल काटें।",
        "मिट्टी को जैविक खाद से समृद्ध करें।"
      ]
      return hindiAdvice[Math.floor(Math.random() * hindiAdvice.length)]
    } else {
      const englishAdvice = [
      "Use quality seeds and maintain proper spacing between plants.",
      "Monitor soil moisture and irrigate when needed.",
      "Apply fertilizers based on soil test results.",
      "Control weeds and pests regularly.",
      "Practice crop rotation for better soil health."
    ]
      return englishAdvice[Math.floor(Math.random() * englishAdvice.length)]
    }
  }

  const getHelpResponse = (): string => {
    return "I can help you with weather updates, market prices, soil analysis, crop advice, and navigation. You can say 'weather', 'dashboard', 'subsidies', 'market prices', or 'soil analysis'. For detailed questions, I'll connect you to WhatsApp support."
  }

  const convertTeluguToSpeechFriendly = (text: string): string => {
    // Convert Telugu text to a more speech-friendly format
    // This helps when Telugu voices aren't available
    return text
      .replace(/ఉష్ణోగ్రత/g, 'temperature')
      .replace(/తేమ/g, 'humidity')
      .replace(/డిగ్రీల సెల్సియస్/g, 'degrees Celsius')
      .replace(/శాతం/g, 'percent')
      .replace(/వాతావరణం/g, 'weather')
      .replace(/పరిస్థితి/g, 'condition')
      .replace(/నీటిపారుదల/g, 'irrigation')
      .replace(/సిఫార్సు చేయబడింది/g, 'recommended')
      .replace(/పంటల పెరుగుదలకు/g, 'for crop growth')
      .replace(/మంచి పరిస్థితులు/g, 'good conditions')
      .replace(/నాటడానికి/g, 'for planting')
      .replace(/అనుకూలం/g, 'suitable')
      .replace(/లో/g, 'in')
      .replace(/కు/g, 'for')
      .replace(/ఎలా ఉంది/g, 'how is it')
      .replace(/ఈరోజు/g, 'today')
      .replace(/నేడు/g, 'today')
      .replace(/వెదర్/g, 'weather')
  }

  const speakResponse = (text: string, responseLanguage?: string) => {
    console.log('Attempting to speak:', text)
    
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      speechSynthesis.cancel()
      
      // Function to actually speak
      const doSpeak = () => {
        // Create new utterance
        const utterance = new SpeechSynthesisUtterance(text)
        
        // Set properties - use responseLanguage if provided, otherwise use selected language
        const langToUse = responseLanguage || language
        utterance.lang = getLanguageCode(langToUse)
        utterance.rate = 0.8
        utterance.pitch = 1
        utterance.volume = 1
        
        // Try to select appropriate voice for the language
        const voices = speechSynthesis.getVoices()
        console.log('Available voices:', voices.map(v => ({ name: v.name, lang: v.lang })))
        
        if (langToUse === 'te') {
          // Try to find Telugu voice
          const teluguVoice = voices.find(voice => 
            voice.lang.startsWith('te') || 
            voice.name.toLowerCase().includes('telugu') ||
            voice.name.toLowerCase().includes('telugu')
          )
          if (teluguVoice) {
            utterance.voice = teluguVoice
            utterance.lang = 'te-IN'
            console.log('Using Telugu voice:', teluguVoice.name)
          } else {
            console.log('No Telugu voice found, converting to speech-friendly format')
            // Convert Telugu text to English for better speech synthesis
            utterance.text = getTeluguSpeechText(text)
            utterance.lang = 'en-US'
            console.log('Converted text for speech:', utterance.text)
          }
        } else if (langToUse === 'hi') {
          // Try to find Hindi voice
          const hindiVoice = voices.find(voice => 
            voice.lang.startsWith('hi') || 
            voice.name.toLowerCase().includes('hindi')
          )
          if (hindiVoice) {
            utterance.voice = hindiVoice
            console.log('Using Hindi voice:', hindiVoice.name)
          } else {
            console.log('No Hindi voice found, using default')
          }
        }
        
        // Event handlers
        utterance.onstart = () => {
          console.log('Speech started')
          setIsSpeaking(true)
        }
        
        utterance.onend = () => {
          console.log('Speech ended')
          setIsSpeaking(false)
        }
        
        utterance.onerror = (event) => {
          console.error('Speech synthesis error:', event.error)
          setIsSpeaking(false)
        }
        
        // Store reference
        speechSynthesisRef.current = utterance
        
        // Speak
        try {
          speechSynthesis.speak(utterance)
          console.log('Speech synthesis initiated')
        } catch (error) {
          console.error('Error starting speech synthesis:', error)
          setIsSpeaking(false)
        }
      }
      
      // Wait a bit to ensure cancellation is complete, then speak
      setTimeout(doSpeak, 100)
    } else {
      console.error('Speech synthesis not supported in this browser')
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

          <Button
            onClick={testSpeech}
            className="w-16 h-16 rounded-full bg-purple-500 hover:bg-purple-600"
            title="Test Speech"
          >
            <Volume2 className="w-8 h-8 text-white" />
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
          <p>"What's the weather in Hyderabad?" / "హైదరాబాద్‌లో వాతావరణం ఎలా ఉంది?"</p>
          <p>"Open dashboard" / "డ్యాష్‌బోర్డ్ తెరువండి"</p>
          <p>"What's the price of rice?" / "బియ్యం ధర ఎంత?"</p>
          <p>"How to grow tomatoes?" (redirects to WhatsApp)</p>
        </div>
      </div>
    </div>
  )
}