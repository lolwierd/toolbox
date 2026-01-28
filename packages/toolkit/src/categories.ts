export const TOOL_CATEGORIES = {
  pdf: { label: 'PDF', icon: 'file-text', description: 'Merge, split, compress, and manipulate PDFs' },
  convert: { label: 'Convert', icon: 'repeat', description: 'Document and file format conversions' },
  diff: { label: 'Diff', icon: 'git-compare', description: 'Compare text, JSON, YAML, CSV files' },
  format: { label: 'Format', icon: 'code', description: 'Prettify and minify code' },
  validate: { label: 'Validate', icon: 'check-circle', description: 'Validate JSON, YAML, XML schemas' },
  crypto: { label: 'Encode/Hash', icon: 'lock', description: 'Base64, URL encoding, hashing, JWT' },
  time: { label: 'Time', icon: 'clock', description: 'Timestamps, cron expressions' },
  image: { label: 'Image', icon: 'image', description: 'Convert, compress, resize images' },
  archive: { label: 'Archive', icon: 'archive', description: 'Zip, unzip, merge files' },
  dev: { label: 'Dev', icon: 'terminal', description: 'Curl builder, headers, colors' },
  text: { label: 'Text', icon: 'type', description: 'Text manipulation and cleanup' },
} as const;

export type ToolCategory = keyof typeof TOOL_CATEGORIES;
