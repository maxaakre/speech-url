import { Article } from "../types";

const fetchPageContent = async (url: string): Promise<string> => {
  const response = await fetch(url, {
    headers: {
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

export const extractArticle = async (url: string): Promise<Article> => {
  const html = await fetchPageContent(url);
  const { title, content } = extractTextFromHtml(html);

  if (!content || content.length < 100) {
    throw new Error("Could not extract article content from this URL");
  }

  return {
    title,
    content,
    url,
  };
};
