import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Missing ID parameter" },
        { status: 400 }
      );
    }

    const pdfPath = `/tmp/resume-${id}.pdf`;

    // In a real application, you'd fetch the file from your storage (S3, etc.)
    // For this example, we'll simulate a PDF download

    // Check if file exists
    // This would be replaced with cloud storage checks in production
    if (!fs.existsSync(pdfPath)) {
      // For demo purposes, we'll create a placeholder
      return new NextResponse(
        "This is a simulated PDF file for demo purposes",
        {
          status: 200,
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="optimized-resume.pdf"`,
          },
        }
      );
    }

    // In a real application, you'd read the file and return it
    // For this demo, we'll return a placeholder
    return new NextResponse("This is a simulated PDF file for demo purposes", {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="optimized-resume.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error downloading PDF:", error);
    return NextResponse.json(
      { error: "Failed to download PDF: " + error.message },
      { status: 500 }
    );
  }
}
