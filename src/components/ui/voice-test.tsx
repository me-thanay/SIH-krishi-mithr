"use client"

import React, { useState } from "react"
import { Button } from "./button"

export const VoiceTest = () => {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [response, setResponse] = useState("")

  const startListening = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition
      const recognition = new SpeechRecognition()
      
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'en-US'

      recognition.onstart = () => {
        setIsListening(true)
        setTranscript("")
        setResponse("")
      }

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setTranscript(transcript)
        processVoiceInput(transcript)
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
      }

      recognition.start()
    } else {
      alert('Speech recognition not supported in this browser')
    }
  }

  const processVoiceInput = async (text: string) => {
    try {
      console.log('Processing voice input:', text)
      
      // Show processing message
      setResponse("Converting voice to text and sending to WhatsApp...")
      
      // Directly redirect to WhatsApp with the voice text + kissan prefix
      const phoneNumber = "7670997498"
      const message = `kissan ${text}`
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`
      
      console.log('Opening WhatsApp with message:', message)
      console.log('WhatsApp URL:', whatsappUrl)
      
      // Open WhatsApp immediately
      window.open(whatsappUrl, '_blank')
      
      // Update response
      setResponse(`✅ Voice converted to text: "${text}"\n📱 Redirected to WhatsApp with message: "kissan ${text}"`)
      
    } catch (error) {
      console.error('Error:', error)
      setResponse("❌ Error: " + error)
    }
  }

  return (
    <div className="p-4 border rounded-lg max-w-md mx-auto">
      <h3 className="text-lg font-bold mb-4">Voice Test</h3>
      
      <Button 
        onClick={startListening}
        disabled={isListening}
        className="w-full mb-4"
      >
        {isListening ? "Listening..." : "Start Voice"}
      </Button>
      
      {transcript && (
        <div className="mb-4">
          <p className="text-sm text-gray-600">You said:</p>
          <p className="bg-gray-100 p-2 rounded">{transcript}</p>
        </div>
      )}
      
      {response && (
        <div className="mb-4">
          <p className="text-sm text-gray-600">Response:</p>
          <p className="bg-blue-100 p-2 rounded">{response}</p>
        </div>
      )}
    </div>
  )
}

declare global {
  interface Window {
    webkitSpeechRecognition: any
    SpeechRecognition: any
  }
}
