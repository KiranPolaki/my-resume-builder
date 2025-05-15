"use client";

import { useState } from "react";
import FileUpload from "../components/FileUpload";
import JobDescriptionInput from "@/components/JobDescriptionInput";
import ResultDisplay from "@/components/ResultDisplay";

export default function Home() {
  const [jobDescription, setJobDescription] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [optimizedResume, setOptimizedResume] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!jobDescription || !resumeFile) {
      setError("Please provide both a job description and resume file");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create form data to send files
      const formData = new FormData();
      formData.append("resume", resumeFile);
      formData.append("jobDescription", jobDescription);

      // Parse resume
      const parseResponse = await fetch("/api/parse-resume", {
        method: "POST",
        body: formData,
      });

      if (!parseResponse.ok) {
        throw new Error("Failed to parse resume", parseResponse);
      }

      const resumeData = await parseResponse.json();

      // Optimize resume
      const optimizeResponse = await fetch("/api/optimize-resume", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resumeData: resumeData.data,
          jobDescription,
        }),
      });

      if (!optimizeResponse.ok) {
        throw new Error("Failed to optimize resume");
      }

      const optimizedData = await optimizeResponse.json();

      // Generate PDF
      const pdfResponse = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resumeData: optimizedData.data,
        }),
      });

      if (!pdfResponse.ok) {
        throw new Error("Failed to generate PDF");
      }

      const pdfData = await pdfResponse.json();
      setOptimizedResume(pdfData);
    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-center">Resume Optimizer</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <JobDescriptionInput
          value={jobDescription}
          onChange={(value) => setJobDescription(value)}
        />

        <FileUpload
          onFileSelect={(file) => setResumeFile(file)}
          selectedFile={resumeFile}
        />
      </div>

      <div className="flex justify-center mb-8">
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg disabled:opacity-50"
        >
          {isLoading ? "Processing..." : "Optimize Resume"}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {optimizedResume && <ResultDisplay optimizedResume={optimizedResume} />}
    </main>
  );
}
