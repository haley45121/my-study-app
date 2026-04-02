const fs = require('fs');
const { GoogleGenAI, Type } = require('@google/genai');

let ai;

function getAIClient() {
  if (!ai) {
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_key_here') {
      throw new Error('GEMINI_API_KEY is not configured in the server .env file.');
    }
    // Aligning exactly with provided documentation (v1beta)
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return ai;
}

const SYSTEM_PROMPT = `
You are a structured information extraction system designed to generate high-quality, ultra-concise flashcards from uploaded documents.

Your task is to extract ONLY valid term–definition pairs. Avoid ANY extra wording, conversational filler, or unnecessary context.
You MUST generate at least 20 term-definition pairs if there is sufficient content.

STRICT RULES:
1. A "term" must be a meaningful concept (noun or short phrase). 
   - NO introductory phrases (e.g., "The concept of...")
   - NO trailing punctuation.

2. A "definition" must:
   - Be a clean, precise explanation.
   - NO extra sentences, examples, or "This means that..." filler.
   - Keep it under 20 words if possible.

3. HANDLE SLIDES/PDFs:
   - Combine fragmented bullets into one concise definition.
   - Ignore headers, footers, and page numbers.

4. OUTPUT FORMAT (STRICT):
[
  {
    "term": "Term",
    "definition": "Definition"
  }
]

GOAL:
Produce a clean, high-confidence set of flashcards. Generate at least 20 items. Quality, precision, and conciseness are paramount. Remove all fluff.
`;

const configJSON = {
  responseMimeType: "application/json",
  responseSchema: {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        term: { type: Type.STRING },
        definition: { type: Type.STRING }
      },
      required: ["term", "definition"]
    }
  }
};

async function generateFlashcardsFromText(text) {
  const client = getAIClient();
  const response = await client.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{ role: "user", parts: [{ text: "Please process the following text:\n" + text }] }],
    config: {
      ...configJSON,
      systemInstruction: SYSTEM_PROMPT,
      temperature: 1.0
    }
  });

  const parsed = JSON.parse(response.text);
  return parsed.map(card => ({
    term: card.term,
    definition: card.definition,
    aliases: []
  }));
}

async function uploadDocumentForFlashcards(filePath, mimeType = 'application/pdf') {
  const client = getAIClient();
  const fileContent = fs.readFileSync(filePath).toString('base64');
  
  try {
    const response = await client.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{
        role: "user",
        parts: [
          { inlineData: { data: fileContent, mimeType } },
          { text: "Please process the uploaded document and extract ALL structural flashcard terms." }
        ]
      }],
      config: {
        ...configJSON,
        systemInstruction: SYSTEM_PROMPT,
        temperature: 1.0
      }
    });

    const parsed = JSON.parse(response.text);
    return parsed.map(card => ({
      term: card.term,
      definition: card.definition,
      aliases: []
    }));
  } catch (err) {
    console.error('Gemini v1beta flashcard generation error:', err);
    throw err;
  }
}

async function generateQuizFromContent(content) {
  const client = getAIClient();
  const quizSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        question: { type: Type.STRING },
        options: { type: Type.ARRAY, items: { type: Type.STRING } },
        correctAnswer: { type: Type.STRING },
        explanation: { type: Type.STRING }
      },
      required: ["question", "options", "correctAnswer"]
    }
  };

  const prompt = `Based on the following study content, generate at least 20 multiple choice questions.
  Each question must focus strictly on a specific term, concept, or fact explicitly found in the content.
  Each question must have exactly 4 plausible, meaningful options, where only one is correct. 
  DO NOT use section headers or bullet points as answer choices; write fully formed, real conceptual answers.
  IMPORTANT: Strip all markdown symbols (like •, **, #, -, *) from both the question and all option text before returning. Give clean, plain text only.
  
  Content: ${content}`;

  const response = await client.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: quizSchema,
      systemInstruction: "You are a quiz generator. Focus strictly on terminology and facts. Avoid conversational filler.",
      temperature: 1.0
    }
  });

  let parsed;
  try {
    parsed = JSON.parse(response.text);
  } catch (parseErr) {
    console.error('Quiz JSON parsing failed, string cleaning required', parseErr);
    const cleanJson = response.text.replace(/^```(json)?\n?/i, '').replace(/```$/i, '').trim();
    parsed = JSON.parse(cleanJson);
  }

  // Sanitize out all markdown bullets, hyphens, boldness, and hash symbols
  const sanitize = (str) => {
    if (!str) return '';
    return String(str)
      .replace(/\*\*/g, '')
      .replace(/[•●]/g, '')
      .replace(/^[*\-#]\s*/, '')
      .trim();
  };

  return parsed.map(q => ({
    ...q,
    question: sanitize(q.question),
    options: Array.isArray(q.options) ? q.options.map(o => sanitize(o)) : [],
    correctAnswer: sanitize(q.correctAnswer)
  }));
}

async function semanticGradeAnswer(userAnswer, correctAnswer) {
  const client = getAIClient();
  const gradeSchema = {
    type: "object",
    properties: {
      isCorrect: { type: "boolean" },
      score: { type: "number", description: "Similarity score from 0 to 1" },
      feedback: { type: "string" },
      isPartial: { type: "boolean" }
    },
    required: ["isCorrect", "score", "feedback"]
  };

  const prompt = `Student Answer: "${userAnswer}"\nCorrect Answer: "${correctAnswer}"`;

  const response = await client.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: gradeSchema,
      systemInstruction: "You are an automated terminology grader. Compare the student's answer with the correct answer accurately but fairly (accept typos/minor paraphrasing).",
      temperature: 1.0
    }
  });

  return JSON.parse(response.text);
}

async function extractTextFromDocument(filePath, mimeType = 'application/pdf') {
  const client = getAIClient();
  const fileContent = fs.readFileSync(filePath).toString('base64');
  
  try {
    const response = await client.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{
        role: "user",
        parts: [
          { inlineData: { data: fileContent, mimeType } },
          { text: "Please provide a concise but comprehensive text-only extraction of all the key information in this document, preserving technical terms and definitions exactly as they appear." }
        ]
      }],
      config: {
        systemInstruction: "You are a highly accurate document text extraction system. Provide a clean, comprehensive text-only extraction.",
        temperature: 1.0
      }
    });
    
    return response.text;
  } catch (err) {
    console.error('Gemini v1beta extraction error:', err);
    throw err;
  }
}

async function generateStudyGuide(content) {
  const client = getAIClient();
  const prompt = `Generate a study guide from the following content exactly matching this template format:

# [Topic Name] Study Guide

## Overview
A 2-3 sentence summary of what this material covers and why it matters.

## Key Concepts
For each major concept:
**Concept Name** — clear, concise definition in plain language

## Detailed Notes
Break the content into logical sections with headers. Under each section include:
- The main idea
- Supporting details
- Examples if applicable

## Quick Reference
A bullet list of the most important facts, dates, numbers, or terms to memorize

## Connections & Relationships
Explain how the key concepts relate to each other using simple language like "X leads to Y" or "A is different from B because..."

## Likely Exam Questions
List 5-8 questions the professor might ask, with brief answers underneath each one

## Memory Tips
For difficult concepts, provide a mnemonic, analogy, or simple trick to remember it

## Summary Checklist
A checklist of everything the student should understand before an exam

Content: ${content}`;

  const response = await client.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      systemInstruction: "You are an expert tutor creating formal, structured study guides. You MUST use the exact markdown template provided, including the exact headers. DO NOT use emojis.",
      temperature: 0.7
    }
  });

  return response.text;
}

module.exports = {
  generateFlashcardsFromText,
  uploadDocumentForFlashcards,
  extractTextFromDocument,
  generateQuizFromContent,
  semanticGradeAnswer,
  generateStudyGuide
};
