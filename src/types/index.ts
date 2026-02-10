export type InputItemType = "text" | "url" | "image";

export interface InputItemEdit {
  id: string;
  old_content: string;
  edited_at: string;
}

export interface InputItem {
  id: string;
  type: InputItemType;
  content: string;
  extracted_text: string | null;
  extract_error: string | null;
  date: string;
  cleared: boolean;
  created_at: string;
  updated_at: string;
  edits?: InputItemEdit[];
}

export interface InputItemCreateRequest {
  type: InputItemType;
  content: string;
  date?: string;
}

export interface InputItemUpdateRequest {
  content: string;
}

export interface GenerateRequest {
  date?: string;
  channels?: string[] | null;
  style_override?: string | null;
  language_override?: string | null;
}

export interface RegenerateRequest {
  channels?: string[] | null;
}

export interface GenerationResult {
  id: string;
  channel_id: string;
  style: string;
  language: string;
  text: string;
  model: string;
}

export interface Generation {
  id: string;
  date: string;
  results: GenerationResult[];
  created_at: string;
}

export interface DayResponse {
  date: string;
  input_items: InputItem[];
  generations: Generation[];
}

export interface DaySummary {
  date: string;
  input_count: number;
  generation_count: number;
}

export interface DayListResponse {
  items: DaySummary[];
  cursor: string | null;
}

export interface ChannelConfig {
  name: string;
  description: string;
  max_length: number;
}

export interface ChannelSetting {
  channel_id: string;
  is_active: boolean;
  default_style: string;
  default_language: string;
  default_length: string;
}

export interface LanguageConfig {
  name: string;
  default?: boolean;
}

export interface ErrorResponse {
  error: string;
  code: string;
  detail: string | null;
}

export interface PublishedPostResponse {
  id: string;
  slug: string;
  channel_id: string;
  style: string;
  language: string;
  text: string;
  date: string;
  published_at: string;
  input_items_preview: string[];
}

export interface PublishStatusResponse {
  statuses: Record<string, string | null>;
}
