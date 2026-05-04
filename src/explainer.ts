import axios from 'axios';
import * as vscode from 'vscode';
import { Framework, isSelenium } from './detector';

export interface Fix {
  title      : string;
  description: string;
  code       : string;
  language   : string;   // 'java' | 'python' | 'typescript'
}

export interface PlaywrightEquivalent {
  summary  : string;   // one-line "how Playwright handles this differently"
  avoidance: string;   // why Playwright avoids or handles this better
  code     : string;   // Playwright code doing the same thing
  language : string;   // 'typescript' | 'python'
}

export interface Explanation {
  errorName          : string;
  whatHappened       : string;
  whyItHappens       : string;
  fixes              : Fix[];
  playwrightEquivalent?: PlaywrightEquivalent;  // only when Selenium detected
  framework          : Framework;
}

// ─── Build the prompt ───────────────────────────────────────────
function buildPrompt(errorText: string, framework: Framework): string {
  const showPlaywright = isSelenium(framework);
  const fixLanguage    = framework === 'selenium-java'
    ? 'Java (Selenium WebDriver)'
    : framework === 'selenium-python'
    ? 'Python (Selenium WebDriver)'
    : framework === 'playwright-typescript'
    ? 'TypeScript (Playwright)'
    : 'Python (Playwright)';

  const pwSection = showPlaywright
    ? `
"playwrightEquivalent": {
  "summary"  : "one sentence — how Playwright handles this scenario differently",
  "avoidance": "one paragraph — why this specific error is less common in Playwright, or how Playwright's auto-waiting / locator system avoids it",
  "code"     : "TypeScript Playwright code solving the same problem (2-10 lines)",
  "language" : "typescript"
}`
    : '';

  return `You are a senior QA automation engineer with deep expertise in Selenium and Playwright.

A QA engineer hit this error:
\`\`\`
${errorText}
\`\`\`

Framework context: ${fixLanguage}

Respond ONLY with a valid JSON object. No markdown, no explanation outside the JSON.

{
  "errorName"   : "short error class name e.g. NoSuchElementException",
  "whatHappened": "2-3 sentences in plain English explaining exactly what went wrong, as if explaining to a junior QA engineer",
  "whyItHappens": "2-3 sentences on the most common root causes — be specific to ${fixLanguage}",
  "fixes": [
    {
      "title"      : "Fix 1 title (e.g. Add explicit wait)",
      "description": "1-2 sentences why this fix works",
      "code"       : "${fixLanguage} code example, 3-10 lines, ready to copy",
      "language"   : "${framework === 'selenium-java' ? 'java' : framework === 'selenium-python' ? 'python' : framework === 'playwright-typescript' ? 'typescript' : 'python'}"
    },
    {
      "title"      : "Fix 2 title",
      "description": "1-2 sentences",
      "code"       : "code",
      "language"   : "${framework === 'selenium-java' ? 'java' : 'python'}"
    },
    {
      "title"      : "Fix 3 title",
      "description": "1-2 sentences",
      "code"       : "code",
      "language"   : "${framework === 'selenium-java' ? 'java' : 'python'}"
    }
  ]${showPlaywright ? `,\n  ${pwSection}` : ''}
}`;
}

// ─── Call MiniMax API ───────────────────────────────────────────
export async function explainError(
  errorText: string,
  framework: Framework
): Promise<Explanation> {

  const config  = vscode.workspace.getConfiguration('qaExplainer');
  const apiKey  = config.get<string>('minimaxApiKey', '');
  const apiHost = config.get<string>('minimaxHost', 'https://api.minimaxi.chat');

  if (!apiKey) {
    throw new Error(
      'MiniMax API key not set. Go to Settings → search "qaExplainer" → paste your key.'
    );
  }

  const prompt = buildPrompt(errorText, framework);

  const response = await axios.post(
    `${apiHost}/v1/text/chatcompletion_v2`,
    {
      model: 'MiniMax-M2.7',
      messages: [
        {
          role   : 'system',
          content: 'You are a senior QA automation engineer. You must respond with ONLY a valid JSON object. Do not include any explanations, markdown, or additional text. Do not use <think> tags or any other formatting.'
        },
        {
          role   : 'user',
          content: prompt
        }
      ],
      temperature : 0.2,   // low temp = consistent, precise answers
      max_tokens  : 1800,
      reasoning   : false, // Disable thinking/reasoning tokens
    },
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type' : 'application/json',
      },
      timeout: 30000,
    }
  );

  // Extract the text content from MiniMax response
  const content: string =
    response.data?.choices?.[0]?.message?.content ?? '';

  // Strip any accidental markdown fences, thinking tags, or other formatting
  const cleaned = content
    .replace(/```json\n?/gi, '')
    .replace(/```\n?/gi, '')
    .replace(/<think>[\s\S]*?<\/think>/gi, '') // Remove thinking tags
    .replace(/^\s*<think>[\s\S]*$/gm, '') // Remove lines that are just thinking
    .trim();

  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`Could not parse AI response. Raw: ${cleaned.slice(0, 200)}`);
  }

  return {
    errorName          : parsed.errorName        ?? 'Error',
    whatHappened       : parsed.whatHappened      ?? '',
    whyItHappens       : parsed.whyItHappens      ?? '',
    fixes              : parsed.fixes             ?? [],
    playwrightEquivalent: parsed.playwrightEquivalent ?? undefined,
    framework,
  };
}
