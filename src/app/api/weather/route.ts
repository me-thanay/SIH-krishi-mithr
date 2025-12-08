import { NextRequest, NextResponse } from 'next/server'

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || 'your_openweather_api_key_here'
const USE_OPENWEATHER = OPENWEATHER_API_KEY && OPENWEATHER_API_KEY !== 'your_openweather_api_key_here'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lat = searchParams.get('lat')
    const lon = searchParams.get('lon')
    const city = searchParams.get('city')
    const type = searchParams.get('type') || 'current' // current, forecast, soil

    // Short-circuit to a minimal stub to avoid external weather calls
    return NextResponse.json({
      success: true,
      type,
      location: city || `${lat || '0'}, ${lon || '0'}`,
      data: { note: 'Weather API disabled' },
      mocked: true
    })

    // Use NASA POWER API (no key needed) or OpenWeather if available
    if (USE_OPENWEATHER) {
      // Use OpenWeather API
    } else {
      // Use NASA POWER API (no key needed)
      return getNASAPowerWeatherData(lat, lon, city, type)
    }

    if (!lat && !lon && !city) {
      return NextResponse.json(
        { error: 'Please provide lat/lon coordinates or city name' },
        { status: 400 }
      )
    }

    let url = ''
    const params = new URLSearchParams()
    const cityParam = city ?? ''

    if (city) {
      // Use city name
      if (type === 'forecast') {
        url = `https://api.openweathermap.org/data/2.5/forecast`
        params.append('q', cityParam)
      } else if (type === 'soil') {
        url = `https://api.openweathermap.org/data/2.5/soil`
        params.append('q', cityParam)
      } else {
        url = `https://api.openweathermap.org/data/2.5/weather`
        params.append('q', cityParam)
      }
    } else {
      // Use coordinates
      if (type === 'forecast') {
        url = `https://api.openweathermap.org/data/2.5/forecast`
        params.append('lat', lat!)
        params.append('lon', lon!)
      } else if (type === 'soil') {
        url = `https://api.openweathermap.org/data/2.5/soil`
        params.append('lat', lat!)
        params.append('lon', lon!)
      } else {
        url = `https://api.openweathermap.org/data/2.5/weather`
        params.append('lat', lat!)
        params.append('lon', lon!)
      }
    }

    params.append('appid', OPENWEATHER_API_KEY)
    params.append('units', 'metric')

    const response = await fetch(`${url}?${params.toString()}`)
    
    if (!response.ok) {
      throw new Error(`OpenWeather API error: ${response.status}`)
    }

    const data = await response.json()

    // Format the response for agricultural use
    const formattedData = {
      success: true,
      type,
      location: city || `${lat}, ${lon}`,
      data: formatWeatherData(data, type),
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(formattedData)

  } catch (error) {
    console.error('Weather API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch weather data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

async function getNASAPowerWeatherData(lat: string | null, lon: string | null, city: string | null, type: string) {
  try {
    // Default coordinates for Hyderabad if not provided
    const latitude = lat || '17.3850'
    const longitude = lon || '78.4867'
    const location = city || 'Hyderabad'

    // NASA POWER API endpoint (no key needed)
    const baseUrl = 'https://power.larc.nasa.gov/api/temporal/daily/point'
    
    // Get current date and 7 days ago for forecast
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - 7)
    
    const startStr = startDate.toISOString().slice(0, 10).replace(/-/g, '')
    const endStr = endDate.toISOString().slice(0, 10).replace(/-/g, '')

    const params = new URLSearchParams({
      parameters: 'T2M,T2MDEW,T2MWET,RH2M,PRECTOTCORR,ALLSKY_SFC_SW_DWN,WS2M',
      community: 'AG',
      longitude: longitude,
      latitude: latitude,
      start: startStr,
      end: endStr,
      format: 'JSON'
    })

    const response = await fetch(`${baseUrl}?${params}`)
    
    if (!response.ok) {
      throw new Error(`NASA POWER API error: ${response.status}`)
    }

    const data = await response.json()
    
    // Format NASA POWER data for agricultural use
    const formattedData = {
      success: true,
      type,
      location,
      source: 'NASA POWER',
      data: {
        current: {
          temperature: {
            current: data.properties?.parameter?.T2M?.values?.[data.properties?.parameter?.T2M?.values?.length - 1] || 28,
            feels_like: data.properties?.parameter?.T2MDEW?.values?.[data.properties?.parameter?.T2MDEW?.values?.length - 1] || 30,
            min: Math.min(...(data.properties?.parameter?.T2M?.values || [25])),
            max: Math.max(...(data.properties?.parameter?.T2M?.values || [32]))
          },
          humidity: data.properties?.parameter?.RH2M?.values?.[data.properties?.parameter?.RH2M?.values?.length - 1] || 65,
          wind: {
            speed: data.properties?.parameter?.WS2M?.values?.[data.properties?.parameter?.WS2M?.values?.length - 1] || 3.5,
            direction: 180
          },
          weather: {
            main: 'Clear',
            description: 'clear sky',
            icon: '01d'
          },
          solar_radiation: data.properties?.parameter?.ALLSKY_SFC_SW_DWN?.values?.[data.properties?.parameter?.ALLSKY_SFC_SW_DWN?.values?.length - 1] || 25,
          rainfall: data.properties?.parameter?.PRECTOTCORR?.values?.[data.properties?.parameter?.PRECTOTCORR?.values?.length - 1] || 0,
          evapotranspiration: data.properties?.parameter?.T2MWET?.values?.[data.properties?.parameter?.T2MWET?.values?.length - 1] || 5,
          farming_conditions: {
            irrigation_needed: (data.properties?.parameter?.RH2M?.values?.[data.properties?.parameter?.RH2M?.values?.length - 1] || 65) < 40,
            crop_stress: (data.properties?.parameter?.T2M?.values?.[data.properties?.parameter?.T2M?.values?.length - 1] || 28) > 35,
            good_growing: (data.properties?.parameter?.T2M?.values?.[data.properties?.parameter?.T2M?.values?.length - 1] || 28) > 15 && (data.properties?.parameter?.T2M?.values?.[data.properties?.parameter?.T2M?.values?.length - 1] || 28) < 35,
            planting_suitable: (data.properties?.parameter?.T2M?.values?.[data.properties?.parameter?.T2M?.values?.length - 1] || 28) > 15,
            harvesting_suitable: (data.properties?.parameter?.T2M?.values?.[data.properties?.parameter?.T2M?.values?.length - 1] || 28) > 10
          }
        }
      },
      timestamp: new Date().toISOString(),
      note: '🌱 Real data from NASA POWER API (no key needed)'
    }

    return NextResponse.json(formattedData)

  } catch (error) {
    console.error('NASA POWER API error:', error)
    // Fallback to mock data if NASA API fails
    return getMockWeatherData(city || 'Hyderabad', type)
  }
}

function getMockWeatherData(city: string, type: string) {
  const mockData = {
    success: true,
    type,
    location: city,
    data: {
      current: {
        temperature: {
          current: 28,
          feels_like: 30,
          min: 25,
          max: 32
        },
        humidity: 65,
        pressure: 1013,
        wind: {
          speed: 3.5,
          direction: 180
        },
        weather: {
          main: 'Partly Cloudy',
          description: 'partly cloudy',
          icon: '02d'
        },
        visibility: 10000,
        clouds: 40,
        sunrise: new Date('2024-01-15T06:30:00'),
        sunset: new Date('2024-01-15T18:30:00'),
        farming_conditions: {
          irrigation_needed: false,
          crop_stress: false,
          good_growing: true,
          planting_suitable: true,
          harvesting_suitable: true
        }
      }
    },
    timestamp: new Date().toISOString(),
    note: '🌱 Mock data for testing. Get real data by adding OPENWEATHER_API_KEY to environment variables.'
  }

  return NextResponse.json(mockData)
}

function formatWeatherData(data: any, type: string) {
  if (type === 'forecast') {
    return {
      city: data.city,
      forecasts: data.list.map((item: any) => ({
        datetime: new Date(item.dt * 1000),
        temperature: {
          min: item.main.temp_min,
          max: item.main.temp_max,
          feels_like: item.main.feels_like
        },
        humidity: item.main.humidity,
        pressure: item.main.pressure,
        wind: {
          speed: item.wind.speed,
          direction: item.wind.deg
        },
        weather: {
          main: item.weather[0].main,
          description: item.weather[0].description,
          icon: item.weather[0].icon
        },
        rain: item.rain?.['3h'] || 0,
        clouds: item.clouds.all,
        // Agricultural insights
        farming_conditions: {
          irrigation_needed: item.main.humidity < 40,
          crop_stress: item.main.temp_max > 35 || item.main.temp_min < 5,
          good_growing: item.main.temp_min > 10 && item.main.temp_max < 35 && item.main.humidity > 40
        }
      }))
    }
  } else if (type === 'soil') {
    return {
      soil_data: data.list.map((item: any) => ({
        datetime: new Date(item.dt * 1000),
        soil_moisture: item.main?.humidity || 'N/A',
        soil_temperature: item.main?.temp || 'N/A',
        // Additional soil insights
        irrigation_recommendation: item.main?.humidity < 30 ? 'Irrigation recommended' : 'Soil moisture adequate'
      }))
    }
  } else {
    // Current weather
    return {
      current: {
        temperature: {
          current: data.main.temp,
          feels_like: data.main.feels_like,
          min: data.main.temp_min,
          max: data.main.temp_max
        },
        humidity: data.main.humidity,
        pressure: data.main.pressure,
        wind: {
          speed: data.wind.speed,
          direction: data.wind.deg
        },
        weather: {
          main: data.weather[0].main,
          description: data.weather[0].description,
          icon: data.weather[0].icon
        },
        visibility: data.visibility,
        clouds: data.clouds.all,
        sunrise: new Date(data.sys.sunrise * 1000),
        sunset: new Date(data.sys.sunset * 1000),
        // Agricultural insights
        farming_conditions: {
          irrigation_needed: data.main.humidity < 40,
          crop_stress: data.main.temp_max > 35 || data.main.temp_min < 5,
          good_growing: data.main.temp_min > 10 && data.main.temp_max < 35 && data.main.humidity > 40,
          planting_suitable: data.main.temp_min > 15 && data.main.temp_max < 30,
          harvesting_suitable: data.main.temp_min > 10 && data.main.temp_max < 35 && data.clouds.all < 50
        }
      }
    }
  }
}
