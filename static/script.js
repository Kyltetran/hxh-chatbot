/**
 * HXH Chatbot - Vietnamese Nôm Poetry Generator
 * Frontend JavaScript Module
 */

// DOM Elements
const poemForm = document.getElementById("poem-form");
const topicInput = document.getElementById("topic");
const numLinesSelect = document.getElementById("num_lines");
const submitBtn = document.getElementById("submit-btn");
const btnText = submitBtn.querySelector(".btn-text");
const btnLoader = submitBtn.querySelector(".btn-loader");
const outputSection = document.getElementById("output-section");
const poemOutput = document.getElementById("output");
const keywordsSection = document.getElementById("keywords-used");
const errorMessage = document.getElementById("error-message");

/**
 * Initialize the application
 */
function init() {
  // Add form submit event listener
  poemForm.addEventListener("submit", handleFormSubmit);

  // Add input validation
  topicInput.addEventListener("input", clearError);

  // No custom Enter key handler needed; form submit handles Enter naturally

  console.log("HXH Chatbot initialized successfully");
}

/**
 * Handle form submission
 * @param {Event} e - Submit event
 */
async function handleFormSubmit(e) {
  e.preventDefault();

  // Validate form
  if (!validateForm()) {
    return;
  }

  // Get form values
  const topic = topicInput.value.trim();
  const numLines = parseInt(numLinesSelect.value);

  // Generate poem
  await generatePoem(topic, numLines);
}

/**
 * Validate form inputs
 * @returns {boolean} - True if valid, false otherwise
 */
function validateForm() {
  const topic = topicInput.value.trim();

  if (!topic) {
    showError("Vui lòng nhập chủ đề cho bài thơ");
    topicInput.focus();
    return false;
  }

  if (topic.length < 2) {
    showError("Chủ đề phải có ít nhất 2 ký tự");
    topicInput.focus();
    return false;
  }

  if (topic.length > 100) {
    showError("Chủ đề không được vượt quá 100 ký tự");
    topicInput.focus();
    return false;
  }

  return true;
}

/**
 * Generate poem using API
 * @param {string} topic - Poem topic
 * @param {number} numLines - Number of lines (4 or 8)
 */
async function generatePoem(topic, numLines) {
  try {
    // Show loading state
    setLoadingState(true);
    clearError();
    hideOutput();

    // Make API request
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        topic: topic,
        num_lines: numLines,
      }),
    });

    // Check response status
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Parse response
    const data = await response.json();

    // Validate response data
    if (!data.poem) {
      throw new Error("Không nhận được bài thơ từ máy chủ");
    }

    // Display poem
    displayPoem(data.poem, data.keywords_used, topic);
  } catch (error) {
    console.error("Error generating poem:", error);
    showError("Đã xảy ra lỗi khi tạo bài thơ. Vui lòng thử lại sau.");
  } finally {
    // Hide loading state
    setLoadingState(false);
  }
}

/**
 * Display generated poem
 * @param {string} poem - Generated poem text
 * @param {Array} keywords - Keywords used in generation
 * @param {string} topic - The topic of the poem
 */

function displayPoem(poem, keywords, topic) {
  // Update title with topic
  const outputTitle = document.querySelector(".output-title");
  if (outputTitle) {
    outputTitle.textContent = `Thơ về ${topic}`;
  }

  // Parse poem and explanation
  const parsed = parsePoemContent(poem);

  // Find focus keywords from explanation section
  let focusKeywords = [];
  if (parsed.explanation) {
    // Try to extract keyword titles from explanation
    const keywordRegex = /^(?:\d+\.\s*)?([A-ZÀ-Ỵa-zà-ỹ\s'-]+)/gm;
    let match;
    const lines = parsed.explanation.split("\n");
    for (const line of lines) {
      match = line.match(/^(?:\d+\.\s*)?([A-ZÀ-Ỵa-zà-ỹ\s'-]+)/);
      if (match && match[1]) {
        const kw = match[1].trim();
        if (kw && !focusKeywords.includes(kw)) {
          focusKeywords.push(kw);
        }
      }
    }
  }

  // Bold keywords in the poem text
  let poemHTML = parsed.poem;
  focusKeywords.forEach((kw) => {
    // Only bold if word is at least 2 characters
    if (kw.length > 1) {
      // Replace all occurrences, word boundary, case-insensitive
      const re = new RegExp(
        `\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
        "gi"
      );
      poemHTML = poemHTML.replace(re, (m) => `<strong>${m}</strong>`);
    }
  });

  poemOutput.innerHTML = poemHTML;

  // Display explanation section
  const explanationContent = document.getElementById("explanation-content");
  if (parsed.explanation && explanationContent) {
    explanationContent.innerHTML = formatExplanation(parsed.explanation);
    document.getElementById("explanation-section").style.display = "block";
  } else {
    document.getElementById("explanation-section").style.display = "none";
  }

  // Show output section with animation
  showOutput();

  // Show side clouds and set their positions dynamically
  setTimeout(() => {
    outputSection.scrollIntoView({ behavior: "smooth", block: "nearest" });

    // Show cloud patterns
    const leftCloud = document.getElementById("cloud-left");
    const rightCloud = document.getElementById("cloud-right");
    if (leftCloud && rightCloud) {
      leftCloud.style.display = "block";
      rightCloud.style.display = "block";
      // Position clouds dynamically based on output section height
      const outputRect = outputSection.getBoundingClientRect();
      const scrollY = window.scrollY || window.pageYOffset;
      // Left cloud: a bit below the output box
      leftCloud.style.top = outputRect.bottom + scrollY - 200 + "px";
      // Right cloud: further down, not on same line
      rightCloud.style.top = outputRect.bottom + scrollY + 120 + "px";
    }
  }, 100);
}

/**
 * Parse poem content to separate poem and explanation
 * @param {string} content - Full content from API
 * @returns {Object} - {poem: string, explanation: string}
 */
function parsePoemContent(content) {
  // Look for common markers for explanation section
  const markers = [
    "**CHÚ GIẢI**",
    "CHÚ GIẢI",
    "---",
    "**Chú giải**",
    "Chú giải",
  ];

  let splitIndex = -1;
  let foundMarker = "";

  for (const marker of markers) {
    const index = content.indexOf(marker);
    if (index !== -1) {
      splitIndex = index;
      foundMarker = marker;
      break;
    }
  }

  if (splitIndex !== -1) {
    const poem = content.substring(0, splitIndex).trim();
    let explanation = content.substring(splitIndex).trim();

    // Remove the marker from explanation
    explanation = explanation.replace(foundMarker, "").trim();
    // Remove leading dashes or separators
    explanation = explanation.replace(/^[-*]+\s*/, "").trim();

    return { poem, explanation };
  }

  return { poem: content, explanation: "" };
}

/**
 * Format explanation section into HTML
 * @param {string} explanation - Raw explanation text
 * @returns {string} - Formatted HTML
 */
function formatExplanation(explanation) {
  // Split explanation into individual keyword entries
  // Each entry starts with a number (1., 2., etc.) at the beginning of a line
  const entries = [];
  const lines = explanation.split("\n");
  let currentEntry = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Check if this line starts a new numbered entry (must be at start of line)
    // Pattern: starts with "1. ", "2. ", etc. followed by text
    if (/^\d+\.\s+\S/.test(line)) {
      // Save previous entry if it exists
      if (currentEntry.length > 0) {
        entries.push(currentEntry.join("\n"));
      }
      // Start new entry
      currentEntry = [line];
    }
    // Special case: "Từ:" prefix (alternative format)
    else if (/^Từ:\s+/i.test(line)) {
      if (currentEntry.length > 0) {
        entries.push(currentEntry.join("\n"));
      }
      currentEntry = [line];
    }
    // Add to current entry (including blank lines for spacing)
    else {
      currentEntry.push(line);
    }
  }

  // Add the last entry
  if (currentEntry.length > 0) {
    entries.push(currentEntry.join("\n"));
  }

  // If no entries were found (no numbering), return simple format
  if (entries.length === 0) {
    return `<div class="keyword-detail">${escapeHTML(explanation)}</div>`;
  }

  // Format each entry into HTML
  let html = "";
  for (const entry of entries) {
    html += formatKeywordEntry(entry);
  }

  html = html.replace(/\n/g, "<br>");
  return html;
}
/**
 * Format a single keyword entry (one complete word with all its details)
 * @param {string} entry - Full text for one keyword
 * @returns {string} - Formatted HTML
 */
function formatKeywordEntry(entry) {
  const rawLines = entry.split("\n");
  const lines = rawLines.map(l => l.trim());
  if (lines.length === 0) return "";

  // First line is usually the keyword (might start with number)
  let title = lines[0].replace(/^\d+\.\s*/, "").trim();

  // Check if title contains the actual keyword
  // Format: "1. nghèu ngao" or "phảo phộm" etc.
  let keywordName = title;

  let contentHTML = "";
  let inCitation = false;
  let citationType = "";

  for (let i = 1; i < lines.length; i++) {
    let line = lines[i];

    // Check for field labels
    if (
      line.startsWith("- Chữ Nôm:") ||
      line.toLowerCase().includes("chữ nôm:")
    ) {
      contentHTML += `<div class="keyword-detail"><span class='explanation-label'>Chữ Nôm:</span> ${line
        .replace(/^-?\s*(Chữ Nôm:|chữ nôm:)/i, "")
        .trim()}</div>`;
      inCitation = false;
    } else if (
      line.startsWith("- Giải nghĩa:") ||
      line.toLowerCase().includes("giải nghĩa:")
    ) {
      contentHTML += `<div class="keyword-detail"><span class='explanation-label'>Giải nghĩa:</span> ${line
        .replace(/^-?\s*(Giải nghĩa:|giải nghĩa:)/i, "")
        .trim()}</div>`;
      inCitation = false;
    } else if (
      line.startsWith("- Giải cấu tạo chữ:") ||
      line.toLowerCase().includes("giải cấu tạo chữ:")
    ) {
      contentHTML += `<div class="keyword-detail"><span class='explanation-label'>Giải cấu tạo chữ:</span> ${line
        .replace(/^-?\s*(Giải cấu tạo chữ:|giải cấu tạo chữ:)/i, "")
        .trim()}</div>`;
      inCitation = false;
    } else if (
      line.startsWith("- Trích dẫn (TV):") ||
      line.toLowerCase().includes("trích dẫn (tv):")
    ) {
      citationType = "TV";
      const citationText = line
        .replace(/^-?\s*(Trích dẫn \(TV\):|trích dẫn \(tv\):)/i, "")
        .trim();
      if (citationText) {
        contentHTML += `<div class="keyword-detail"><span class='explanation-label'>Trích dẫn (TV):</span></div>`;
        contentHTML += `<div class="keyword-citation">${citationText.replace(/\n/g, "<br>")}`;
        inCitation = true;
      } else {
        contentHTML += `<div class="keyword-detail"><span class='explanation-label'>Trích dẫn (TV):</span></div><div class="keyword-citation">`;
        inCitation = true;
      }
    } else if (
      line.startsWith("- Trích dẫn (Nôm):") ||
      line.toLowerCase().includes("trích dẫn (nôm):")
    ) {
      if (inCitation) {
        contentHTML += "</div>";
      }
      citationType = "Nôm";
      const citationText = line
        .replace(/^-?\s*(Trích dẫn \(Nôm\):|trích dẫn \(nôm\):)/i, "")
        .trim();
      if (citationText) {
        contentHTML += `<div class="keyword-detail"><span class='explanation-label'>Trích dẫn (Nôm):</span></div>`;
        contentHTML += `<div class="keyword-citation">${citationText.replace(/\n/g, "<br>")}`;
        inCitation = true;
      } else {
        contentHTML += `<div class="keyword-detail"><span class='explanation-label'>Trích dẫn (Nôm):</span></div><div class="keyword-citation">`;
        inCitation = true;
      }
    } else if (line.startsWith("-")) {
      // Other bullet points
      contentHTML += `<div class="keyword-detail">${line
        .substring(1)
        .trim()}</div>`;
      inCitation = false;
    } else if (inCitation) {
      // Continue citation
      contentHTML += `<br>${line.replace(/\n/g, "<br>")}`;
    } else {
      // Regular content line
      contentHTML += `<div class="keyword-detail">${line}</div>`;
    }
  }

  // Close any open citation
  if (inCitation) {
    contentHTML += "</div>";
  }

  return `
    <div class="keyword-item">
      <h4>${escapeHTML(keywordName)}</h4>
      ${contentHTML}
    </div>
  `;
}

/**
 * Set loading state for submit button
 * @param {boolean} isLoading - Loading state
 */
function setLoadingState(isLoading) {
  if (isLoading) {
    submitBtn.disabled = true;
    btnText.style.display = "none";
    btnLoader.style.display = "flex";
    topicInput.disabled = true;
    numLinesSelect.disabled = true;
  } else {
    submitBtn.disabled = false;
    btnText.style.display = "inline";
    btnLoader.style.display = "none";
    topicInput.disabled = false;
    numLinesSelect.disabled = false;
  }
}

/**
 * Show error message
 * @param {string} message - Error message to display
 */
function showError(message) {
  errorMessage.textContent = message;
  errorMessage.style.display = "block";

  // Auto-hide error after 5 seconds
  setTimeout(() => {
    clearError();
  }, 5000);
}

/**
 * Clear error message
 */
function clearError() {
  errorMessage.style.display = "none";
  errorMessage.textContent = "";
}

/**
 * Show output section
 */
function showOutput() {
  outputSection.style.display = "block";
  outputSection.classList.add("fade-in");
}

/**
 * Hide output section
 */
function hideOutput() {
  outputSection.style.display = "none";
  outputSection.classList.remove("fade-in");
}

/**
 * Utility: Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} - Escaped text
 */
function escapeHTML(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
