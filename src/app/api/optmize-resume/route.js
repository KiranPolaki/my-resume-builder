import { NextResponse } from "next/server";
import { optimizeResume } from "@/lib/deepseek";

export const maxDuration = 60; // Set max duration to 60 seconds

export async function POST(request) {
  try {
    const { resumeData, jobDescription } = await request.json();

    if (!resumeData || !jobDescription) {
      return NextResponse.json(
        { error: "Missing resume data or job description" },
        { status: 400 }
      );
    }

    // Optimize the resume using DeepSeek
    const optimizedData = await optimizeResume(resumeData, jobDescription);

    return NextResponse.json({
      success: true,
      data: optimizedData,
    });
  } catch (error) {
    console.error("Error optimizing resume:", error);
    return NextResponse.json(
      { error: "Failed to optimize resume: " + error.message },
      { status: 500 }
    );
  }
}
