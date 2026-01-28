import { z } from 'zod';
import { defineTool } from '@toolbox/toolkit';
import { marked } from 'marked';

const optionsSchema = z.object({
  gfm: z.boolean().describe('GitHub Flavored Markdown'),
  breaks: z.boolean().describe('Convert line breaks to <br>'),
});

export const markdownPreview = defineTool({
  id: 'format.markdown-preview',
  title: 'Markdown Preview',
  category: 'format',
  description: 'Convert Markdown to HTML preview',
  keywords: ['markdown', 'md', 'preview', 'html', 'convert'],
  
  mode: 'browser',
  
  input: {
    kind: 'text',
    placeholder: 'Paste Markdown here...',
  },
  
  output: {
    kind: 'text',
  },
  
  optionsSchema,
  defaults: {
    gfm: true,
    breaks: false,
  },
  
  async runBrowser(_ctx, input, options) {
    const text = input as string;
    
    if (!text.trim()) {
      throw new Error('Please enter some Markdown');
    }
    
    marked.setOptions({
      gfm: options.gfm,
      breaks: options.breaks,
    });
    
    const html = await marked.parse(text);
    
    return wrapHtml(html);
  },
});

function wrapHtml(content: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      color: #333;
    }
    pre {
      background: #f4f4f4;
      padding: 12px;
      border-radius: 4px;
      overflow-x: auto;
    }
    code {
      background: #f4f4f4;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 0.9em;
    }
    pre code {
      background: none;
      padding: 0;
    }
    blockquote {
      border-left: 4px solid #ddd;
      margin-left: 0;
      padding-left: 16px;
      color: #666;
    }
    table {
      border-collapse: collapse;
      width: 100%;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
    }
    th {
      background: #f4f4f4;
    }
    img {
      max-width: 100%;
    }
    a {
      color: #0066cc;
    }
  </style>
</head>
<body>
${content}
</body>
</html>`;
}
