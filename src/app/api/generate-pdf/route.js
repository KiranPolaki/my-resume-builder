import { NextResponse } from "next/server";
import { generateLatexPdf } from "@/lib/latex-generator";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export const maxDuration = 60; // Set max duration to 60 seconds

export async function POST(request) {
  try {
    const { resumeData } = await request.json();

    if (!resumeData) {
      return NextResponse.json(
        { error: "Missing resume data" },
        { status: 400 }
      );
    }

    // Generate LaTeX and PDF
    const pdfResult = await generateLatexPdf(resumeData);

    // For a real app, you'd store this in cloud storage
    // For this example, we'll simulate with file paths
    const filename = `optimized-resume-${uuidv4()}.pdf`;

    return NextResponse.json({
      success: true,
      pdfUrl: pdfResult.pdfUrl,
      previewUrl: pdfResult.previewUrl,
      score: pdfResult.score,
      filename,
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF: " + error.message },
      { status: 500 }
    );
  }
}
