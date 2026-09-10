import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File
    const language = formData.get('language') as string || 'en'

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      )
    }

    // Convert audio to base64 for OpenAI Whisper API
    const audioBuffer = await audioFile.arrayBuffer()
    const audioBase64 = Buffer.from(audioBuffer).toString('base64')

    // OpenAI Whisper API call
    const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'whisper-1',
        file: `data:audio/wav;base64,${audioBase64}`,
        language: language,
        response_format: 'json'
      })
    })

    if (!whisperResponse.ok) {
      throw new Error(`Whisper API error: ${whisperResponse.status}`)
    }

    const whisperData = await whisperResponse.json()

    // Process the transcript for agricultural commands
    const processedResponse = await processAgriculturalCommand(whisperData.text, language)

    return NextResponse.json({
      success: true,
      transcript: whisperData.text,
      language: language,
      response: processedResponse,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Voice transcription error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to transcribe audio',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

async function processAgriculturalCommand(transcript: string, language: string) {
  const command = transcript.toLowerCase()
  
  // Weather queries
  if (command.includes('weather') || command.includes('मौसम') || command.includes('వాతావరణం')) {
    const location = extractLocation(command)
    const weatherData = await fetchWeatherData(location)
    return formatWeatherResponse(weatherData, location, language)
  }
  
  // Market price queries
  if (command.includes('price') || command.includes('rate') || command.includes('भाव') || command.includes('రేటు')) {
    const crop = extractCrop(command)
    const priceData = await fetchPriceData(crop)
    return formatPriceResponse(priceData, crop, language)
  }
  
  // Soil analysis queries (disabled)
  if (command.includes('soil') || command.includes('मिट्टी') || command.includes('నేల')) {
    return formatSoilResponse(null, language)
  }
  
  // Crop advice queries
  if (command.includes('advice') || command.includes('सलाह') || command.includes('సలహా')) {
    return getCropAdvice(command, language)
  }
  
  // General help
  if (command.includes('help') || command.includes('सहायता') || command.includes('సహాయం')) {
    return getHelpResponse(language)
  }
  
  // Default response
  return getDefaultResponse(language)
}

function extractLocation(command: string): string {
  const locations = ['hyderabad', 'delhi', 'mumbai', 'bangalore', 'chennai', 'kolkata', 'pune', 'ahmedabad']
  for (const location of locations) {
    if (command.includes(location)) {
      return location
    }
  }
  return 'hyderabad'
}

function extractCrop(command: string): string {
  const crops = ['rice', 'wheat', 'maize', 'cotton', 'sugarcane', 'soybean', 'groundnut', 'mustard', 'potato', 'onion']
  for (const crop of crops) {
    if (command.includes(crop)) {
      return crop
    }
  }
  return 'rice'
}

async function fetchWeatherData(location: string) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/weather?city=${location}&type=current`)
  return response.json()
}

async function fetchPriceData(crop: string) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/agmarknet-prices?crop=${crop}`)
  return response.json()
}

function formatWeatherResponse(data: any, location: string, language: string): string {
  if (data.success) {
    const current = data.data.current
    if (language === 'hi') {
      return `${location} का मौसम: तापमान ${current.temperature.current} डिग्री सेल्सियस, आर्द्रता ${current.humidity} प्रतिशत। ${current.farming_conditions.good_growing ? 'खेती के लिए अच्छी स्थिति।' : 'फसल तनाव की निगरानी करें।'}`
    } else if (language === 'te') {
      return `${location} వాతావరణం: ఉష్ణోగ్రత ${current.temperature.current} డిగ్రీల సెల్సియస్, తేమ ${current.humidity} శాతం। ${current.farming_conditions.good_growing ? 'వ్యవసాయానికి మంచి పరిస్థితులు।' : 'పంట ఒత్తిడిని పర్యవేక్షించండి।'}`
    } else {
      return `Weather in ${location}: Temperature ${current.temperature.current} degrees Celsius, Humidity ${current.humidity} percent. ${current.farming_conditions.good_growing ? 'Good conditions for farming.' : 'Monitor crop stress.'}`
    }
  }
  return `Weather data for ${location} is not available right now.`
}

function formatPriceResponse(data: any, crop: string, language: string): string {
  if (data.success) {
    const prices = data.data.prices[0]
    if (language === 'hi') {
      return `${crop} की कीमत: न्यूनतम ${prices.min_price} रुपये प्रति क्विंटल, अधिकतम ${prices.max_price} रुपये प्रति क्विंटल। ${data.data.recommendation}`
    } else if (language === 'te') {
      return `${crop} ధర: కనీసం ${prices.min_price} రూపాయలు క్వింటాల్, గరిష్టం ${prices.max_price} రూపాయలు క్వింటాల్। ${data.data.recommendation}`
    } else {
      return `${crop} prices: Minimum ${prices.min_price} rupees per quintal, Maximum ${prices.max_price} rupees per quintal. ${data.data.recommendation}`
    }
  }
  return `${crop} price data is not available right now.`
}

function formatSoilResponse(_data: any, language: string): string {
  if (language === 'hi') {
    return 'मिट्टी विश्लेषण सुविधा अभी अक्षम है।'
  } else if (language === 'te') {
    return 'మట్టి విశ్లేషణ సదుపాయం ప్రస్తుతం నిలిపివేయబడింది.'
  }
  return 'Soil analysis is currently disabled.'
}

function getCropAdvice(command: string, language: string): string {
  const advice = {
    en: [
      "Use quality seeds and maintain proper spacing between plants.",
      "Monitor soil moisture and irrigate when needed.",
      "Apply fertilizers based on soil test results.",
      "Control weeds and pests regularly.",
      "Practice crop rotation for better soil health."
    ],
    hi: [
      "गुणवत्तापूर्ण बीज का उपयोग करें और पौधों के बीच उचित दूरी बनाए रखें।",
      "मिट्टी की नमी की निगरानी करें और आवश्यकता होने पर सिंचाई करें।",
      "मिट्टी परीक्षण के परिणामों के आधार पर उर्वरक लगाएं।",
      "खरपतवार और कीटों को नियमित रूप से नियंत्रित करें।",
      "बेहतर मिट्टी स्वास्थ्य के लिए फसल चक्र का अभ्यास करें।"
    ],
    te: [
      "నాణ్యమైన విత్తనాలను ఉపయోగించండి మరియు మొక్కల మధ్య సరైన దూరాన్ని నిర్వహించండి।",
      "నేల తేమను పర్యవేక్షించండి మరియు అవసరమైనప్పుడు నీటిపారుదల చేయండి।",
      "నేల పరీక్ష ఫలితాల ఆధారంగా ఎరువులను వర్తింపజేయండి।",
      "కలుపు మొక్కలు మరియు కీటకాలను క్రమం తప్పకుండా నియంత్రించండి।",
      "మంచి నేల ఆరోగ్యం కోసం పంట భ్రమణం అభ్యాసం చేయండి।"
    ]
  }
  
  const languageAdvice = advice[language as keyof typeof advice] || advice.en
  return languageAdvice[Math.floor(Math.random() * languageAdvice.length)]
}

function getHelpResponse(language: string): string {
  const helpResponses = {
    en: "I can help you with weather updates, market prices, soil analysis, and crop advice. Just ask me about farming!",
    hi: "मैं आपकी मौसम अपडेट, बाजार कीमतें, मिट्टी विश्लेषण और फसल सलाह में मदद कर सकता हूं। बस मुझसे खेती के बारे में पूछें!",
    te: "నేను మీకు వాతావరణ అప్డేట్లు, మార్కెట్ ధరలు, నేల విశ్లేషణ మరియు పంట సలహాలతో సహాయపడగలను। వ్యవసాయం గురించి నన్ను అడగండి!"
  }
  
  return helpResponses[language as keyof typeof helpResponses] || helpResponses.en
}

function getDefaultResponse(language: string): string {
  const defaultResponses = {
    en: "I can help you with weather, market prices, soil analysis, and crop advice. Please ask me about farming.",
    hi: "मैं आपकी मौसम, बाजार कीमतें, मिट्टी विश्लेषण और फसल सलाह में मदद कर सकता हूं। कृपया मुझसे खेती के बारे में पूछें।",
    te: "నేను మీకు వాతావరణం, మార్కెట్ ధరలు, నేల విశ్లేషణ మరియు పంట సలహాలతో సహాయపడగలను। దయచేసి వ్యవసాయం గురించి నన్ను అడగండి।"
  }
  
  return defaultResponses[language as keyof typeof defaultResponses] || defaultResponses.en
}
