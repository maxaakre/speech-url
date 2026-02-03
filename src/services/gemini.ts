import { GoogleGenerativeAI } from "@google/generative-ai";
import { Platform } from "react-native";
import { Article, Language } from "../types";

const fetchPageContent = async (url: string): Promise<string> => {
  // On web, we need a CORS proxy since browsers block cross-origin requests
  const targetUrl = Platform.OS === "web"
    ? `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`
    : url;

  const response = await fetch(targetUrl, {
    headers: Platform.OS === "web" ? {} : {
      "User-Agent": "Mozilla/5.0 (compatible; ArticleReader/1.0)",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.status}`);
  }

  return response.text();
};

const extractTextFromHtml = (html: string): { title: string; content: string } => {
  // Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : "Untitled";

  // Remove script and style tags and their content
  let cleaned = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, " ");

  // Remove nav, header, footer, aside elements
  cleaned = cleaned
    .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, " ")
    .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, " ")
    .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, " ")
    .replace(/<aside\b[^<]*(?:(?!<\/aside>)<[^<]*)*<\/aside>/gi, " ");

  // Try to find article or main content
  const articleMatch = cleaned.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  const mainMatch = cleaned.match(/<main[^>]*>([\s\S]*?)<\/main>/i);

  let contentHtml = articleMatch?.[1] || mainMatch?.[1] || cleaned;

  // Remove all remaining HTML tags
  let content = contentHtml
    .replace(/<[^>]+>/g, " ")
    // Decode common HTML entities
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"')
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    // Clean up whitespace
    .replace(/\s+/g, " ")
    .trim();

  // Split into paragraphs and filter short ones (likely navigation)
  const paragraphs = content
    .split(/\.\s+/)
    .filter((p) => p.length > 50)
    .join(". ");

  return { title, content: paragraphs || content };
};

const detectLanguage = (text: string): Language => {
  // Swedish-specific characters and common words
  const swedishPatterns = /[åäöÅÄÖ]|(?:^|\s)(och|att|det|är|på|för|med|som|av|till|den|har|inte|om|ett|kan|var|vid|jag|från|men)\b/gi;

  // If more than 5 Swedish indicators in the first 1000 chars, likely Swedish
  const sample = text.slice(0, 1000);
  const swedishMatches = sample.match(swedishPatterns) || [];

  return swedishMatches.length > 5 ? 'sv' : 'en';
};

export const extractArticle = async (url: string): Promise<Article> => {
  const html = await fetchPageContent(url);
  const { title, content } = extractTextFromHtml(html);

  if (!content || content.length < 100) {
    throw new Error("Could not extract article content from this URL");
  }

  const language = detectLanguage(content);

  return {
    title,
    content,
    url,
    language,
  };
};

export const summarizeArticle = async (
  content: string,
  language: "en" | "sv",
  apiKey: string
): Promise<string> => {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const wordCount = content.split(/\s+/).length;
  const lengthGuidance =
    wordCount < 500
      ? "Provide 2-3 bullet points covering the key takeaways."
      : wordCount < 1500
      ? "Provide a 1-2 paragraph summary covering the main points."
      : "Provide a comprehensive summary of 2-3 paragraphs covering all major points.";

  const languageInstruction =
    language === "sv"
      ? "Respond in Swedish."
      : "Respond in English.";

  const prompt = `Summarize the most important points from this article. ${lengthGuidance} ${languageInstruction}

Article:
${content}`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  return response.text();
};

export const validateGeminiApiKey = async (
  apiKey: string
): Promise<{ valid: boolean; error?: string }> => {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Simple test request
    await model.generateContent("Say 'ok'");

    return { valid: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    // Rate limit (429) means the key is valid, just quota exceeded
    if (message.includes("429") || message.includes("quota")) {
      return { valid: true };
    }
    if (message.includes("API_KEY_INVALID") || message.includes("401")) {
      return { valid: false, error: "Invalid API key" };
    }
    return { valid: false, error: message };
  }
};
