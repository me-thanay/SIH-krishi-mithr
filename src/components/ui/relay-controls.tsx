"use client"

import React, { useEffect, useState } from "react"
import { StatsBento, type FarmControlId, type FarmControlState } from "./stats-bento"

function parseOnFlag(value: unknown): boolean | null {
  if (value === true || value === 1) return true
  if (value === false || value === 0) return false
  if (typeof value === "string") {
    const s = value.trim().toLowerCase()
    if (["true", "1", "on", "yes"].includes(s)) return true
    if (["false", "0", "off", "no", ""].includes(s)) return false
  }
  return null
}

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
  const [controlStates, setControlStates] = useState<FarmControlState>({
    motor: false,
    hv: false,
    hv_auto: false,
  })
  const [busyUntil, setBusyUntil] = useState(0)

  const syncFromEsp = async () => {
    if (Date.now() < busyUntil) return
    try {
      const response = await fetch("/api/sensor-data/latest")
      const json = await response.json()
      const row = json?.data
      if (!row) return
      const motor = parseOnFlag(row.motor_on) ?? parseOnFlag(row.motor)
      const hv = parseOnFlag(row.hv_on) ?? parseOnFlag(row.hv)
      const hvAuto = parseOnFlag(row.hv_auto_on) ?? parseOnFlag(row.hv_auto)
      setControlStates((prev) => ({
        motor: motor ?? prev.motor,
        hv: hv ?? prev.hv,
        hv_auto: hvAuto ?? prev.hv_auto,
      }))
    } catch {
      /* keep last known command state */
    }
  }

  useEffect(() => {
    void syncFromEsp()
    const timer = setInterval(() => void syncFromEsp(), 5000)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busyUntil])

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
        // Optimistic, then ESP MQTT `motor` field is the source of truth.
        const isOn = command.includes(':on')
        setControlStates(prev => ({ ...prev, [controlId]: isOn }))
        setBusyUntil(Date.now() + 8000)
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

  const commands: Record<FarmControlId, { on: string; off: string }> = {
    motor: { on: "motor:on", off: "motor:off" },
    hv: { on: "hv:on", off: "hv:off" },
    hv_auto: { on: "hv_auto:on", off: "hv_auto:off" },
  }

  const handleToggle = (id: FarmControlId) => {
    const isCurrentlyOn = controlStates[id]
    const command = isCurrentlyOn ? commands[id].off : commands[id].on
    sendRelayCommand(command, id)
  }

  return (
    <div className={className}>
      <StatsBento
        states={controlStates}
        loading={loading}
        lastCommand={lastCommand}
        onToggle={handleToggle}
      />
    </div>
  )
}

