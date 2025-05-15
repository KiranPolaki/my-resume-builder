import { NextResponse } from "next/server";
import { parseResumePdf } from "@/lib/pdf-parser";

export const maxDuration = 60; // Set max duration to 60 seconds

export async function POST(request) {
  try {
    const formData = await request.formData();
    const resumeFile = formData.get("resume");
    const jobDescription = formData.get("jobDescription");

    if (!resumeFile || !jobDescription) {
      return NextResponse.json(
        { error: "Missing resume file or job description" },
        { status: 400 }
      );
    }

    // Convert the File object to arrayBuffer to process it
    const buffer = await resumeFile.arrayBuffer();

    // Parse the resume PDF using DeepSeek model
    const resumeData = await parseResumePdf(
      Buffer.from(buffer),
      jobDescription
    );

    return NextResponse.json({
      success: true,
      data: resumeData,
    });
  } catch (error) {
    console.error("Error parsing resume:", error);
    return NextResponse.json(
      { error: "Failed to parse resume: " + error.message },
      { status: 500 }
    );
  }
}
