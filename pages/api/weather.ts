import { NextApiRequest, NextApiResponse } from 'next'

// List of valid Indian cities/states for validation
const validIndianLocations = [
  'mumbai', 'delhi', 'bangalore', 'hyderabad', 'ahmedabad', 'chennai', 'kolkata', 'pune', 'jaipur', 'lucknow',
  'kanpur', 'nagpur', 'indore', 'thane', 'bhopal', 'visakhapatnam', 'pimpri', 'patna', 'vadodara', 'ghaziabad',
  'ludhiana', 'agra', 'nashik', 'faridabad', 'meerut', 'rajkot', 'kalyan', 'vasai', 'varanasi', 'srinagar',
  'aurangabad', 'noida', 'solapur', 'vijayawada', 'kolhapur', 'amritsar', 'nashik', 'sangli', 'hubli', 'mysore',
  'kochi', 'bhubaneswar', 'coimbatore', 'madurai', 'raipur', 'ranchi', 'gwalior', 'jabalpur', 'ujjain', 'guntur',
  'chandigarh', 'tiruchirappalli', 'salem', 'warangal', 'mira', 'thiruvananthapuram', 'bhiwandi', 'saharanpur',
  'gorakhpur', 'bikaner', 'amravati', 'noida', 'jalandhar', 'ulhasnagar', 'jammu', 'sangli', 'mangalore', 'erode',
  'belgaum', 'ambattur', 'tirunelveli', 'malegaon', 'gaya', 'jalgaon', 'udaipur', 'maheshtala', 'davanagere',
  'kozhikode', 'akola', 'kurnool', 'rajpur', 'bokaro', 'south', 'dumdum', 'pimpri', 'pune', 'rajkot', 'bhubaneswar',
  'coimbatore', 'madurai', 'raipur', 'ranchi', 'gwalior', 'jabalpur', 'ujjain', 'guntur', 'chandigarh',
  'maharashtra', 'karnataka', 'tamil nadu', 'kerala', 'andhra pradesh', 'telangana', 'gujarat', 'rajasthan',
  'punjab', 'haryana', 'uttar pradesh', 'bihar', 'west bengal', 'odisha', 'madhya pradesh', 'chhattisgarh',
  'jharkhand', 'assam', 'manipur', 'meghalaya', 'mizoram', 'nagaland', 'tripura', 'arunachal pradesh', 'sikkim',
  'goa', 'himachal pradesh', 'jammu and kashmir', 'ladakh', 'uttarakhand', 'delhi', 'chandigarh', 'puducherry',
  'andaman and nicobar islands', 'dadra and nagar haveli', 'daman and diu', 'lakshadweep'
]

function isValidLocation(location: string): boolean {
  if (!location || typeof location !== 'string') return false
  
  const normalizedLocation = location.toLowerCase().trim()
  
  // Check if it's a valid Indian location
  return validIndianLocations.some(validLoc => 
    normalizedLocation.includes(validLoc) || validLoc.includes(normalizedLocation)
  )
}

// Indian city coordinates for Open-Meteo API
const cityCoordinates: { [key: string]: { lat: number, lon: number, name: string } } = {
  'mumbai': { lat: 19.0760, lon: 72.8777, name: 'Mumbai' },
  'delhi': { lat: 28.7041, lon: 77.1025, name: 'Delhi' },
  'bangalore': { lat: 12.9716, lon: 77.5946, name: 'Bangalore' },
  'hyderabad': { lat: 17.3850, lon: 78.4867, name: 'Hyderabad' },
  'chennai': { lat: 13.0827, lon: 80.2707, name: 'Chennai' },
  'kolkata': { lat: 22.5726, lon: 88.3639, name: 'Kolkata' },
  'pune': { lat: 18.5204, lon: 73.8567, name: 'Pune' },
  'ahmedabad': { lat: 23.0225, lon: 72.5714, name: 'Ahmedabad' },
  'jaipur': { lat: 26.9124, lon: 75.7873, name: 'Jaipur' },
  'lucknow': { lat: 26.8467, lon: 80.9462, name: 'Lucknow' },
  'kanpur': { lat: 26.4499, lon: 80.3319, name: 'Kanpur' },
  'nagpur': { lat: 21.1458, lon: 79.0882, name: 'Nagpur' },
  'indore': { lat: 22.7196, lon: 75.8577, name: 'Indore' },
  'thane': { lat: 19.2183, lon: 72.9781, name: 'Thane' },
  'bhopal': { lat: 23.2599, lon: 77.4126, name: 'Bhopal' },
  'visakhapatnam': { lat: 17.6868, lon: 83.2185, name: 'Visakhapatnam' },
  'patna': { lat: 25.5941, lon: 85.1376, name: 'Patna' },
  'vadodara': { lat: 22.3072, lon: 73.1812, name: 'Vadodara' },
  'ghaziabad': { lat: 28.6692, lon: 77.4538, name: 'Ghaziabad' },
  'ludhiana': { lat: 30.9010, lon: 75.8573, name: 'Ludhiana' },
  'agra': { lat: 27.1767, lon: 78.0081, name: 'Agra' },
  'nashik': { lat: 19.9975, lon: 73.7898, name: 'Nashik' },
  'faridabad': { lat: 28.4089, lon: 77.3178, name: 'Faridabad' },
  'meerut': { lat: 28.9845, lon: 77.7064, name: 'Meerut' },
  'rajkot': { lat: 22.3039, lon: 70.8022, name: 'Rajkot' },
  'kalyan': { lat: 19.2437, lon: 73.1355, name: 'Kalyan' },
  'vasai': { lat: 19.4700, lon: 72.8000, name: 'Vasai' },
  'varanasi': { lat: 25.3176, lon: 82.9739, name: 'Varanasi' },
  'srinagar': { lat: 34.0837, lon: 74.7973, name: 'Srinagar' },
  'aurangabad': { lat: 19.8762, lon: 75.3433, name: 'Aurangabad' },
  'noida': { lat: 28.5355, lon: 77.3910, name: 'Noida' },
  'solapur': { lat: 17.6599, lon: 75.9064, name: 'Solapur' },
  'vijayawada': { lat: 16.5062, lon: 80.6480, name: 'Vijayawada' },
  'kolhapur': { lat: 16.7050, lon: 74.2433, name: 'Kolhapur' },
  'amritsar': { lat: 31.6340, lon: 74.8723, name: 'Amritsar' },
  'sangli': { lat: 16.8524, lon: 74.5815, name: 'Sangli' },
  'hubli': { lat: 15.3647, lon: 75.1240, name: 'Hubli' },
  'mysore': { lat: 12.2958, lon: 76.6394, name: 'Mysore' },
  'kochi': { lat: 9.9312, lon: 76.2673, name: 'Kochi' },
  'bhubaneswar': { lat: 20.2961, lon: 85.8245, name: 'Bhubaneswar' },
  'coimbatore': { lat: 11.0168, lon: 76.9558, name: 'Coimbatore' },
  'madurai': { lat: 9.9252, lon: 78.1198, name: 'Madurai' },
  'raipur': { lat: 21.2514, lon: 81.6296, name: 'Raipur' },
  'ranchi': { lat: 23.3441, lon: 85.3096, name: 'Ranchi' },
  'gwalior': { lat: 26.2183, lon: 78.1828, name: 'Gwalior' },
  'jabalpur': { lat: 23.1815, lon: 79.9864, name: 'Jabalpur' },
  'ujjain': { lat: 23.1765, lon: 75.7885, name: 'Ujjain' },
  'guntur': { lat: 16.3067, lon: 80.4365, name: 'Guntur' },
  'chandigarh': { lat: 30.7333, lon: 76.7794, name: 'Chandigarh' },
  'tiruchirappalli': { lat: 10.7905, lon: 78.7047, name: 'Tiruchirappalli' },
  'salem': { lat: 11.6643, lon: 78.1460, name: 'Salem' },
  'warangal': { lat: 17.9689, lon: 79.5941, name: 'Warangal' },
  'mira': { lat: 19.2952, lon: 72.8544, name: 'Mira' },
  'thiruvananthapuram': { lat: 8.5241, lon: 76.9366, name: 'Thiruvananthapuram' },
  'bhiwandi': { lat: 19.3002, lon: 73.0589, name: 'Bhiwandi' },
  'saharanpur': { lat: 29.9670, lon: 77.5451, name: 'Saharanpur' },
  'gorakhpur': { lat: 26.7606, lon: 83.3732, name: 'Gorakhpur' },
  'bikaner': { lat: 28.0229, lon: 73.3119, name: 'Bikaner' },
  'amravati': { lat: 20.9374, lon: 77.7796, name: 'Amravati' },
  'jalandhar': { lat: 31.3260, lon: 75.5762, name: 'Jalandhar' },
  'ulhasnagar': { lat: 19.2215, lon: 73.1645, name: 'Ulhasnagar' },
  'jammu': { lat: 32.7266, lon: 74.8570, name: 'Jammu' },
  'mangalore': { lat: 12.9141, lon: 74.8560, name: 'Mangalore' },
  'erode': { lat: 11.3410, lon: 77.7172, name: 'Erode' },
  'belgaum': { lat: 15.8497, lon: 74.4977, name: 'Belgaum' },
  'ambattur': { lat: 13.1077, lon: 80.1614, name: 'Ambattur' },
  'tirunelveli': { lat: 8.7139, lon: 77.7567, name: 'Tirunelveli' },
  'malegaon': { lat: 20.5597, lon: 74.5255, name: 'Malegaon' },
  'gaya': { lat: 24.7960, lon: 84.9914, name: 'Gaya' },
  'jalgaon': { lat: 21.0077, lon: 75.5626, name: 'Jalgaon' },
  'udaipur': { lat: 24.5854, lon: 73.7125, name: 'Udaipur' },
  'maheshtala': { lat: 22.5086, lon: 88.2532, name: 'Maheshtala' },
  'davanagere': { lat: 14.4644, lon: 75.9218, name: 'Davanagere' },
  'kozhikode': { lat: 11.2588, lon: 75.7804, name: 'Kozhikode' },
  'akola': { lat: 20.7000, lon: 77.0000, name: 'Akola' },
  'kurnool': { lat: 15.8300, lon: 78.0500, name: 'Kurnool' },
  'rajpur': { lat: 21.2333, lon: 81.6333, name: 'Rajpur' },
  'bokaro': { lat: 23.6693, lon: 85.9786, name: 'Bokaro' }
}

async function getRealWeatherData(city: string) {
  try {
    const normalizedCity = city.toLowerCase().trim()
    const coordinates = cityCoordinates[normalizedCity]
    
    if (!coordinates) {
      throw new Error('City coordinates not found')
    }

    // Open-Meteo API - 100% free, no API key required
    const API_URL = `https://api.open-meteo.com/v1/forecast?latitude=${coordinates.lat}&longitude=${coordinates.lon}&current=temperature_2m,relative_humidity_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code&timezone=auto&forecast_days=3`

    const response = await fetch(API_URL)
    
    if (!response.ok) {
      throw new Error(`Open-Meteo API error: ${response.status}`)
    }

    const data = await response.json()
    
    // Convert weather code to condition
    const getWeatherCondition = (code: number) => {
      const weatherCodes: { [key: number]: string } = {
        0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
        45: 'Fog', 48: 'Depositing rime fog', 51: 'Light drizzle', 53: 'Moderate drizzle',
        55: 'Dense drizzle', 56: 'Light freezing drizzle', 57: 'Dense freezing drizzle',
        61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
        66: 'Light freezing rain', 67: 'Heavy freezing rain',
        71: 'Slight snow fall', 73: 'Moderate snow fall', 75: 'Heavy snow fall',
        77: 'Snow grains', 80: 'Slight rain showers', 81: 'Moderate rain showers',
        82: 'Violent rain showers', 85: 'Slight snow showers', 86: 'Heavy snow showers',
        95: 'Thunderstorm', 96: 'Thunderstorm with slight hail', 99: 'Thunderstorm with heavy hail'
      }
      return weatherCodes[code] || 'Unknown'
    }

    const currentTemp = Math.round(data.current.temperature_2m)
    const currentHumidity = data.current.relative_humidity_2m
    const currentCondition = getWeatherCondition(data.current.weather_code)
    
    return {
      current: {
        temperature: currentTemp,
        humidity: currentHumidity,
        condition: currentCondition,
        farming_conditions: {
          irrigation_needed: currentHumidity < 40,
          good_growing: currentTemp >= 15 && currentTemp <= 35,
          planting_suitable: data.current.weather_code < 50 && currentTemp >= 10
        }
      },
      forecast: data.daily.time.slice(0, 3).map((date: string, index: number) => ({
        date,
        temperature: Math.round((data.daily.temperature_2m_max[index] + data.daily.temperature_2m_min[index]) / 2),
        condition: getWeatherCondition(data.daily.weather_code[index]),
        max_temp: Math.round(data.daily.temperature_2m_max[index]),
        min_temp: Math.round(data.daily.temperature_2m_min[index]),
        precipitation: data.daily.precipitation_sum[index]
      })),
      source: 'Open-Meteo (Real Data)',
      location: coordinates.name
    }
  } catch (error) {
    console.error('Open-Meteo API error:', error)
    throw error
  }
}

function getMockWeatherData(city: string) {
  return {
    current: {
      temperature: 28 + Math.floor(Math.random() * 10),
      humidity: 60 + Math.floor(Math.random() * 20),
      condition: ['Sunny', 'Partly Cloudy', 'Cloudy', 'Rainy'][Math.floor(Math.random() * 4)],
      farming_conditions: {
        irrigation_needed: Math.random() > 0.7,
        good_growing: Math.random() > 0.3,
        planting_suitable: Math.random() > 0.2
      }
    },
    forecast: [
      {
        date: new Date().toISOString().split('T')[0],
        temperature: 28 + Math.floor(Math.random() * 10),
        condition: 'Sunny'
      },
      {
        date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        temperature: 26 + Math.floor(Math.random() * 10),
        condition: 'Partly Cloudy'
      },
      {
        date: new Date(Date.now() + 172800000).toISOString().split('T')[0],
        temperature: 30 + Math.floor(Math.random() * 10),
        condition: 'Cloudy'
      }
    ],
    source: 'Mock Data (Demo)'
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { city, type } = req.query

    if (!city || typeof city !== 'string') {
      return res.status(400).json({ 
        success: false,
        error: 'City parameter is required' 
      })
    }

    // Validate location
    if (!isValidLocation(city)) {
      return res.status(400).json({
        success: false,
        error: `Invalid location: "${city}". Please provide a valid Indian city or state.`,
        suggestions: [
          'Try: Mumbai, Delhi, Bangalore, Chennai, Kolkata',
          'Or: Maharashtra, Karnataka, Tamil Nadu, Kerala',
          'Use proper city names, not random text'
        ]
      })
    }

    let weatherData
    let isRealData = false

    try {
      // Try to get real weather data first
      weatherData = await getRealWeatherData(city)
      isRealData = true
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      console.log('Falling back to mock data:', message)
      // Fall back to mock data if real API fails
      weatherData = getMockWeatherData(city)
    }

    return res.status(200).json({
      success: true,
      data: weatherData,
      message: `Weather data for ${city}${isRealData ? ' (Real Data)' : ' (Demo Data)'}`,
      isRealData
    })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('Weather API error:', message)
    return res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    })
  }
}
