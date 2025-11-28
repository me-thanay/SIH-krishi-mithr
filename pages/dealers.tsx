import React from 'react'
import { Users, MapPin, Phone, Star } from 'lucide-react'

export default function DealersPage() {
  const dealers = [
    {
      id: 1,
      name: "Green Valley Seeds",
      location: "Punjab, India",
      rating: 4.8,
      phone: "+91 98765 43210",
      specialties: ["Seeds", "Fertilizers", "Equipment"],
      distance: "5.2 km"
    },
    {
      id: 2,
      name: "AgriTech Solutions",
      location: "Haryana, India",
      rating: 4.6,
      phone: "+91 87654 32109",
      specialties: ["Machinery", "Tools", "Consultation"],
      distance: "12.8 km"
    },
    {
      id: 3,
      name: "Farm Fresh Supplies",
      location: "Uttar Pradesh, India",
      rating: 4.9,
      phone: "+91 76543 21098",
      specialties: ["Organic Products", "Pesticides", "Seeds"],
      distance: "8.5 km"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Users className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Dealer Network</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Connect with trusted agricultural suppliers and service providers in your area
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {dealers.map((dealer) => (
            <div key={dealer.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">{dealer.name}</h3>
                <div className="flex items-center">
                  <Star className="w-5 h-5 text-yellow-500 fill-current" />
                  <span className="ml-1 text-sm font-semibold text-gray-700">{dealer.rating}</span>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center text-gray-600">
                  <MapPin className="w-5 h-5 mr-2" />
                  <span className="text-sm">{dealer.location}</span>
                  <span className="ml-auto text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    {dealer.distance}
                  </span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Phone className="w-5 h-5 mr-2" />
                  <span className="text-sm">{dealer.phone}</span>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Specialties:</h4>
                <div className="flex flex-wrap gap-2">
                  {dealer.specialties.map((specialty, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold">
                  Contact
                </button>
                <button className="flex-1 border border-green-600 text-green-600 py-2 px-4 rounded-lg hover:bg-green-50 transition-colors text-sm font-semibold">
                  View Profile
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Become a Dealer</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Join Our Network</h3>
              <p className="text-gray-600 mb-4">
                Connect with thousands of farmers and expand your business reach through our platform.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Access to verified farmer database</li>
                <li>• Marketing support and tools</li>
                <li>• Payment protection</li>
                <li>• Training and certification</li>
              </ul>
            </div>
            <div className="space-y-4">
              <input 
                type="text" 
                placeholder="Business Name" 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <input 
                type="email" 
                placeholder="Email Address" 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <input 
                type="tel" 
                placeholder="Phone Number" 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <button className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-semibold">
                Apply Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
