export const dynamic = "force-dynamic";

// Test endpoint to verify Korapay API connectivity
export async function GET() {
  try {
    console.log("Testing Korapay API connectivity...");
    console.log("KORAPAY_SECRET_KEY configured:", !!process.env.KORAPAY_SECRET_KEY);
    console.log("Secret key prefix:", process.env.KORAPAY_SECRET_KEY?.substring(0, 8) + "...");
    console.log("Secret key length:", process.env.KORAPAY_SECRET_KEY?.length);
    
    // Test with a simple fetch to the API
    const testResponse = await fetch("https://api.korapay.com/merchant/api/v1/misc/banks?countryCode=NG", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.KORAPAY_SECRET_KEY?.trim()}`,
      },
    });
    
    const testText = await testResponse.text();
    
    return Response.json({
      apiStatus: testResponse.status,
      apiStatusText: testResponse.statusText,
      apiResponse: testText.substring(0, 500),
      keyConfigured: !!process.env.KORAPAY_SECRET_KEY,
      keyPrefix: process.env.KORAPAY_SECRET_KEY?.substring(0, 8) + "...",
      keyLength: process.env.KORAPAY_SECRET_KEY?.length,
    });
  } catch (error) {
    return Response.json({
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}
