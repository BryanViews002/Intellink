import { listNigerianBanks } from "@/lib/korapay";

export const dynamic = "force-dynamic";

// Debug endpoint to test bank list loading
export async function GET() {
  try {
    console.log("Debug: Checking KORAPAY_PUBLIC_KEY...", !!process.env.KORAPAY_PUBLIC_KEY);
    
    if (!process.env.KORAPAY_PUBLIC_KEY) {
      return Response.json({
        error: "KORAPAY_PUBLIC_KEY is not configured",
        status: "error"
      }, { status: 500 });
    }

    const banks = await listNigerianBanks();
    
    return Response.json({
      message: "Bank list loaded successfully",
      count: banks.length,
      banks: banks.slice(0, 5), // Return first 5 banks for debugging
      status: "success"
    });
  } catch (error) {
    console.error("Debug bank list error:", error);
    
    return Response.json({
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      status: "error"
    }, { status: 500 });
  }
}
