"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import { Power, Droplet, Zap, Settings } from "lucide-react"
import { Card } from "./card"
import { RippleButton } from "./ripple-button"

// Function to speak motor status in selected language
const speakMotorStatus = (controlId: string, isOn: boolean, lang: string) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return

  const synth = window.speechSynthesis
  if (!synth) return

  // Get control names in both languages
  const controlNames: Record<string, { en: string; hi: string }> = {
    motor: { en: 'Irrigation Motor', hi: 'सिंचाई मोटर' },
    hv: { en: 'HV Generator', hi: 'एचवी जेनरेटर' },
    hv_auto: { en: 'HV Auto Mode', hi: 'एचवी ऑटो मोड' },
  }

  const controlName = controlNames[controlId] || { en: 'Device', hi: 'उपकरण' }
  const statusText = isOn 
    ? (lang === 'hi-IN' ? 'चालू हो गया' : 'turned on')
    : (lang === 'hi-IN' ? 'बंद हो गया' : 'turned off')

  const message = lang === 'hi-IN'
    ? `${controlName.hi} ${statusText}`
    : `${controlName.en} ${statusText}`

  const utterance = new SpeechSynthesisUtterance(message)
  utterance.lang = lang
  utterance.rate = 0.9
  utterance.pitch = 1
  utterance.volume = 1

  synth.speak(utterance)
}

interface RelayControlsProps {
  className?: string
  speechLanguage?: string
}

export function RelayControls({ className, speechLanguage = 'en-US' }: RelayControlsProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [lastCommand, setLastCommand] = useState<string | null>(null)
  const [controlStates, setControlStates] = useState<Record<string, boolean>>({
    motor: false,
    hv: false,
    hv_auto: false,
  })

  const sendRelayCommand = async (command: string, controlId: string) => {
    setLoading(command)
    setLastCommand(null)
    
    try {
      const response = await fetch('/api/mqtt/control', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command }),
      })

      // Parse response (whether success or error)
      let data
      try {
        data = await response.json()
      } catch (parseError) {
        // If JSON parsing fails, read as text
        const errorText = await response.text()
        throw new Error(`Server error (${response.status}): ${errorText.substring(0, 200)}`)
      }

      // Check if response is OK
      if (!response.ok) {
        // Use detailed error message if available
        const errorMsg = data.details || data.error || `HTTP ${response.status}`
        throw new Error(errorMsg)
      }
      
      if (data.success) {
        // Update state based on command
        const isOn = command.includes(':on')
        setControlStates(prev => ({ ...prev, [controlId]: isOn }))
        setLastCommand(`✅ ${data.message || `Command '${command}' sent successfully`}`)
        
        // Voice feedback based on language
        speakMotorStatus(controlId, isOn, speechLanguage)
        
        // Clear success message after 3 seconds
        setTimeout(() => setLastCommand(null), 3000)
      } else {
        const errorMsg = data.details || data.error || 'Unknown error'
        setLastCommand(`❌ Failed: ${errorMsg}`)
        setTimeout(() => setLastCommand(null), 8000) // Show longer for backend connection errors
      }
    } catch (error: any) {
      console.error('Error sending relay command:', error)
      // Show user-friendly error message
      const errorMsg = error.message || 'Failed to send command'
      setLastCommand(`❌ Error: ${errorMsg}`)
      setTimeout(() => setLastCommand(null), 8000) // Show longer for errors
    } finally {
      setLoading(null)
    }
  }

  const handleToggle = (control: typeof controls[0]) => {
    const isCurrentlyOn = controlStates[control.id]
    const command = isCurrentlyOn ? control.offCommand : control.onCommand
    sendRelayCommand(command, control.id)
  }

  const controls = [
    {
      id: 'motor',
      name: 'Irrigation Motor',
      description: 'Relay 1 - Pump Control',
      icon: <Droplet className="w-5 h-5" />,
      onCommand: 'motor:on',
      offCommand: 'motor:off',
      color: 'green'
    },
    {
      id: 'hv',
      name: 'HV Generator',
      description: 'Relay 2 - High Voltage',
      icon: <Zap className="w-5 h-5" />,
      onCommand: 'hv:on',
      offCommand: 'hv:off',
      color: 'blue'
    },
    {
      id: 'hv_auto',
      name: 'HV Auto Mode',
      description: 'Motion-triggered Auto',
      icon: <Settings className="w-5 h-5" />,
      onCommand: 'hv_auto:on',
      offCommand: 'hv_auto:off',
      color: 'purple'
    },
  ]

  const getColorClasses = (color: string, isOn: boolean) => {
    const colors: Record<string, { bg: string; hover: string; border: string }> = {
      green: {
        bg: isOn ? 'bg-green-500' : 'bg-green-600',
        hover: 'hover:bg-green-700',
        border: 'border-green-300'
      },
      blue: {
        bg: isOn ? 'bg-blue-500' : 'bg-blue-600',
        hover: 'hover:bg-blue-700',
        border: 'border-blue-300'
      },
      purple: {
        bg: isOn ? 'bg-purple-500' : 'bg-purple-600',
        hover: 'hover:bg-purple-700',
        border: 'border-purple-300'
      },
    }
    return colors[color] || colors.green
  }

  return (
    <div className={className}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <Card className="p-6 bg-white border-2 border-green-200 shadow-sm rounded-xl">
          <div className="text-center mb-6">
            <div className="inline-block p-3 bg-green-100 rounded-full mb-3">
              <Power className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">⚡ Turn On/Off</h2>
            <p className="text-sm text-gray-600">Control your farm equipment</p>
          </div>

          {lastCommand && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-3 p-2.5 rounded-lg text-xs font-medium ${
                lastCommand.includes('✅')
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {lastCommand}
            </motion.div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {controls.map((control) => {
              const isOn = controlStates[control.id]
              const colorClasses = getColorClasses(control.color, isOn)
              const isLoading = loading === control.onCommand || loading === control.offCommand
              
              return (
                <motion.div
                  key={control.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <RippleButton
                    onClick={() => handleToggle(control)}
                    disabled={isLoading}
                    rippleColor={isOn ? '#ffffff' : '#000000'}
                    duration="600ms"
                    className={`w-full p-5 border-2 ${colorClasses.border} ${isOn ? colorClasses.bg : 'bg-white'} rounded-xl shadow-sm transition-all duration-300 ${isOn ? `ring-2 ${control.color === 'green' ? 'ring-green-300' : control.color === 'blue' ? 'ring-blue-300' : 'ring-purple-300'} ring-opacity-50` : ''} disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md`}
                  >
                    <div className="text-center">
                      <div className={`inline-block p-3 rounded-full ${isOn ? 'bg-white bg-opacity-20' : colorClasses.bg} ${isOn ? 'text-white' : 'text-white'} mb-3 transition-all duration-300 ${isOn ? 'scale-110 shadow-lg' : ''}`}>
                        {control.icon}
                      </div>
                      <h3 className={`font-bold text-lg mb-1 ${isOn ? 'text-white' : 'text-gray-900'}`}>
                        {control.name}
                      </h3>
                      <p className={`text-xs mb-2 ${isOn ? 'text-white text-opacity-80' : 'text-gray-500'}`}>
                        {control.description}
                      </p>
                      <div className="flex items-center justify-center gap-2 mt-3">
                        <Power className={`w-4 h-4 ${isOn ? 'text-white' : 'text-gray-400'}`} />
                        <p className={`text-sm font-semibold ${isOn ? 'text-white' : 'text-gray-400'}`}>
                          {isLoading ? (
                            <span className="flex items-center justify-center gap-2">
                              <span className="animate-spin">⏳</span>
                              <span>Sending...</span>
                            </span>
                          ) : (
                            <span>
                              {isOn ? 'ON - Click to Turn OFF' : 'OFF - Click to Turn ON'}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </RippleButton>
                </motion.div>
              )
            })}
          </div>
        </Card>
      </motion.div>
    </div>
  )
}

