import SmartAgriTechComponent from "@/components/smart-agri-tech"
import { Footer } from "@/components/ui/footer"
import { VoiceAssistant } from "@/components/ui/voice-assistant"

export default function Home() {
  return (
    <>
      <SmartAgriTechComponent />
      
      {/* Voice Assistant Section */}
      <section className="py-16 bg-gradient-to-br from-green-50 to-blue-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              🎤 Voice Assistant for Farmers
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Speak in your language - English, Hindi, Telugu, Tamil, and more!
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="font-semibold text-green-600 mb-2">🌤️ Weather Queries</h3>
                <p className="text-sm text-gray-600">"What's the weather in Hyderabad?"</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="font-semibold text-blue-600 mb-2">💰 Market Prices</h3>
                <p className="text-sm text-gray-600">"What's the price of rice?"</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="font-semibold text-purple-600 mb-2">🌱 Crop Advice</h3>
                <p className="text-sm text-gray-600">"Give me soil advice"</p>
              </div>
            </div>
          </div>
          
          <VoiceAssistant className="max-w-2xl mx-auto" />
        </div>
      </section>
      
      <Footer />
    </>
  )
}
