export interface LatexRenderRequest {
  latex: string;
  questionId?: string;
  options?: {
    fontSize?: string;
    color?: string;
    mode?: number;
  };
}

export interface LatexRenderResponse {
  success: boolean;
  imageUrl?: string;
  error?: string;
}
