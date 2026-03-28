export interface MiniMaxConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface MiniMaxCompletionRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature?: number;
  max_tokens?: number;
}

export interface MiniMaxCompletionResponse {
  id: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class MiniMaxService {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: MiniMaxConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.minimax.io';
  }

  async createCompletion(request: MiniMaxCompletionRequest): Promise<MiniMaxCompletionResponse> {
    const url = `${this.baseUrl}/v1/chat/completions`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('MiniMax API Error:', errorText);
      throw new Error(`MiniMax API error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  async extractW2Data(w2Text: string): Promise<string> {
    const systemPrompt = `You are an expert W2 form parser. Your task is to extract ONLY the identity and address information from the provided text.

**CRITICAL INSTRUCTIONS:**
1.  **RETURN ONLY A SINGLE VALID JSON OBJECT.** Do not include any other text, explanations, apologies, or markdown.
2.  **FOCUS ONLY ON THE FIELDS LISTED BELOW.** Ignore all financial data like wages, taxes, etc.
3.  If you cannot find a value for a field, use null.
4.  Be very precise in extracting names and addresses, even if the text is messy.

**JSON STRUCTURE TO RETURN:**
{
  "employer": {
    "ein": "Employer EIN (XX-XXXXXXX format)",
    "name": "Employer name",
    "address": {
      "street": "Street address",
      "city": "City",
      "state": "State",
      "zipCode": "ZIP code"
    }
  },
  "employee": {
    "ssn": "Employee SSN (XXX-XX-XXXX format)",
    "firstName": "First name",
    "lastName": "Last name",
    "address": {
      "street": "Street address",
      "city": "City",
      "state": "State",
      "zipCode": "ZIP code"
    }
  }
}`;

    const userMessage = `Please extract the W2 form data from the following text:\n\n${w2Text}`;

    const response = await this.createCompletion({
      model: 'MiniMax-M2.7',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.1,
      max_tokens: 4096,
    });

    if (!response.choices || response.choices.length === 0) {
      throw new Error('No completion choices returned from MiniMax API');
    }

    const content = response.choices[0].message.content;

    const jsonMatch = content.match(/\{([\s\S]*)\}/);
    if (jsonMatch && jsonMatch[0]) {
      try {
        JSON.parse(jsonMatch[0]);
        return jsonMatch[0];
      } catch (e) {
        console.error("Model returned something that looked like JSON, but was invalid:", jsonMatch[0]);
      }
    }

    console.error("Failed to extract valid JSON. Model response:", content);
    throw new Error("Could not find a valid JSON object in the model's response.");
  }

  async validateAndCorrectW2(jsonString: string): Promise<string> {
    const systemPrompt = `You are a W2 data validator and corrector. The user will provide a JSON string that may have parsing errors or invalid data. Your task is to:
1. Fix any JSON syntax errors
2. Correct obvious data errors (e.g., SSN format, EIN format, monetary values)
3. Return ONLY the corrected JSON (no markdown, no explanations)`;

    const response = await this.createCompletion({
      model: 'MiniMax-M2.7',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: jsonString },
      ],
      temperature: 0.3,
      max_tokens: 4096,
    });

    if (!response.choices || response.choices.length === 0) {
      throw new Error('No completion choices returned from MiniMax API');
    }

    return response.choices[0].message.content;
  }
}

let minimaxServiceInstance: MiniMaxService | null = null;

export function initializeMiniMaxService(apiKey: string): MiniMaxService {
  minimaxServiceInstance = new MiniMaxService({ apiKey });
  return minimaxServiceInstance;
}

export function getMiniMaxService(): MiniMaxService {
  if (!minimaxServiceInstance) {
    throw new Error('MiniMax service not initialized. Call initializeMiniMaxService first.');
  }
  return minimaxServiceInstance;
}
