"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import jsPDF from "jspdf";
import HeaderBar from "@/components/dashboard/Headerbar";

const AdvisorPage = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [newReport, setNewReport] = useState<string | null>(null);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const fetchReports = async () => {
      if (user?.uid) {
        try {
          const response = await fetch(`/api/user/${user.uid}`);
          if (!response.ok) throw new Error("Failed to fetch user data");
          const userProfile = await response.json();
          const healthReports = userProfile.healthReports || [];
          setReports(healthReports);
        } catch (error) {
          console.error("Failed to fetch reports:", error);
        }
      }
    };
    fetchReports();
  }, [user]);

  const handleSearch = async () => {
    if (user?.uid && searchQuery) {
      try {
        setHasSearched(true);
        const response = await fetch(
          `/api/health-reports/search?userId=${
            user.uid
          }&query=${encodeURIComponent(searchQuery)}`
        );
        if (!response.ok) throw new Error("Failed to search reports");
        const data = await response.json();
        setSearchResults(data);
      } catch (error) {
        console.error("Search error:", error);
        setSearchResults([]);
      }
    }
  };

  const handleGenerateReport = async () => {
    if (user?.uid) {
      try {
        setLoading(true);
        const response = await fetch("/api/health-advisor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.uid }),
        });
        if (!response.ok) throw new Error("Failed to generate report");
        const data = await response.json();
        setNewReport(data.reportText);
        const userResponse = await fetch(`/api/user/${user.uid}`);
        if (userResponse.ok) {
          const userProfile = await userResponse.json();
          setReports(userProfile.healthReports || []);
        }
      } catch (error) {
        console.error("Failed to generate report:", error);
        setNewReport("Unable to generate health advice at this time.");
      } finally {
        setLoading(false);
      }
    }
  };

  const formatReportForDisplay = (reportText: string) => {
    const sections = reportText.split("\n\n");
    return sections.map((section, index) => {
      const lines = section.split("\n");
      const title = lines[0];
      const content = lines.slice(1);

      const isHeader =
        title.toUpperCase() === title ||
        [
          "HEALTH ADVISORY",
          "OVERVIEW",
          "RECOMMENDATIONS",
          "IMPORTANT NOTES",
        ].some((keyword) => title.toUpperCase().includes(keyword));

      if (isHeader) {
        return (
          <div key={index} className="mb-6">
            <h3 className="text-lg font-bold text-gray-800 mb-3 border-b-2 border-blue-200 pb-2">
              {title}
            </h3>
            <div className="space-y-2">
              {content.map((line, lineIndex) => {
                if (line.trim() === "") return null;
                return (
                  <p
                    key={lineIndex}
                    className="text-gray-700 leading-relaxed pl-2"
                  >
                    {line.replace(/^\*\*|\*\*$/g, "").replace(/^\*/, "•")}
                  </p>
                );
              })}
            </div>
          </div>
        );
      } else {
        return (
          <div key={index} className="mb-4">
            <p className="text-gray-700 leading-relaxed">
              {section.replace(/^\*\*|\*\*$/g, "").replace(/^\*/, "•")}
            </p>
          </div>
        );
      }
    });
  };

  const downloadPDF = (reportText: string, dateTime: string) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    const maxWidth = pageWidth - margin * 2;
    let yPosition = margin;

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Health Advisory Report", margin, yPosition);
    yPosition += 15;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated on: ${dateTime}`, margin, yPosition);
    yPosition += 20;

    const sections = reportText.split("\n\n");

    sections.forEach((section) => {
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = margin;
      }

      const lines = section.split("\n");
      const title = lines[0];
      const content = lines.slice(1);

      const isHeader =
        title.toUpperCase() === title ||
        [
          "HEALTH ADVISORY",
          "OVERVIEW",
          "RECOMMENDATIONS",
          "IMPORTANT NOTES",
        ].some((keyword) => title.toUpperCase().includes(keyword));

      if (isHeader && title.trim() !== "") {
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        const headerLines = doc.splitTextToSize(title, maxWidth);
        doc.text(headerLines, margin, yPosition);
        yPosition += headerLines.length * 7 + 5;

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        content.forEach((line) => {
          if (line.trim() !== "") {
            if (yPosition > pageHeight - 30) {
              doc.addPage();
              yPosition = margin;
            }

            let cleanLine = line
              .replace(/^\*\*|\*\*$/g, "")
              .replace(/^\* /, "• ");
            const textLines = doc.splitTextToSize(cleanLine, maxWidth - 10);
            doc.text(textLines, margin + 5, yPosition);
            yPosition += textLines.length * 5 + 3;
          }
        });
        yPosition += 10;
      } else if (section.trim() !== "") {
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        let cleanSection = section
          .replace(/^\*\*|\*\*$/g, "")
          .replace(/^\* /, "• ");
        const textLines = doc.splitTextToSize(cleanSection, maxWidth);
        doc.text(textLines, margin, yPosition);
        yPosition += textLines.length * 5 + 8;
      }
    });

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.text(
        "This report is for informational purposes only. Please consult your healthcare provider for medical advice.",
        margin,
        pageHeight - 10
      );
      doc.text(
        `Page ${i} of ${pageCount}`,
        pageWidth - margin - 30,
        pageHeight - 10
      );
    }

    doc.save(`health_advisory_${dateTime.replace(/[:/\s,]/g, "_")}.pdf`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div>
      <HeaderBar onLocationClick={() => setIsLocationModalOpen(false)} />
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Health Advisor
        </h1>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-yellow-100 p-6 mb-6 flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your health reports..."
              className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            />
            <button
              onClick={handleSearch}
              className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-200"
              disabled={!searchQuery.trim()}
            >
              Search
            </button>
          </div>
          <button
            onClick={handleGenerateReport}
            className="bg-green-500 text-white py-2 px-6 rounded-lg hover:bg-green-600 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? "Generating..." : "Generate New Report"}
          </button>
        </div>

        {hasSearched && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-yellow-100 p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">
              Search Results
            </h2>
            {searchResults.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {searchResults.map((result, index) => (
                  <div
                    key={index}
                    className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl shadow-md border border-yellow-200 p-4 hover:shadow-lg transition-all duration-300 hover:scale-105"
                  >
                    <div className="flex flex-col h-full">
                      <div className="flex items-center justify-between mb-3">
                        <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-semibold">
                          Result #{index + 1}
                        </div>
                        <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                      </div>
                      <div className="mb-4 flex-grow">
                        <p className="text-sm text-gray-600 mb-1">
                          Generated on:
                        </p>
                        <p className="text-sm font-medium text-gray-800">
                          {formatDate(result.createdAt)}
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          downloadPDF(
                            result.reportText,
                            formatDate(result.createdAt)
                          )
                        }
                        className="w-full bg-yellow-500 text-white py-2 px-3 rounded-lg hover:bg-yellow-600 transition duration-200 text-sm font-medium flex items-center justify-center gap-2"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        Download PDF
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-600 bg-gray-50 rounded-lg p-8">
                <svg
                  className="w-12 h-12 text-gray-400 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <p className="text-lg font-medium">
                  No results found for "{searchQuery}"
                </p>
                <p className="text-sm mt-2">
                  Try a different keyword or generate a report containing the
                  term.
                </p>
              </div>
            )}
          </div>
        )}

        {newReport && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-yellow-100 p-6 mb-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                Latest Health Report
              </h2>
              <button
                onClick={() =>
                  downloadPDF(
                    newReport,
                    new Date().toLocaleString("en-IN", {
                      timeZone: "Asia/Kolkata",
                    })
                  )
                }
                className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 text-sm flex items-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Download PDF
              </button>
            </div>
            <div className="text-gray-700">
              {formatReportForDisplay(newReport)}
            </div>
            <p className="text-sm text-gray-500 mt-6 pt-4 border-t border-gray-200">
              Generated on:{" "}
              {new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
            </p>
          </div>
        )}

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-yellow-100 p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Past Reports</h2>
          {reports.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {reports.map((report, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-md border border-gray-200 p-4 hover:shadow-lg transition-all duration-300 hover:scale-105"
                >
                  <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between mb-3">
                      <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold">
                        Report #{index + 1}
                      </div>
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    </div>
                    <div className="mb-4 flex-grow">
                      <p className="text-sm text-gray-600 mb-1">
                        Generated on:
                      </p>
                      <p className="text-sm font-medium text-gray-800">
                        {formatDate(report.createdAt)}
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        downloadPDF(
                          report.reportText,
                          formatDate(report.createdAt)
                        )
                      }
                      className="w-full bg-blue-500 text-white py-2 px-3 rounded-lg hover:bg-blue-600 transition duration-200 text-sm font-medium flex items-center justify-center gap-2"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      Download PDF
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <svg
                className="w-16 h-16 text-gray-300 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-gray-600 text-lg">
                No past reports available.
              </p>
              <p className="text-gray-500 text-sm mt-2">
                Generate your first health report to get started!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdvisorPage;
