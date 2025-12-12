"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { motion } from "framer-motion"
import { 
  Sprout, 
  Power,
  BarChart3,
  MessageCircle,
  Bell,
  Mic,
  Volume2,
  VolumeX,
} from "lucide-react"
import { Button } from "./ui/button"
import { Card } from "./ui/card"
import { RelayControls } from "./ui/relay-controls"
import { FarmAnalysis } from "./ui/farm-analysis"
import { ToastContainer } from "./ui/toast-notification"
import { useNotifications } from "@/hooks/useNotifications"
import { SensorStatusDisplay } from "./ui/sensor-status-display"
import { NewNavbar } from './ui/new-navbar'
import { VoiceChat } from "./ui/ia-siri-chat"

// Main Component
const SmartAgriTechComponent = () => {
  const [activeTab, setActiveTab] = useState<'operations' | 'analysis' | 'questions'>('operations')
  const [quickText, setQuickText] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [voiceTranscript, setVoiceTranscript] = useState('')
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [speechLanguage, setSpeechLanguage] = useState<string>('en-US') // Default to English
  const recognitionRef = useRef<any>(null)
  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null)
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const { notifications, addNotification, removeNotification } = useNotifications()

  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      speechSynthesisRef.current = window.speechSynthesis
    }
  }, [])

  // Function to speak alerts
  const speakAlerts = useCallback(() => {
    const synth = speechSynthesisRef.current
    if (!synth) {
      addNotification({
        title: "⚠️ Not Supported",
        message: "Text-to-speech is not available in your browser.",
        type: "warning"
      })
      return
    }

    // Stop any ongoing speech
    if (currentUtteranceRef.current) {
      synth.cancel()
    }

    // Combine all notifications (sensor alerts are already in notifications)
    const allAlerts: Array<{ title: string; message: string }> = []
    
    // Add all notifications
    if (notifications && notifications.length > 0) {
      notifications.slice().reverse().forEach((notif) => {
        // Translate notification titles and messages to Hindi if selected
        const translatedTitle = speechLanguage === 'hi-IN' ? translateNotificationTitle(notif.title) : notif.title
        const translatedMessage = speechLanguage === 'hi-IN' ? translateNotificationMessage(notif.message) : notif.message
        
        allAlerts.push({
          title: translatedTitle,
          message: translatedMessage
        })
      })
    }

    // Debug: log alerts
    console.log('Speaking alerts:', {
      notificationsCount: notifications?.length || 0,
      totalAlerts: allAlerts.length
    })

    // Check if we have any alerts (sensor or notifications)
    if (allAlerts.length === 0) {
      const noAlertsMessage = speechLanguage === 'hi-IN' 
        ? "अभी कोई अलर्ट नहीं है। सब कुछ ठीक लग रहा है!"
        : "No alerts right now. Everything looks good!"
      
      const utterance = new SpeechSynthesisUtterance(noAlertsMessage)
      utterance.lang = speechLanguage
      utterance.rate = 0.9
      utterance.pitch = 1
      synth.speak(utterance)
      setIsSpeaking(true)
      
      utterance.onend = () => {
        setIsSpeaking(false)
        currentUtteranceRef.current = null
      }
      currentUtteranceRef.current = utterance
      return
    }

    // Speak all alerts
    let currentIndex = 0

    const speakNext = () => {
      if (currentIndex >= allAlerts.length) {
        setIsSpeaking(false)
        currentUtteranceRef.current = null
        return
      }

      const alert = allAlerts[currentIndex]
      // For sensor alerts (no title), just say the message. For notifications, include title.
      let text = alert.title 
        ? (speechLanguage === 'hi-IN' 
            ? `अलर्ट ${currentIndex + 1}. ${alert.title}. ${alert.message}`
            : `Alert ${currentIndex + 1}. ${alert.title}. ${alert.message}`)
        : (speechLanguage === 'hi-IN'
            ? `अलर्ट ${currentIndex + 1}. ${alert.message}`
            : `Alert ${currentIndex + 1}. ${alert.message}`)
      
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = speechLanguage
      utterance.rate = 0.85 // Slower for farmers to understand
      utterance.pitch = 1
      utterance.volume = 1

      utterance.onend = () => {
        currentIndex++
        // Small pause between alerts
        setTimeout(() => {
          speakNext()
        }, 500)
      }

      utterance.onerror = () => {
        setIsSpeaking(false)
        currentUtteranceRef.current = null
      }

      currentUtteranceRef.current = utterance
      synth.speak(utterance)
    }

    setIsSpeaking(true)
    speakNext()
  }, [notifications, speechLanguage, addNotification])

  // Function to stop speaking
  const stopSpeaking = useCallback(() => {
    if (speechSynthesisRef.current && currentUtteranceRef.current) {
      speechSynthesisRef.current.cancel()
      setIsSpeaking(false)
      currentUtteranceRef.current = null
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (speechSynthesisRef.current) {
        speechSynthesisRef.current.cancel()
      }
    }
  }, [])

  // Function to redirect to WhatsApp with message
  const sendWhatsAppMessage = useCallback((text: string) => {
    // Add "kissan" prefix to the message
    let message = text.trim() || ''
    if (message && !message.toLowerCase().startsWith('kissan')) {
      message = `kissan ${message}`
    } else if (!message) {
      message = 'kissan'
    }
    
    // WhatsApp number: +91 76709 97498
    const phoneNumber = '917670997498' // Remove + and spaces
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`
    
    // Open WhatsApp in new tab
    if (typeof window !== 'undefined') {
    window.open(whatsappUrl, '_blank')
      
      addNotification({
        title: "✅ WhatsApp Opened",
        message: `Message ready: "${message}"`,
        type: "success"
      })
    }
  }, [addNotification])

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
      
      // Create new recognition instance
      recognitionRef.current = new SpeechRecognition()
      
      // Configure recognition
      recognitionRef.current.continuous = true // Keep listening until stopped
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = speechLanguage // Use selected language

      recognitionRef.current.onstart = () => {
        setIsListening(true)
        setVoiceTranscript('')
      }

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = ''
        let finalTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' '
          } else {
            interimTranscript += transcript
          }
        }

        // Show interim results as user speaks
        if (interimTranscript) {
          setVoiceTranscript(interimTranscript)
          setQuickText(interimTranscript)
        }

        // Update final transcript
        if (finalTranscript.trim()) {
          const fullTranscript = finalTranscript.trim()
          setVoiceTranscript(fullTranscript)
          setQuickText(fullTranscript)
        }
      }

      recognitionRef.current.onend = () => {
        // Only set listening to false if it was actually listening
        // This prevents issues when manually stopping
        if (isListening) {
          setIsListening(false)
        }
      }

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        // Don't stop on all errors, only critical ones
        if (event.error === 'no-speech' || event.error === 'aborted') {
          // These are normal, just continue
          return
        }
        setIsListening(false)
        addNotification({
          title: "❌ Voice Error",
          message: "Could not recognize speech. Please try again.",
          type: "warning"
        })
      }
    } else {
      // Browser doesn't support speech recognition
      addNotification({
        title: "❌ Not Supported",
        message: "Voice recognition is not supported in this browser.",
        type: "warning"
      })
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch {
          // ignore cleanup errors
        }
      }
    }
  }, [addNotification, speechLanguage]) // Remove isListening and sendWhatsAppMessage from deps

  // Listen to hash changes from navbar
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '')
      if (hash === 'operations' || hash === 'analysis' || hash === 'questions') {
        setActiveTab(hash as 'operations' | 'analysis' | 'questions')
      }
    }

    // Check initial hash
    const hash = window.location.hash.replace('#', '')
    if (hash === 'operations' || hash === 'analysis' || hash === 'questions') {
      setActiveTab(hash as 'operations' | 'analysis' | 'questions')
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])



  // Translation function for notification titles (comprehensive)
  const translateNotificationTitle = (title: string): string => {
    const translations: Record<string, string> = {
      // System messages
      '✅ Message Sent Automatically': '✅ संदेश स्वचालित रूप से भेजा गया',
      '⚠️ Session Required': '⚠️ सत्र आवश्यक',
      '⚠️ API Error': '⚠️ एपीआई त्रुटि',
      '⚠️ Connection Error': '⚠️ कनेक्शन त्रुटि',
      '❌ Voice Error': '❌ आवाज त्रुटि',
      '⚠️ Not Supported': '⚠️ समर्थित नहीं',
      '❌ Not Supported': '❌ समर्थित नहीं',
      
      // Water quality titles
      '⚠️ Very Salty Water Detected': '⚠️ बहुत नमकीन पानी का पता चला',
      '⚠️ Bad Water Quality': '⚠️ खराब पानी की गुणवत्ता',
      '⚠️ Water Becoming Salty': '⚠️ पानी नमकीन हो रहा है',
      
      // Temperature titles
      '🔥 Extreme Heat Alert': '🔥 अत्यधिक गर्मी चेतावनी',
      '🌡️ High Temperature': '🌡️ उच्च तापमान',
      '❄️ Too Cold': '❄️ बहुत ठंडा',
      
      // Humidity titles
      '💧 Very High Humidity': '💧 बहुत अधिक नमी',
      '💧 High Humidity': '💧 उच्च नमी',
      '💨 Low Humidity': '💨 कम नमी',
      
      // Soil moisture titles
      '🌊 Flooding Detected': '🌊 बाढ़ का पता चला',
      '🌵 Dry Soil Alert': '🌵 सूखी मिट्टी चेतावनी',
      
      // Gas/Air quality titles
      '☠️ Dangerous Gas Level': '☠️ खतरनाक गैस स्तर',
      
      // Light titles
      '☀️ Very High Sunlight': '☀️ बहुत अधिक धूप',
      
      // Motion titles
      '👁️ Movement Detected': '👁️ गति का पता चला',
      
      // Mixed condition titles
      '🚨 High Temperature + Dry Soil': '🚨 उच्च तापमान + सूखी मिट्टी',
      '🚨 High Temperature + High Humidity': '🚨 उच्च तापमान + उच्च नमी',
      '🚨 High Humidity + Low Light': '🚨 उच्च नमी + कम रोशनी',
      '🚨 Very High Sunlight + Dry Soil': '🚨 बहुत अधिक धूप + सूखी मिट्टी',
      '🚨 High TDS + High Temperature': '🚨 उच्च टीडीएस + उच्च तापमान',
      '🚨 Flooding + High Humidity': '🚨 बाढ़ + उच्च नमी',
      '🚨 Dangerous Gas + High Temperature': '🚨 खतरनाक गैस + उच्च तापमान',
      '🚨 Motion Detected + Low Light (Night)': '🚨 गति का पता चला + कम रोशनी (रात)',
    }
    
    // Try exact match first
    if (translations[title]) return translations[title]
    
    // Try pattern matching for titles with emojis
    if (title.includes('⚠️')) {
      return title.replace('⚠️', '⚠️').replace(/Very Salty Water Detected/, 'बहुत नमकीन पानी का पता चला')
        .replace(/Bad Water Quality/, 'खराब पानी की गुणवत्ता')
        .replace(/Water Becoming Salty/, 'पानी नमकीन हो रहा है')
    }
    
    return title
  }

  // Translation function for notification messages (comprehensive)
  const translateNotificationMessage = (message: string): string => {
    const translations: Record<string, string> = {
      // WhatsApp messages
      'sent to WhatsApp successfully': 'व्हाट्सएप पर सफलतापूर्वक भेजा गया',
      'Message sent to WhatsApp successfully': 'संदेश व्हाट्सएप पर सफलतापूर्वक भेजा गया',
      'Please send \'Hi\' to +91 76709 97498 first to start a session. Then messages will send automatically.': 'कृपया पहले +91 76709 97498 पर \'Hi\' भेजें सत्र शुरू करने के लिए। फिर संदेश स्वचालित रूप से भेजे जाएंगे।',
      'Could not connect to backend API. Please check your connection.': 'बैकएंड एपीआई से कनेक्ट नहीं हो सका। कृपया अपना कनेक्शन जांचें।',
      'Text-to-speech is not available in your browser.': 'आपके ब्राउज़र में टेक्स्ट-टू-स्पीच उपलब्ध नहीं है।',
      'Could not recognize speech. Please try again.': 'भाषण को पहचान नहीं सका। कृपया पुनः प्रयास करें।',
      'Could not start voice recognition. Please check browser permissions.': 'आवाज पहचान शुरू नहीं कर सका। कृपया ब्राउज़र अनुमतियां जांचें।',
      'Voice recognition is not supported in this browser.': 'इस ब्राउज़र में आवाज पहचान समर्थित नहीं है।',
      
      // Water quality messages
      'Avoid using; harvest rainwater.': 'उपयोग से बचें; बारिश का पानी इकट्ठा करें।',
      'Leaves may turn yellow. Dilute water.': 'पत्तियां पीली हो सकती हैं। पानी पतला करें।',
      'Mix with fresh water.': 'ताजा पानी के साथ मिलाएं।',
      
      // Temperature messages
      'Crop burn risk! Use shade nets and mulching.': 'फसल जलने का खतरा! छाया जाली और मल्चिंग का उपयोग करें।',
      'Leaves may dry. Water morning/evening.': 'पत्तियां सूख सकती हैं। सुबह/शाम पानी दें।',
      'Growth slows. Reduce watering.': 'वृद्धि धीमी होती है। पानी कम करें।',
      
      // Humidity messages
      'Disease guaranteed! Ventilate and use fungicide.': 'रोग निश्चित है! हवादार करें और कवकनाशी का उपयोग करें।',
      'Fungus risk. Increase ventilation.': 'कवक का खतरा। वेंटिलेशन बढ़ाएं।',
      'Plants dry fast. Increase irrigation.': 'पौधे तेजी से सूखते हैं। सिंचाई बढ़ाएं।',
      
      // Soil moisture messages
      'Root rot risk! Improve drainage.': 'जड़ सड़ने का खतरा! जल निकासी में सुधार करें।',
      'Plants wilting! Start irrigation.': 'पौधे मुरझा रहे हैं! सिंचाई शुरू करें।',
      
      // Gas/Air quality messages
      'Crop damage risk! Ventilate immediately.': 'फसल क्षति का खतरा! तुरंत हवादार करें।',
      
      // Light messages
      'Leaf burn risk! Use shade net.': 'पत्ती जलने का खतरा! छाया जाली का उपयोग करें।',
      
      // Motion messages
      'Animal or human movement detected in the field. Activate alarm/light.': 'खेत में जानवर या मानव गति का पता चला। अलार्म/लाइट सक्रिय करें।',
      
      // Mixed condition messages
      'Plants wilting fast': 'पौधे तेजी से मुरझा रहे हैं',
      'Water early morning, mulching': 'सुबह जल्दी पानी, मल्चिंग',
      'Fungal disease risk': 'कवक रोग का खतरा',
      'Ventilation, reduce watering': 'वेंटिलेशन, पानी कम करें',
      'Leaf rot, fungal growth': 'पत्ती सड़न, कवक वृद्धि',
      'Airflow': 'हवा का प्रवाह',
      'Leaf burn risk': 'पत्ती जलने का खतरा',
      'Shade net': 'छाया जाली',
      'Salt burn increases': 'नमक जलन बढ़ती है',
      'Dilute water': 'पानी पतला करें',
      'Root rot + fungus': 'जड़ सड़न + कवक',
      'Stop irrigation': 'सिंचाई बंद करें',
      'Chemical + heat damage': 'रासायनिक + गर्मी क्षति',
      'Ventilation': 'वेंटिलेशन',
      'Animal entry detected': 'जानवर प्रवेश का पता चला',
      'Alarm / SMS': 'अलार्म / एसएमएस',
    }
    
    // Try exact match first
    if (translations[message]) return translations[message]
    
    // Try to translate patterns with numbers
    let translated = message
    
    // TDS patterns
    translated = translated.replace(/TDS is ([\d.]+) ppm\./g, 'टीडीएस $1 पीपीएम है।')
    translated = translated.replace(/TDS is ([\d.]+) ppm/g, 'टीडीएस $1 पीपीएम है')
    
    // Temperature patterns
    translated = translated.replace(/Temperature is ([\d.]+)°C\./g, 'तापमान $1 डिग्री सेल्सियस है।')
    translated = translated.replace(/Temperature is ([\d.]+)°C/g, 'तापमान $1 डिग्री सेल्सियस है')
    
    // Humidity patterns
    translated = translated.replace(/Humidity is ([\d.]+)%\./g, 'नमी $1 प्रतिशत है।')
    translated = translated.replace(/Humidity is ([\d.]+)%/g, 'नमी $1 प्रतिशत है')
    
    // Soil moisture patterns
    translated = translated.replace(/Soil moisture is ([\d.]+)%\./g, 'मिट्टी की नमी $1 प्रतिशत है।')
    translated = translated.replace(/Soil moisture is ([\d.]+)%/g, 'मिट्टी की नमी $1 प्रतिशत है')
    
    // Gas level patterns
    translated = translated.replace(/Gas level is ([\d.]+) ppm\./g, 'गैस स्तर $1 पीपीएम है।')
    translated = translated.replace(/Gas level is ([\d.]+) ppm/g, 'गैस स्तर $1 पीपीएम है')
    
    // Light level patterns
    translated = translated.replace(/Light level is ([\d.]+)\./g, 'प्रकाश स्तर $1 है।')
    translated = translated.replace(/Light level is ([\d.]+)/g, 'प्रकाश स्तर $1 है')
    
    // Try partial matches for remaining text
    for (const [key, value] of Object.entries(translations)) {
      if (translated.includes(key)) {
        translated = translated.replace(key, value)
      }
    }
    
    return translated !== message ? translated : message
  }



  const startVoiceListening = () => {
    if (!recognitionRef.current) {
      addNotification({
        title: "❌ Not Supported",
        message: "Voice recognition is not supported in this browser.",
        type: "warning"
      })
      return
    }

    try {
      // Update language before starting
      recognitionRef.current.lang = speechLanguage
      
      // Clear previous transcript
      setVoiceTranscript('')
      setQuickText('')
      
      // Start recognition
      recognitionRef.current.start()
      setIsListening(true)
    } catch (error: any) {
      console.error('Error starting speech recognition:', error)
      
      // If already started, ignore the error
      if (error.message?.includes('already started') || error.message?.includes('started')) {
        return
      }
      
      addNotification({
        title: "❌ Voice Error",
        message: "Could not start voice recognition. Please check browser permissions.",
        type: "warning"
      })
      setIsListening(false)
    }
  }

  const stopVoiceListening = () => {
    if (!recognitionRef.current) {
      return
    }

    try {
      recognitionRef.current.stop()
      setIsListening(false)
      
      // Process final transcript if available and send to WhatsApp
      if (voiceTranscript.trim()) {
        setTimeout(() => {
          sendWhatsAppMessage(voiceTranscript.trim())
        }, 300)
      }
    } catch (error) {
      console.error('Error stopping speech recognition:', error)
      setIsListening(false)
    }
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <NewNavbar />
      <ToastContainer 
        notifications={notifications} 
        onClose={removeNotification} 
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pt-20">
        {/* Header */}
          <motion.div
          initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-2">
            <Sprout className="w-10 h-10 text-green-600" />
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">🌾 Krishi Mithr</h1>
          </div>
          <p className="text-lg text-gray-700">Your simple farm remote</p>
            </motion.div>

        {/* Tab Content */}
            <motion.div
          key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'operations' && (
            <div className="space-y-6">
              {/* Controls */}
              <RelayControls speechLanguage={speechLanguage} />
              
              {/* Notifications List */}
              <Card className="p-6 bg-white border-2 border-blue-200 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Bell className="w-6 h-6 text-blue-600" />
                    <h2 className="text-2xl font-bold text-gray-900">Recent Alerts</h2>
                    {notifications.length > 0 && (
                      <span className="text-sm text-gray-500">
                        ({notifications.length} alerts)
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Language Selector */}
                    <select
                      value={speechLanguage}
                      onChange={(e) => setSpeechLanguage(e.target.value)}
                      disabled={isSpeaking}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="en-US">English</option>
                      <option value="hi-IN">हिंदी (Hindi)</option>
                    </select>
                    
                    {notifications.length > 0 && (
                      <Button 
                        onClick={isSpeaking ? stopSpeaking : speakAlerts}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        {isSpeaking ? (
                          <>
                            <VolumeX className="w-4 h-4" />
                            Stop Speaking
                </>
              ) : (
                <>
                            <Volume2 className="w-4 h-4" />
                            Listen to Alerts
                </>
              )}
                      </Button>
                    )}
                  </div>
                </div>
                {notifications.length > 0 ? (
                  <div className="space-y-3">
                    {/* All notifications (sensor alerts are already included) */}
                    {notifications.slice().reverse().map((notif) => {
                      // Translate titles and messages based on selected language
                      const displayTitle = speechLanguage === 'hi-IN' ? translateNotificationTitle(notif.title) : notif.title
                      const displayMessage = speechLanguage === 'hi-IN' ? translateNotificationMessage(notif.message) : notif.message
                      
                      return (
                        <div
                          key={notif.id}
                          className={`p-4 rounded-lg border-2 ${
                            notif.type === 'danger' ? 'bg-red-50 border-red-200' :
                            notif.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                            notif.type === 'success' ? 'bg-green-50 border-green-200' :
                            'bg-blue-50 border-blue-200'
                          }`}
                        >
                          <h3 className="font-bold text-gray-900 mb-1">{displayTitle}</h3>
                          <p className="text-sm text-gray-700">{displayMessage}</p>
              </div>
                      )
                    })}
              </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">No alerts right now. Everything looks good!</p>
                    <Button
                      onClick={speakAlerts}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2 mx-auto"
                    >
                      <Volume2 className="w-4 h-4" />
                      Listen to Status
                    </Button>
                  </div>
                )}
              </Card>

              {/* Hidden sensor display for notifications */}
              <div className="hidden">
                <SensorStatusDisplay 
                  onConditionDetected={(notification) => {
                    addNotification({
                      title: notification.title,
                      message: notification.message,
                      type: notification.type,
                      icon: notification.icon,
                      duration: notification.type === "danger" ? 8000 : 6000
                    })
                  }}
                />
              </div>
                </div>
          )}

          {activeTab === 'analysis' && (
            <FarmAnalysis />
          )}

          {activeTab === 'questions' && (
            <div className="space-y-6">
              <Card className="p-8 bg-white border-2 border-green-200 rounded-xl text-center">
                <div className="text-5xl mb-4">💬</div>
                <h2 className="text-3xl font-bold text-gray-900 mb-3">Ask Your Questions</h2>
                <p className="text-lg text-gray-600 mb-6">
                  Get instant help from our farming expert via WhatsApp
                </p>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-4 md:p-6 bg-white border-2 border-green-200 rounded-xl">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Mic className="w-5 h-5 text-green-600" />
                    Voice Ask (interactive)
                  </h3>
                  <VoiceChat
                    demoMode={false}
                    onStart={startVoiceListening}
                    onStop={() => stopVoiceListening()}
                    onVolumeChange={(vol) => {
                      // mild haptic via console; hook available if needed
                      if (vol > 80) console.debug('[VOICE] loud input', vol)
                    }}
                    className="bg-white"
                  />
                  {voiceTranscript && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">You said:</p>
                      <p className="text-base font-medium text-gray-900">{voiceTranscript}</p>
              </div>
                  )}
            </Card>

                <Card className="p-6 bg-white border-2 border-blue-200 rounded-xl">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Type or send instantly</h3>
                  <div className="flex gap-3 mb-4">
                    <input
                      value={quickText}
                      onChange={(e) => setQuickText(e.target.value)}
                      placeholder="Type your question here..."
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && quickText.trim()) {
                          sendWhatsAppMessage(quickText.trim())
                          setQuickText('')
                        }
                      }}
                      className="flex-1 px-5 py-4 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-base"
                    />
              <Button 
                      onClick={() => {
                        if (!quickText.trim()) return
                        sendWhatsAppMessage(quickText.trim())
                        setQuickText('')
                      }}
                      disabled={!quickText.trim()}
                      className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-base font-semibold rounded-lg disabled:opacity-50"
                    >
                      Send
              </Button>
                  </div>
                  <Button
                    onClick={() => {
                      sendWhatsAppMessage('')
                    }}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-4 text-lg font-semibold rounded-lg"
                  >
                    📱 Send "kissan" to WhatsApp
                  </Button>
                </Card>
              </div>
            </div>
          )}
          </motion.div>
        </div>
    </div>
  )
}

export default SmartAgriTechComponent

// TypeScript declarations for Speech Recognition
declare global {
  interface Window {
    webkitSpeechRecognition: any
    SpeechRecognition: any
  }
}
