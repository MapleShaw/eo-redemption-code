export async function onRequest(context: any): Promise<Response> {
  return new Response(JSON.stringify({
    message: 'Simple test working',
    timestamp: new Date().toISOString()
  }), {
    headers: {
      'Content-Type': 'application/json'
    }
  })
}
