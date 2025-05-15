import axios from "axios";

// You'll need to get an API key from DeepSeek
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";

/**
 * Optimize resume data for a specific job description
 * @param {Object} resumeData - Structured resume data
 * @param {string} jobDescription - Job description to optimize for
 * @returns {Promise<Object>} - Optimized resume data
 */
export async function optimizeResume(resumeData, jobDescription) {
  try {
    // Convert resume data to string for the prompt
    const resumeDataString = JSON.stringify(resumeData, null, 2);

    // Prepare the prompt for DeepSeek
    const prompt = `
      I have a resume in JSON format and a job description. I need to modify the resume to better match the job description.
      
      Here is the job description:
      ${jobDescription}
      
      Here is the current resume data:
      ${resumeDataString}
      
      Please analyze the job description and modify the resume JSON to make it more appealing and relevant to the position.
      
      Specifically:
      1. Highlight relevant skills that match the job description
      2. Rephrase experience descriptions to include keywords from the job description
      3. Reorganize projects to prioritize those most relevant to the position
      4. Maintain the same JSON structure but optimize the content
      5. Do not invent new experiences or skills, only reword existing ones to better match the job
      6. Make sure to keep all dates, locations, and factual information unchanged
      
      Return only the optimized JSON with no additional text or explanation.
    `;

    // Make API call to DeepSeek
    const response = await axios.post(
      DEEPSEEK_API_URL,
      {
        model: "deepseek-coder", // Or the appropriate model
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 4000,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
        },
      }
    );

    // Extract the JSON response
    const assistantMessage = response.data.choices[0].message.content;

    // Find JSON in the response
    const jsonMatch = assistantMessage.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error("Could not extract JSON from the response");
    }

    const jsonString = jsonMatch[0];
    const optimizedData = JSON.parse(jsonString);

    return optimizedData;
  } catch (error) {
    console.error("Error in optimizeResume:", error);
    throw new Error(`Failed to optimize resume: ${error.message}`);
  }
}
