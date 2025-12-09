import React from 'react'
import { Wrench, ShoppingCart, Star, Truck } from 'lucide-react'

export default function ToolsPage() {
  const tools = [
    {
      id: 1,
      name: "Smart Irrigation System",
      price: "₹25,000",
      originalPrice: "₹30,000",
      rating: 4.7,
      image: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&h=300&fit=crop",
      category: "Irrigation",
      features: ["Automated watering", "Soil moisture sensor", "Mobile app control"]
    },
    {
      id: 2,
      name: "Drone Sprayer",
      price: "₹1,50,000",
      originalPrice: "₹1,80,000",
      rating: 4.9,
      image: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&h=300&fit=crop",
      category: "Spraying",
      features: ["GPS navigation", "Precision spraying"]
    },
    {
      id: 3,
      name: "Soil Testing Kit",
      price: "₹8,500",
      originalPrice: "₹10,000",
      rating: 4.5,
      image: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&h=300&fit=crop",
      category: "Testing",
      features: ["pH testing", "Nutrient analysis", "Portable design"]
    },
    {
      id: 4,
      name: "Smart Tractor",
      price: "₹8,50,000",
      originalPrice: "₹9,00,000",
      rating: 4.8,
      image: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&h=300&fit=crop",
      category: "Machinery",
      features: ["Autonomous driving", "GPS guidance", "Fuel efficient"]
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
            <Wrench className="w-8 h-8 text-orange-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Farming Tools Marketplace</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover and purchase the latest agricultural tools and equipment
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {tools.map((tool) => (
            <div key={tool.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              <div className="relative">
                <img 
                  src={tool.image} 
                  alt={tool.name}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                  {tool.category}
                </div>
                <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                  Sale
                </div>
              </div>
              
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{tool.name}</h3>
                
                <div className="flex items-center mb-2">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span className="ml-1 text-sm text-gray-600">{tool.rating}</span>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl font-bold text-green-600">{tool.price}</span>
                  <span className="text-sm text-gray-500 line-through">{tool.originalPrice}</span>
                </div>

                <div className="space-y-1 mb-4">
                  {tool.features.map((feature, index) => (
                    <div key={index} className="text-xs text-gray-600 flex items-center">
                      <div className="w-1 h-1 bg-green-500 rounded-full mr-2"></div>
                      {feature}
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button className="flex-1 bg-green-600 text-white py-2 px-3 rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold flex items-center justify-center">
                    <ShoppingCart className="w-4 h-4 mr-1" />
                    Add to Cart
                  </button>
                  <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <Truck className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Tool Categories</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center p-6 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer">
              <Wrench className="w-12 h-12 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-blue-800">Hand Tools</h3>
              <p className="text-sm text-blue-600 mt-2">Basic farming implements</p>
            </div>
            <div className="text-center p-6 bg-green-50 rounded-lg hover:bg-green-100 transition-colors cursor-pointer">
              <Wrench className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold text-green-800">Machinery</h3>
              <p className="text-sm text-green-600 mt-2">Heavy equipment</p>
            </div>
            <div className="text-center p-6 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors cursor-pointer">
              <Wrench className="w-12 h-12 text-purple-600 mx-auto mb-3" />
              <h3 className="font-semibold text-purple-800">Smart Tech</h3>
              <p className="text-sm text-purple-600 mt-2">IoT and automation</p>
            </div>
            <div className="text-center p-6 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors cursor-pointer">
              <Wrench className="w-12 h-12 text-orange-600 mx-auto mb-3" />
              <h3 className="font-semibold text-orange-800">Maintenance</h3>
              <p className="text-sm text-orange-600 mt-2">Repair and service</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
