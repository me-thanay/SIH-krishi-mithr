"use client"

import React, { useState } from 'react'
import { MessageCircle, Send, CheckCircle, XCircle } from 'lucide-react'

export default function TestWhatsAppPage() {
  const [phoneNumber, setPhoneNumber] = useState('7670997498')
  const [message, setMessage] = useState('kissan')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleSend = async () => {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: phoneNumber,
          message: message
        })
      })

      const data = await response.json()
      setResult({
        success: response.ok,
        status: response.status,
        data: data
      })
    } catch (error: any) {
      setResult({
        success: false,
        error: error.message
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mb-4">
            <MessageCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Test WhatsApp API</h1>
          <p className="text-gray-600">Test sending WhatsApp messages locally</p>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="7670997498"
            />
            <p className="mt-1 text-sm text-gray-500">Enter phone number (will be formatted as +91)</p>
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
              Message
            </label>
            <input
              type="text"
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="kissan"
            />
          </div>

          <button
            onClick={handleSend}
            disabled={loading || !phoneNumber || !message}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>Send WhatsApp Message</span>
              </>
            )}
          </button>

          {result && (
            <div className={`mt-4 p-4 rounded-lg ${
              result.success 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-start gap-3">
                {result.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <h3 className={`font-semibold mb-2 ${
                    result.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {result.success ? 'Success!' : 'Error'}
                  </h3>
                  <pre className="text-xs overflow-auto bg-white p-3 rounded border">
                    {JSON.stringify(result.data || result, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Setup Instructions:</h4>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Create or update <code className="bg-blue-100 px-1 rounded">.env.local</code> file</li>
              <li>Add: <code className="bg-blue-100 px-1 rounded">WHATSAPP_ACCESS_TOKEN=your_token</code></li>
              <li>Add: <code className="bg-blue-100 px-1 rounded">WHATSAPP_PHONE_NUMBER_ID=your_id</code></li>
              <li>Restart dev server after adding variables</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}

