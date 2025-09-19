import { NextRequest, NextResponse } from 'next/server'

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || 'your_openweather_api_key_here'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lat = searchParams.get('lat')
    const lon = searchParams.get('lon')
    const city = searchParams.get('city')
    const type = searchParams.get('type') || 'current' // current, forecast, soil

    if (!lat && !lon && !city) {
      return NextResponse.json(
        { error: 'Please provide lat/lon coordinates or city name' },
        { status: 400 }
      )
    }

    let url = ''
    let params = new URLSearchParams()

    if (city) {
      // Use city name
      if (type === 'forecast') {
        url = `https://api.openweathermap.org/data/2.5/forecast`
        params.append('q', city)
      } else if (type === 'soil') {
        url = `https://api.openweathermap.org/data/2.5/soil`
        params.append('q', city)
      } else {
        url = `https://api.openweathermap.org/data/2.5/weather`
        params.append('q', city)
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
