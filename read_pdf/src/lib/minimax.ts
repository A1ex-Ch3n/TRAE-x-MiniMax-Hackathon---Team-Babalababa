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
    this.baseUrl = config.baseUrl || 'https://api.minimax.io/v1/chat/completions';
  }

  async createCompletion(request: MiniMaxCompletionRequest): Promise<MiniMaxCompletionResponse> {
    const url = this.baseUrl;

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
    const systemPrompt = `You are an expert W2 form parser. Your task is to extract all specified information from the provided text and return it as a single, valid JSON object.

**CRITICAL INSTRUCTIONS:**
1.  **RETURN ONLY A SINGLE VALID JSON OBJECT.** Do not include any other text, explanations, or markdown.
2.  **YOU MUST EXTRACT FINANCIAL DATA.** Focus on all fields listed in the structure below.
3.  If you cannot find a value for a field, use null. For numerical fields, use null, not 0, if the value is missing.
4.  Be very precise in extracting all information.

**JSON STRUCTURE TO RETURN:**
{
  "employer": {
    "ein": "Employer EIN (e.g., XX-XXXXXXX)",
    "name": "Employer name",
    "address": {
      "street": "Street address",
      "city": "City",
      "state": "State",
      "zipCode": "ZIP code"
    }
  },
  "employee": {
    "ssn": "Employee SSN (e.g., XXX-XX-XXXX)",
    "firstName": "First name",
    "lastName": "Last name",
    "address": {
      "street": "Street address",
      "city": "City",
      "state": "State",
      "zipCode": "ZIP code"
    }
  },
  "wages": {
    "wagesTipsOtherCompensation": "Box 1 - Wages, tips, other compensation (numerical value)",
    "federalTaxWithheld": "Box 2 - Federal income tax withheld (numerical value)",
    "socialSecurityWages": "Box 3 - Social security wages (numerical value)",
    "socialSecurityTaxWithheld": "Box 4 - Social security tax withheld (numerical value)",
    "medicareWagesAndTips": "Box 5 - Medicare wages and tips (numerical value)",
    "medicareTaxWithheld": "Box 6 - Medicare tax withheld (numerical value)"
  }
}`;

    const userMessage = `Please extract the W2 form data from the following text:\n\n${w2Text}`;

    const response = await this.createCompletion({
      model: 'MiniMax-M2.7', // Reverted to the previously working model
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

    // Enhanced JSON extraction to handle potential markdown code blocks
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```|\{([\s\S]*)\}/);
    if (jsonMatch) {
      const jsonString = jsonMatch[1] || jsonMatch[2];
      if (jsonString) {
        try {
          JSON.parse(`{${jsonString}}`); // A quick validation check for object content
          return `{${jsonString}}`;
        } catch (e) {
          try {
            JSON.parse(jsonString); // Check if it is a full object already
            return jsonString;
          } catch (e2) {
            console.error("Model returned something that looked like JSON, but was invalid:", jsonString);
          }
        }
      }
    }

    console.error("Failed to extract valid JSON. Model response:", content);
    throw new Error("Could not find a valid JSON object in the model's response.");
  }

  async validateAndCorrectW2(jsonString: string): Promise<string> {
    const systemPrompt = `You are a W2 data validator and corrector. The user will provide a JSON string that may have parsing errors or invalid data. Your task is to:
1. Fix any JSON syntax errors.
2. Correct obvious data errors (e.g., SSN format, EIN format, monetary values).
3. Ensure all fields from the original request (employee, employer, wages) are present. If a whole section like 'wages' is missing, add it with null values.
4. Return ONLY the corrected JSON (no markdown, no explanations).`;

    const response = await this.createCompletion({
      model: 'MiniMax-M2.7', // Reverted to the previously working model
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
  if (!minimaxServiceInstance) {
    minimaxServiceInstance = new MiniMaxService({ apiKey });
  }
  return minimaxServiceInstance;
}

export function getMiniMaxService(): MiniMaxService {
  if (!minimaxServiceInstance) {
    throw new Error('MiniMax service not initialized. Call initializeMiniMaxService first.');
  }
  return minimaxServiceInstance;
}
