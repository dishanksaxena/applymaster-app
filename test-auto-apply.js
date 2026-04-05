// Test script to verify auto-apply functionality
// This script directly calls the test endpoint and verifies the response

const BASE_URL = 'http://localhost:3002'

async function testAutoApply() {
  console.log('🧪 Testing Auto-Apply Endpoint...\n')

  try {
    // Call the test endpoint (this requires authentication)
    console.log('📡 Calling /api/auto-apply/test...')
    const response = await fetch(`${BASE_URL}/api/auto-apply/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include' // Include cookies for auth
    })

    console.log(`   Status: ${response.status} ${response.statusText}`)

    const data = await response.json()
    console.log(`   Response:`, JSON.stringify(data, null, 2))

    if (response.ok) {
      console.log('\n✅ Test endpoint is working!')
      console.log(`   Processed: ${data.processed} applications`)
      console.log(`   Users processed: ${data.users_processed}`)
      if (data.results) {
        console.log(`   Results:`, JSON.stringify(data.results, null, 2))
      }
    } else {
      console.log('\n❌ Test endpoint returned error')
      console.log(`   Error: ${data.error}`)
    }
  } catch (err) {
    console.error('❌ Failed to call test endpoint:', err.message)
  }
}

testAutoApply()
