"use client"

import React, { useRef, useEffect, useState } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import { 
  Sprout, 
  Cloud, 
  Camera, 
  TrendingUp, 
  Mic, 
  Brain, 
  Users, 
  MessageCircle,
  Leaf,
  Thermometer,
  Bug,
  DollarSign,
  Volume2,
  RefreshCw,
  Heart,
  Smartphone,
} from "lucide-react"
import { Button } from "./ui/button"
import { Card } from "./ui/card"
import { FeatureCard } from "./ui/feature-card"
import { FloatingElement } from "./ui/floating-element"
import { ScrollAnimationContainer } from "./ui/scroll-animation-container"
import { VoiceAssistant } from "./ui/voice-assistant"
import { WhatsAppChat } from "./ui/whatsapp-chat"
import { WhatsAppMessageBar } from "./ui/whatsapp-message-bar"
import { WeatherWidget } from "./ui/weather-widget"
import { WeatherForecast } from "./ui/weather-forecast"
import { MarketPrices } from "./ui/market-prices"
import { SoilDetection } from "./ui/soil-detection"
import { cn } from "@/lib/utils"

// Main Component
const SmartAgriTechComponent = () => {
  const [currentFeature, setCurrentFeature] = useState(0)
  const heroRef = useRef<HTMLDivElement>(null)

  const features = [
    {
      icon: <Sprout className="w-6 h-6" />,
      title: "Real-time Multilingual Crop Advisory",
      description: "Get instant, AI-powered crop recommendations in your local language with real-time monitoring and personalized guidance."
    },
    {
      icon: <Leaf className="w-6 h-6" />,
      title: "Soil Health & Fertilizer Recommendations",
      description: "Advanced soil analysis with precise fertilizer recommendations to optimize crop yield and maintain soil health."
    },
    {
      icon: <Cloud className="w-6 h-6" />,
      title: "Weather Alerts & Predictive Insights",
      description: "Stay ahead with accurate weather forecasts, severe weather alerts, and climate-based farming insights."
    },
    {
      icon: <Camera className="w-6 h-6" />,
      title: "Pest & Disease Detection via Photos",
      description: "Snap a photo to instantly identify pests and diseases with AI-powered image recognition and treatment suggestions."
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Market Price Tracking & Forecasting",
      description: "Real-time market prices and predictive analytics to help you make informed selling decisions."
    },
    {
      icon: <Mic className="w-6 h-6" />,
      title: "Voice Support for Low-literate Users",
      description: "Voice-enabled interface making advanced farming technology accessible to all farmers regardless of literacy level."
    },
    {
      icon: <Brain className="w-6 h-6" />,
      title: "Continuous Learning from Feedback",
      description: "AI system that learns from farmer feedback and local conditions to provide increasingly accurate recommendations."
    }
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length)
    }, 4000)

    return () => clearInterval(interval)
  }, [features.length])

  const handleWhatsAppClick = () => {
    const phoneNumber = "7670997498"
    const message = "kissan"
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <FloatingElement delay={0} duration={4} className="absolute top-20 left-10">
          <div className="w-16 h-16 bg-green-200 rounded-full opacity-30" />
        </FloatingElement>
        <FloatingElement delay={1} duration={5} className="absolute top-40 right-20">
          <div className="w-12 h-12 bg-blue-200 rounded-full opacity-40" />
        </FloatingElement>
        <FloatingElement delay={2} duration={3.5} className="absolute bottom-40 left-1/4">
          <div className="w-20 h-20 bg-yellow-200 rounded-full opacity-25" />
        </FloatingElement>
        <FloatingElement delay={1.5} duration={4.5} className="absolute bottom-20 right-1/3">
          <div className="w-14 h-14 bg-purple-200 rounded-full opacity-35" />
        </FloatingElement>
      </div>

      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center px-4 py-20">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex items-center gap-2 text-green-600 font-medium"
            >
              <Sprout className="w-5 h-5" />
              <span>Smart Agriculture Technology</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight"
            >
              🌱 Krishi Mithr
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="text-xl text-gray-600 leading-relaxed"
            >
              Revolutionizing agriculture with AI-powered insights, real-time monitoring, 
              and intelligent recommendations for modern farmers.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Button size="lg" className="group bg-green-600 hover:bg-green-700">
                Get Started
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  →
                </motion.div>
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="group border-green-600 text-green-600 hover:bg-green-50"
                onClick={handleWhatsAppClick}
              >
                <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                WhatsApp Support
              </Button>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9 }}
              className="flex items-center gap-6 pt-4"
            >
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="w-4 h-4 text-green-600" />
                <span>10,000+ Farmers</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Heart className="w-4 h-4 text-red-500" />
                <span>Human-Centered Design</span>
              </div>
            </motion.div>

            {/* Quick Weather Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.3 }}
              className="mt-6"
            >
              <WeatherWidget 
                city="Mumbai" 
                showDetails={false} 
                autoDetectLocation={true}
                className="max-w-sm" 
              />
            </motion.div>
          </motion.div>

          {/* Right Content - Feature Showcase */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative"
          >
            <Card className="p-8 bg-gradient-to-br from-white to-green-50 border-green-200">
              <motion.div
                key={currentFeature}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
                    {features[currentFeature].icon}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {features[currentFeature].title}
                  </h3>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  {features[currentFeature].description}
                </p>
              </motion.div>

              {/* Progress Indicators */}
              <div className="flex gap-2 mt-6">
                {features.map((_, index) => (
                  <motion.div
                    key={index}
                    className={cn(
                      "h-2 rounded-full transition-all duration-300",
                      index === currentFeature ? "bg-green-600 w-8" : "bg-green-200 w-2"
                    )}
                    animate={{
                      scale: index === currentFeature ? 1.1 : 1
                    }}
                  />
                ))}
              </div>
            </Card>

            {/* Floating Tech Elements */}
            <FloatingElement delay={0} className="absolute -top-4 -right-4">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white shadow-lg">
                <Smartphone className="w-4 h-4" />
              </div>
            </FloatingElement>
            <FloatingElement delay={1} className="absolute -bottom-4 -left-4">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-white shadow-lg">
                <Brain className="w-4 h-4" />
              </div>
            </FloatingElement>
          </motion.div>
        </div>
      </section>

      {/* WhatsApp Message Bar - Below Hero Section */}
      <section className="py-12 px-4 bg-gradient-to-r from-green-50 to-blue-50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="flex justify-center"
          >
            <WhatsAppMessageBar 
              showResponseArea={true}
              className="max-w-2xl w-full"
            />
          </motion.div>
        </div>
      </section>

      {/* Features Grid Section */}
      <ScrollAnimationContainer>
        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Comprehensive Agricultural Solutions
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                From soil analysis to market insights, our AI-powered platform provides 
                everything modern farmers need to succeed.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <FeatureCard
                  key={index}
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                  delay={index * 0.1}
                />
              ))}
            </div>
          </div>
        </section>
      </ScrollAnimationContainer>

      {/* Technology Integration Section */}
      <ScrollAnimationContainer>
        <section className="py-20 px-4 bg-gradient-to-r from-green-600 to-blue-600 text-white">
          <div className="max-w-7xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <h2 className="text-4xl font-bold mb-4">
                🤝 Human Touch Still Matters
              </h2>
              <p className="text-xl opacity-90 max-w-4xl mx-auto leading-relaxed">
                While AI powers most of our platform with IoT sensors, cloud computing, 
                and mobile technology, we believe human connection and trust remain essential 
                for successful adoption in agricultural communities.
              </p>

              <div className="grid md:grid-cols-3 gap-8 mt-12">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  viewport={{ once: true }}
                  className="bg-white/10 backdrop-blur-sm rounded-xl p-6"
                >
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-4 mx-auto">
                    <Cloud className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">IoT & Cloud</h3>
                  <p className="opacity-90">Real-time data collection and processing</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  viewport={{ once: true }}
                  className="bg-white/10 backdrop-blur-sm rounded-xl p-6"
                >
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-4 mx-auto">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Mobile First</h3>
                  <p className="opacity-90">Accessible on any smartphone or tablet</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  viewport={{ once: true }}
                  className="bg-white/10 backdrop-blur-sm rounded-xl p-6"
                >
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-4 mx-auto">
                    <MessageCircle className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">WhatsApp Bot</h3>
                  <p className="opacity-90">Direct farmer support via familiar platform</p>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>
      </ScrollAnimationContainer>

      {/* Live Weather Section */}
      <ScrollAnimationContainer>
        <section id="weather" className="py-20 px-4 bg-gradient-to-br from-blue-50 to-green-50">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                🌤️ Live Weather Updates
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Get real-time weather data and agricultural recommendations to make 
                informed farming decisions. Monitor conditions and plan your activities accordingly.
              </p>
            </motion.div>

            <div className="grid lg:grid-cols-2 gap-8">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
              >
                <WeatherWidget city="Mumbai" autoDetectLocation={true} />
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
              >
                <WeatherForecast city="Mumbai" />
              </motion.div>
            </div>
          </div>
        </section>
      </ScrollAnimationContainer>

      {/* Soil Analysis Section */}
      <ScrollAnimationContainer>
        <section id="soil" className="py-20 px-4 bg-gradient-to-br from-green-50 to-blue-50">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                🌱 AI-Powered Soil Analysis
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Upload a soil image to get comprehensive analysis including soil type, pH levels, 
                nutrient content, crop suitability, fertilizer recommendations, and pest prevention strategies.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="flex justify-center"
            >
              <SoilDetection className="max-w-4xl w-full" />
            </motion.div>
          </div>
        </section>
      </ScrollAnimationContainer>

      {/* Market Intelligence Section */}
      <ScrollAnimationContainer>
        <section id="market" className="py-20 px-4 bg-gradient-to-br from-yellow-50 to-orange-50">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                📊 Market Intelligence
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Stay updated with real-time market prices and trends. Make informed selling 
                decisions with location-based price data and market forecasting.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="flex justify-center"
            >
              <MarketPrices 
                location="Punjab" 
                autoDetectLocation={true}
                className="max-w-4xl w-full"
              />
            </motion.div>
          </div>
        </section>
      </ScrollAnimationContainer>

      {/* Voice Assistant Section */}
      <ScrollAnimationContainer>
        <section id="voice" className="py-20 px-4 bg-gradient-to-br from-green-50 to-blue-50">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                🎤 Voice Assistant Integration
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Speak naturally in your preferred language and get instant responses 
                from our AI-powered WhatsApp chatbot. Perfect for farmers who prefer voice interaction.
              </p>
            </motion.div>

            <div className="flex justify-center">
              <VoiceAssistant 
                onVoiceResult={(text) => {
                  console.log('Voice input received:', text)
                }}
                className="max-w-md"
              />
            </div>
          </div>
        </section>
      </ScrollAnimationContainer>

      {/* WhatsApp Integration Section */}
      <ScrollAnimationContainer>
        <section id="whatsapp" className="py-20 px-4">
          <WhatsAppChat showFloatingButton={false} />
        </section>
      </ScrollAnimationContainer>

      {/* Call to Action */}
      <section className="py-20 px-4 bg-gradient-to-r from-green-600 to-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <h2 className="text-4xl font-bold">
              Ready to Transform Your Farming?
            </h2>
            <p className="text-xl opacity-90">
              Join thousands of farmers already using AI-powered agriculture technology 
              to increase yields and reduce costs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-white text-green-600 hover:bg-gray-100 font-semibold"
              >
                Start Free Trial
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="border-white text-white hover:bg-white hover:text-green-600"
                onClick={handleWhatsAppClick}
              >
                <MessageCircle className="w-5 h-5" />
                Contact WhatsApp Bot
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default SmartAgriTechComponent
