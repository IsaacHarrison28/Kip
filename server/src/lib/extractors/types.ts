export interface ExtractedMetadata {
  title: string | null;
  description: string | null;
  favicon_url: string | null;
  thumbnail_url: string | null;
  content_text: string | null;
  source_platform: string;
  author?: string | null;
}

export interface Extractor {
  name: string;
  canHandle(url: string): boolean;
  extract(url: string): Promise<ExtractedMetadata>;
}
