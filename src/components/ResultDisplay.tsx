"use client";

const ResultDisplay = ({ optimizedResume }) => {
  const downloadPdf = () => {
    // Create a link to download the PDF
    const link = document.createElement("a");
    link.href = optimizedResume.pdfUrl;
    link.download = "optimized-resume.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Optimized Resume</h2>

      <div className="mb-4">
        <p className="text-green-600 font-semibold">
          ✓ Your resume has been optimized!
        </p>
        <p className="text-gray-600">
          The resume has been tailored to match the job description with
          improved keyword matching and formatting.
        </p>
      </div>

      <div className="flex justify-between items-center">
        <div>
          <p className="font-medium">
            Score:{" "}
            <span className="text-green-600">{optimizedResume.score}%</span>
          </p>
          <p className="text-sm text-gray-500">ATS compatibility score</p>
        </div>

        <button
          onClick={downloadPdf}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
        >
          Download PDF
        </button>
      </div>

      {optimizedResume.previewUrl && (
        <div className="mt-6 border rounded overflow-hidden">
          <iframe
            src={optimizedResume.previewUrl}
            className="w-full h-96"
            title="Resume Preview"
          />
        </div>
      )}
    </div>
  );
};

export default ResultDisplay;
