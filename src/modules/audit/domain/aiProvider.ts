export interface AIResponse {
  answer: string;
  metadata?: Record<string, unknown>;
}

export interface AIProvider {
  generate(
    prompt: string,
    context: unknown
  ): Promise<AIResponse>;
}