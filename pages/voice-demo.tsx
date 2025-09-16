import { VoiceAssistant } from "../src/components/ui/voice-assistant"

export default function VoiceDemo() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
      <VoiceAssistant 
        onVoiceResult={(text) => {
          console.log('Voice input received:', text)
        }}
        className="max-w-lg"
      />
    </div>
  )
}
