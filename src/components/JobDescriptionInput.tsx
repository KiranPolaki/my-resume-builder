"use client";

const JobDescriptionInput = ({ value, onChange }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Job Description</h2>
      <p className="text-gray-600 mb-2">
        Paste the job description you're applying for:
      </p>
      <textarea
        className="w-full h-64 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste job description here..."
      />
    </div>
  );
};

export default JobDescriptionInput;
