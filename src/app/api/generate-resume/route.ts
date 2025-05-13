// app/api/generate-resume/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import pdf from "pdf-parse";
import latex from "node-latex";
import fs from "fs/promises"; // For reading template file
import path from "path";
import formidable from "formidable"; // For parsing multipart/form-data
import { Readable } from "stream";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper to parse FormData (Next.js Edge runtime doesn't fully support req.formData() with files easily yet for complex cases)
// For Node.js runtime (default for API routes), we can use formidable
const parseForm = (
  req: NextRequest
): Promise<{ fields: formidable.Fields; files: formidable.Files }> => {
  return new Promise((resolve, reject) => {
    // formidable needs a Node.js request object. We can adapt.
    // Convert NextRequest to something Formidable can somewhat work with
    // This is a bit of a hack for formidable. For simpler cases, req.formData() might work.
    // However, file handling with req.formData() in Next.js API routes can be tricky.

    const chunks: Uint8Array[] = [];
    const reader = req.body?.getReader();

    const processStream = async () => {
      if (!reader) return reject(new Error("Request body is null"));
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
        }
        const buffer = Buffer.concat(chunks);
        const formidableReq = Readable.from(buffer) as any; // Cast to any to satisfy formidable
        formidableReq.headers = {}; // formidable expects headers
        // Extract content-type for formidable
        const contentType = req.headers.get("content-type");
        if (contentType) {
          formidableReq.headers["content-type"] = contentType;
        }

        const form = formidable({});
        form.parse(formidableReq, (err, fields, files) => {
          if (err) {
            reject(err);
            return;
          }
          resolve({ fields, files });
        });
      } catch (error) {
        reject(error);
      }
    };
    processStream();
  });
};

// --- LaTeX Template (Store this in a file, e.g., `lib/resume_template.tex`) ---
// For this example, I'll define it as a string here.
// In a real app, load it from a file.
const getLatexTemplate = async (): Promise<string> => {
  // A very basic LaTeX template. You'll want a much more sophisticated one.
  // Placeholders like %%NAME%%, %%EMAIL%%, %%SUMMARY%%, %%EXPERIENCE%%, %%EDUCATION%%, %%SKILLS%%
  // In a real scenario, load this from a file:
  // const templatePath = path.join(process.cwd(), 'lib', 'resume_template.tex');
  // return fs.readFile(templatePath, 'utf-8');

  return `
\\documentclass[a4paper,10pt]{article}
\\usepackage[utf8]{inputenc}
\\usepackage{geometry}
\\geometry{a4paper, margin=1in}
\\usepackage{enumitem} % For customized lists
\\usepackage{hyperref} % For clickable links

\\title{%%NAME%% - Résumé}
\\author{%%EMAIL%% | %%PHONE%% | %%LINKEDIN%%}
\\date{} % No date

\\begin{document}
\\maketitle
\\thispagestyle{empty} % No page number on first page

\\section*{Summary}
%%SUMMARY%%

\\section*{Experience}
%%EXPERIENCE%%

\\section*{Education}
%%EDUCATION%%

\\section*{Skills}
%%SKILLS%%

\\end{document}
  `;
};

// Helper to format structured data into LaTeX (simplified)
const formatExperienceForLatex = (experiences: any[]): string => {
  if (!experiences || experiences.length === 0) return "N/A";
  return experiences
    .map(
      (exp) => `
\\textbf{${exp.title}} at \\textbf{${exp.company}} (${exp.dates})
\\begin{itemize}[leftmargin=*]
  ${exp.responsibilities
    .map((r: string) => `\\item ${r.replace(/&/g, "\\&").replace(/%/g, "\\%")}`)
    .join("\n  ")}
\\end{itemize}
  `
    )
    .join("\\vspace{0.5em}\n");
};

const formatEducationForLatex = (educations: any[]): string => {
  if (!educations || educations.length === 0) return "N/A";
  return educations
    .map(
      (edu) => `
\\textbf{${edu.degree}} - ${edu.institution} (${edu.year})
${
  edu.details
    ? `\\begin{itemize}[leftmargin=*]\\item ${edu.details
        .replace(/&/g, "\\&")
        .replace(/%/g, "\\%")}\\end{itemize}`
    : ""
}
  `
    )
    .join("\\vspace{0.5em}\n");
};

const formatSkillsForLatex = (skills: string[]): string => {
  if (!skills || skills.length === 0) return "N/A";
  return `\\begin{itemize}[leftmargin=*]
  ${skills
    .map((skill) => `\\item ${skill.replace(/&/g, "\\&").replace(/%/g, "\\%")}`)
    .join("\n  ")}
\\end{itemize}`;
};

export async function POST(request: NextRequest) {
  try {
    const { fields, files } = await parseForm(request);

    const jobDetailsString = fields.jobDetails?.[0];
    const resumeFile = files.resumeFile?.[0];

    if (!jobDetailsString || !resumeFile) {
      return NextResponse.json(
        { error: "Missing jobDetails (JSON string) or resumeFile (PDF)" },
        { status: 400 }
      );
    }

    let jobDetails: any;
    try {
      jobDetails = JSON.parse(jobDetailsString);
    } catch (e) {
      return NextResponse.json(
        { error: "Invalid JSON format for jobDetails" },
        { status: 400 }
      );
    }

    // 1. Parse PDF Resume
    const pdfBuffer = await fs.readFile(resumeFile.filepath);
    const pdfData = await pdf(pdfBuffer);
    const resumeText = pdfData.text;

    // Clean up temporary file if formidable created one
    if (resumeFile.filepath) {
      await fs
        .unlink(resumeFile.filepath)
        .catch((err) => console.warn("Could not unlink temp file:", err));
    }

    // 2. LLM: Parse resume text and generate optimized JSON content
    // This prompt needs significant refinement for production quality.
    const systemPrompt = `
You are an expert resume writer and ATS optimization specialist.
Your task is to take a user's raw resume text and a job description, then generate a highly optimized, ATS-friendly resume content in JSON format.
The JSON output MUST strictly follow this structure:
{
  "name": "Full Name",
  "email": "email@example.com",
  "phone": "123-456-7890",
  "linkedin": "linkedin.com/in/username (optional)",
  "github": "github.com/username (optional)",
  "portfolio": "yourportfolio.com (optional)",
  "summary": "A 2-3 sentence compelling summary tailored to the job description, highlighting key skills and experience.",
  "experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "location": "City, State",
      "dates": "Month Year – Month Year (or Present)",
      "responsibilities": [
        "Responsibility 1, using keywords from job description.",
        "Responsibility 2, quantifying achievements.",
        "Responsibility 3, tailored to the job."
      ]
    }
  ],
  "education": [
    {
      "degree": "Degree Name (e.g., Bachelor of Science in Computer Science)",
      "institution": "University Name",
      "location": "City, State",
      "year": "Graduation Year (or Expected)",
      "details": "Relevant coursework, honors, GPA (optional, if strong)"
    }
  ],
  "skills": {
    "technical": ["Skill1", "Skill2", "Programming Language"],
    "soft": ["Communication", "Teamwork"],
    "other": ["Relevant Tool", "Certification"]
  },
  "projects": [
    {
      "name": "Project Name",
      "description": "Brief description, highlighting relevant skills and technologies.",
      "link": "URL to project (optional)"
    }
  ]
}

Analyze the provided job description for keywords, required skills, and experience.
Rewrite and rephrase the user's resume content to align perfectly with the job description, aiming for a top ATS score.
Ensure professional language and quantify achievements where possible.
Extract contact information accurately.
If some information is not present in the user's resume, try to infer it or leave it blank/null if not inferable.
Focus on clarity, conciseness, and keyword optimization based on the job description.
Do NOT include any explanations or text outside the JSON structure. Just the JSON.
`;

    const userMessage = `
Job Description:
\`\`\`json
${JSON.stringify(jobDetails, null, 2)}
\`\`\`

User's Current Resume Text:
\`\`\`text
${resumeText}
\`\`\`

Generate the optimized resume JSON based on the above.
`;

    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview", // Or gpt-3.5-turbo if cost is a concern, but gpt-4 is better for this
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      response_format: { type: "json_object" }, // Enforce JSON output if using a compatible model
    });

    const optimizedResumeJsonString =
      chatCompletion.choices[0]?.message?.content;
    if (!optimizedResumeJsonString) {
      throw new Error("LLM did not return content.");
    }

    let optimizedResumeData: any;
    try {
      optimizedResumeData = JSON.parse(optimizedResumeJsonString);
    } catch (e) {
      console.error(
        "LLM output was not valid JSON:",
        optimizedResumeJsonString
      );
      throw new Error("LLM did not return valid JSON.");
    }

    // 3. Populate LaTeX Template
    let latexDoc = await getLatexTemplate(); // Load your .tex template file here ideally

    // Replace placeholders (this is basic, a more robust templating might be needed)
    latexDoc = latexDoc.replace("%%NAME%%", optimizedResumeData.name || "");
    latexDoc = latexDoc.replace("%%EMAIL%%", optimizedResumeData.email || "");
    latexDoc = latexDoc.replace("%%PHONE%%", optimizedResumeData.phone || "");
    latexDoc = latexDoc.replace(
      "%%LINKEDIN%%",
      optimizedResumeData.linkedin || ""
    );
    // ... add more contact fields if in your template
    latexDoc = latexDoc.replace(
      "%%SUMMARY%%",
      (optimizedResumeData.summary || "")
        .replace(/&/g, "\\&")
        .replace(/%/g, "\\%")
    );

    // For complex sections, generate LaTeX parts
    const experienceLatex = formatExperienceForLatex(
      optimizedResumeData.experience
    );
    const educationLatex = formatEducationForLatex(
      optimizedResumeData.education
    );

    // Combine all skills into one list for simplicity in this template
    let allSkills: string[] = [];
    if (optimizedResumeData.skills?.technical)
      allSkills = allSkills.concat(optimizedResumeData.skills.technical);
    if (optimizedResumeData.skills?.soft)
      allSkills = allSkills.concat(optimizedResumeData.skills.soft);
    if (optimizedResumeData.skills?.other)
      allSkills = allSkills.concat(optimizedResumeData.skills.other);
    const skillsLatex = formatSkillsForLatex(allSkills);

    latexDoc = latexDoc.replace("%%EXPERIENCE%%", experienceLatex);
    latexDoc = latexDoc.replace("%%EDUCATION%%", educationLatex);
    latexDoc = latexDoc.replace("%%SKILLS%%", skillsLatex);
    // ... Handle projects section similarly if you add it to the template

    // 4. Compile LaTeX to PDF
    // This is the tricky part for serverless. node-latex needs a LaTeX distribution.
    // It might work locally but fail on Vercel unless you use Docker with LaTeX installed.
    const pdfOutputStream = latex(latexDoc, {
      // You might need to specify paths to latex binaries if not in PATH
      // cmd: 'pdflatex', // or xelatex if using specific fonts/unicode features
      // inputs: path.resolve(__dirname, '../../lib/latex_inputs'), // For custom .sty files etc.
      // fonts: path.resolve(__dirname, '../../lib/latex_fonts'),
    });

    // Collect PDF data from stream
    const pdfChunks: Buffer[] = [];
    for await (const chunk of pdfOutputStream) {
      pdfChunks.push(chunk as Buffer);
    }
    const finalPdfBuffer = Buffer.concat(pdfChunks);

    // 5. Return PDF
    return new NextResponse(finalPdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="optimized_resume_${
          optimizedResumeData.name?.replace(/\s+/g, "_") || "user"
        }.pdf"`,
      },
    });
  } catch (error: any) {
    console.error("Error generating resume:", error);
    let errorMessage = "Failed to generate resume.";
    if (error.response && error.response.data && error.response.data.error) {
      // OpenAI error
      errorMessage = error.response.data.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    // Check if it's a LaTeX compilation error
    if (error.message && error.message.includes("LaTeX")) {
      // A bit fragile check
      errorMessage = `LaTeX Compilation Failed: ${error.message}. Ensure LaTeX is correctly installed and configured in the environment.`;
    }
    return NextResponse.json(
      { error: errorMessage, details: error.stack },
      { status: 500 }
    );
  }
}

// To disable bodyParser for this route so formidable can parse it
export const config = {
  api: {
    bodyParser: false,
  },
};
