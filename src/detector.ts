import * as vscode from 'vscode';

export type Framework =
  | 'selenium-java'
  | 'selenium-python'
  | 'playwright-typescript'
  | 'playwright-python'
  | 'unknown';

/**
 * Detects which QA framework the current file belongs to
 * by checking file extension and import statements.
 */
export function detectFramework(document?: vscode.TextDocument): Framework {
  if (!document) {
    return 'unknown';
  }

  const text    = document.getText().toLowerCase();
  const langId  = document.languageId;
  const fileName = document.fileName.toLowerCase();

  // Playwright TypeScript / JavaScript
  if (
    langId === 'typescript' || langId === 'javascript' ||
    fileName.endsWith('.spec.ts') || fileName.endsWith('.test.ts') ||
    fileName.endsWith('.spec.js') || fileName.endsWith('.test.js')
  ) {
    if (
      text.includes('@playwright/test') ||
      text.includes('from "playwright"') ||
      text.includes("from 'playwright'") ||
      text.includes('playwright') ||
      text.includes('page.goto') ||
      text.includes('page.click') ||
      text.includes('expect(page)')
    ) {
      return 'playwright-typescript';
    }
  }

  // Playwright Python
  if (langId === 'python') {
    if (
      text.includes('from playwright') ||
      text.includes('import playwright') ||
      text.includes('sync_playwright') ||
      text.includes('async_playwright') ||
      text.includes('page.goto') ||
      text.includes('page.click')
    ) {
      return 'playwright-python';
    }
  }

  // Selenium Python
  if (langId === 'python') {
    if (
      text.includes('from selenium') ||
      text.includes('import selenium') ||
      text.includes('webdriver.') ||
      text.includes('driver.find_element') ||
      text.includes('webdriverwait')
    ) {
      return 'selenium-python';
    }
    // Generic Python test file — assume Selenium Python
    if (
      text.includes('pytest') ||
      text.includes('unittest') ||
      text.includes('driver')
    ) {
      return 'selenium-python';
    }
  }

  // Selenium Java
  if (langId === 'java') {
    return 'selenium-java';
  }
  // Content-based detection for Java (for files without .java extension)
  if (
    text.includes('org.openqa.selenium') ||
    text.includes('com.') ||
    text.includes('.java:') ||
    /\bWebDriver\b/.test(text) ||
    /\bChromeDriver\b/.test(text) ||
    /\bFirefoxDriver\b/.test(text)
  ) {
    return 'selenium-java';
  }

  return 'unknown';
}

/**
 * Returns a human-readable label for the detected framework.
 */
export function frameworkLabel(framework: Framework): string {
  const labels: Record<Framework, string> = {
    'selenium-java'        : 'Selenium (Java)',
    'selenium-python'      : 'Selenium (Python)',
    'playwright-typescript': 'Playwright (TypeScript)',
    'playwright-python'    : 'Playwright (Python)',
    'unknown'              : 'Unknown framework',
  };
  return labels[framework];
}

/**
 * Returns true if the framework is Selenium — used to decide
 * whether to show the "Playwright equivalent" section.
 */
export function isSelenium(framework: Framework): boolean {
  return framework === 'selenium-java' || framework === 'selenium-python';
}
