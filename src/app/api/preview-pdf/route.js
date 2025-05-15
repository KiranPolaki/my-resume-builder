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
    // For this example, we'll simulate a PDF preview

    // Check if file exists - this would be replaced with cloud storage in production
    if (!fs.existsSync(pdfPath)) {
      // For demo purposes, we'll return an HTML preview placeholder
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Resume Preview</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              line-height: 1.6;
            }
            h1, h2, h3 {
              color: #2a5885;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
              border-bottom: 1px solid #eee;
              padding-bottom: 10px;
            }
            .section {
              margin-bottom: 20px;
            }
            .watermark {
              position: fixed;
              bottom: 10px;
              right: 10px;
              opacity: 0.5;
              color: #888;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>John Doe</h1>
            <p>Senior Software Developer</p>
            <p>john.doe@example.com | (123) 456-7890 | San Francisco, CA</p>
          </div>
          
          <div class="section">
            <h2>Summary</h2>
            <p>Experienced software developer with expertise in full-stack development...</p>
          </div>
          
          <div class="section">
            <h2>Experience</h2>
            <h3>Senior Developer - Tech Company</h3>
            <p>Jan 2020 - Present | San Francisco, CA</p>
            <ul>
              <li>Led development of scalable web applications using React and Node.js</li>
              <li>Improved system performance by 40% through code optimization</li>
            </ul>
          </div>
          
          <div class="section">
            <h2>Skills</h2>
            <p>JavaScript, React, Node.js, Python, AWS, Docker, Kubernetes</p>
          </div>
          
          <div class="watermark">Optimized Resume Preview</div>
        </body>
        </html>
        `,
        {
          status: 200,
          headers: {
            "Content-Type": "text/html",
          },
        }
      );
    }

    // In a real application, you'd convert the PDF to a preview
    // For this demo, we'll return a placeholder HTML
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Resume Preview</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            line-height: 1.6;
          }
          h1, h2, h3 {
            color: #2a5885;
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 1px solid #eee;
            padding-bottom: 10px;
          }
          .section {
            margin-bottom: 20px;
          }
          .watermark {
            position: fixed;
            bottom: 10px;
            right: 10px;
            opacity: 0.5;
            color: #888;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>John Doe</h1>
          <p>Senior Software Developer</p>
          <p>john.doe@example.com | (123) 456-7890 | San Francisco, CA</p>
        </div>
        
        <div class="section">
          <h2>Summary</h2>
          <p>Experienced software developer with expertise in full-stack development...</p>
        </div>
        
        <div class="section">
          <h2>Experience</h2>
          <h3>Senior Developer - Tech Company</h3>
          <p>Jan 2020 - Present | San Francisco, CA</p>
          <ul>
            <li>Led development of scalable web applications using React and Node.js</li>
            <li>Improved system performance by 40% through code optimization</li>
          </ul>
        </div>
        
        <div class="section">
          <h2>Skills</h2>
          <p>JavaScript, React, Node.js, Python, AWS, Docker, Kubernetes</p>
        </div>
        
        <div class="watermark">Optimized Resume Preview</div>
      </body>
      </html>
      `,
      {
        status: 200,
        headers: {
          "Content-Type": "text/html",
        },
      }
    );
  } catch (error) {
    console.error("Error generating PDF preview:", error);
    return NextResponse.json(
      { error: "Failed to generate preview: " + error.message },
      { status: 500 }
    );
  }
}
