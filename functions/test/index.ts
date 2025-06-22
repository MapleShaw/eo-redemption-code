export async function onRequest(context: any): Promise<Response> {
  console.log('=== TEST ENDPOINT CALLED ===')
  console.log('Request method:', context.request.method)
  console.log('Request URL:', context.request.url)
  console.log('Environment variables available:', Object.keys(context.env || {}))
  
  return new Response(JSON.stringify({
    message: 'Test endpoint working!',
    timestamp: new Date().toISOString(),
    method: context.request.method,
    url: context.request.url,
    hasEnv: !!context.env
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  })
} 