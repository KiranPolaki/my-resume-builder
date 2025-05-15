import axios from "axios";
import { GoogleGenAI } from "@google/genai";

// You'll need to get an API key from DeepSeek
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";

const ai = new GoogleGenAI({ apiKey: process.env.GEMNAI_API_KEY });

/**
 * Parse resume PDF content into structured JSON
 * @param {Buffer} pdfBuffer - Buffer containing the PDF file
 * @param {string} jobDescription - The job description text
 * @returns {Promise<Object>} - Structured resume data
 */
export async function parseResumePdf(pdfBuffer, jobDescription) {
  try {
    // Convert PDF buffer to base64
    const base64Pdf = pdfBuffer.toString("base64");

    // Prepare the prompt for DeepSeek
    // This will instruct the model to extract structured data from the PDF
    const prompt = `
      I have a resume in PDF format that I need to extract information from into a structured JSON format.
      
      The JSON should have the following structure:
      {
        "personalInfo": {
          "name": "",
          "email": "",
          "phone": "",
          "location": "",
          "links": []
        },
        "summary": "",
        "education": [
          {
            "institution": "",
            "degree": "",
            "field": "",
            "startDate": "",
            "endDate": "",
            "gpa": ""
          }
        ],
        "experience": [
          {
            "company": "",
            "position": "",
            "startDate": "",
            "endDate": "",
            "location": "",
            "description": "",
            "achievements": []
          }
        ],
        "projects": [
          {
            "name": "",
            "startDate": "",
            "endDate": "",
            "description": "",
            "technologies": [],
            "url": ""
          }
        ],
        "skills": {
          "technical": [],
          "soft": [],
          "languages": [],
          "tools": []
        },
        "certifications": []
      }

      Here is the base64 encoded PDF content: ${base64Pdf}
      
      Please extract the information from this PDF and return only the JSON structure with no additional text or explanation.
    `;

    // Make API call to DeepSeek
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });

    console.log(response.text, "Response from Gemnai");

    console.log(response, "Response from Gemnai");

    // Extract the JSON response from DeepSeek
    const assistantMessage = response.data.choices[0].message.content;

    // Find JSON in the response
    const jsonMatch = assistantMessage.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error("Could not extract JSON from the response");
    }

    const jsonString = jsonMatch[0];
    const resumeData = JSON.parse(jsonString);

    return resumeData;
  } catch (error) {
    console.error("Error in parseResumePdf:", error);
    throw new Error(`Failed to parse PDF: ${error.message}`);
  }
}
