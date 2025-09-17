"use client"

import React, { useState } from "react"

export const VoiceDebug = () => {
  const [status, setStatus] = useState("")
  const [transcript, setTranscript] = useState("")

  const testSpeechRecognition = () => {
    setStatus("Testing speech recognition...")
    
    // Check if speech recognition is available
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setStatus("❌ Speech recognition not supported in this browser")
      return
    }

    setStatus("✅ Speech recognition supported")
    
    // Test microphone access
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(() => {
        setStatus("✅ Microphone access granted")
        
        // Test speech recognition
        const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition
        const recognition = new SpeechRecognition()
        
        recognition.continuous = false
        recognition.interimResults = false
        recognition.lang = 'en-US'
        
        recognition.onstart = () => {
          setStatus("🎤 Listening... Speak now!")
        }
        
        recognition.onresult = (event: any) => {
          const text = event.results[0][0].transcript
          setTranscript(text)
          setStatus(`✅ Recognized: "${text}"`)
        }
        
        recognition.onerror = (event: any) => {
          setStatus(`❌ Error: ${event.error}`)
        }
        
        recognition.onend = () => {
          setStatus("✅ Recognition ended")
        }
        
        recognition.start()
      })
      .catch((error) => {
        setStatus(`❌ Microphone access denied: ${error.message}`)
      })
  }

  const testWhatsAppRedirect = () => {
    const phoneNumber = "7670997498"
    const message = "kissan test message"
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`
    
    setStatus(`Opening WhatsApp: ${whatsappUrl}`)
    window.open(whatsappUrl, '_blank')
  }

  return (
    <div className="p-6 bg-white border rounded-lg shadow-lg max-w-md mx-auto">
      <h3 className="text-lg font-bold mb-4">Voice Assistant Debug</h3>
      
      <div className="space-y-4">
        <button
          onClick={testSpeechRecognition}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Test Speech Recognition
        </button>
        
        <button
          onClick={testWhatsAppRedirect}
          className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Test WhatsApp Redirect
        </button>
        
        <div className="p-3 bg-gray-100 rounded">
          <p className="text-sm font-medium">Status:</p>
          <p className="text-sm">{status}</p>
        </div>
        
        {transcript && (
          <div className="p-3 bg-green-100 rounded">
            <p className="text-sm font-medium">Transcript:</p>
            <p className="text-sm">{transcript}</p>
          </div>
        )}
        
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Make sure microphone permissions are granted</p>
          <p>• Try Chrome or Edge browser</p>
          <p>• Speak clearly and wait for recognition to complete</p>
        </div>
      </div>
    </div>
  )
}

