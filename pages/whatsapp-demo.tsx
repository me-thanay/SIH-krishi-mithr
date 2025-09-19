import { MessageCircle } from "lucide-react"

export default function WhatsAppDemo() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="mb-8">
          <MessageCircle size={80} className="mx-auto text-green-600 mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            WhatsApp Agricultural Support
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Get instant agricultural support through WhatsApp. Our AI assistant provides weather updates, 
            market prices, soil analysis, and crop advice in multiple Indian languages.
          </p>
        </div>
        
        <button
          onClick={() => window.open('https://wa.me/7670997498?text=Hello! I need agricultural support.', '_blank')}
          className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg text-lg font-semibold flex items-center space-x-2 mx-auto"
        >
          <MessageCircle size={24} />
          <span>Start WhatsApp Chat</span>
        </button>
        
        <div className="mt-8 text-sm text-gray-500">
          <p>Available 24/7 for agricultural support</p>
        </div>
      </div>
    </div>
  )
}
