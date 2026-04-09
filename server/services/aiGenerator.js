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
You are a knowledgeable and professional academic tutor. Your task is to extract high-quality, conceptual flashcard pairs (Term and Definition) from the provided document content.

CORE PRINCIPLES:
1. ADAPTIVE QUANTITY: Generate between 20-30 unique pairs if the content is sufficient. If the content is limited or short, generate as many high-quality, distinct pairs as possible. Quality is more important than hitting a count, but aim for depth.
2. TUTOR-LIKE REPHRASING: Do not copy sentences directly from the document. Rephrase, summarize, and synthesize definitions in your own academic yet accessible language.
3. CONCEPTUAL FOCUS: Extract meaningful terms that represent key concepts, definitions, or facts. Avoid trivial fragments or non-conceptual words.
4. NO REPETITION: Ensure every pair is unique and covers a distinct piece of information.
5. CLEAN CONTENT: Absolutely NO markdown symbols (•, ●, ○, *, #, -), chapter titles, section headers, page numbers, or raw document metadata should appear in the Term or Definition text.

OUTPUT FORMAT (STRICT JSON):
[
  {
    "term": "Rephrased Concept Name",
    "definition": "Synthesized and clear academic definition in your own words."
  }
]

GOAL: Provide a clean, robust, and conceptually rich set of study materials.
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
    model: 'gemini-2.5-flash-lite',
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
      model: 'gemini-2.5-flash-lite',
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

  const prompt = `Act as an expert tutor. Based on the following study content, generate a comprehensive quiz.

GUIDELINES:
1. QUANTITY: Generate exactly 20-30 unique multiple-choice questions if the material supports it. If the content is limited, provide the maximum number of high-quality questions possible without being repetitive.
2. QUESTION STYLE: Frame questions to test conceptual understanding, not just rote memorization. Do not copy sentences word-for-word; rephrase and reframe the content.
3. OPTIONS: Provide exactly 4 options per question. The correct answer must be accurate and unambiguous. The 3 distractors should be plausible, related to the topic, but clearly incorrect. 
4. DO NOT USE: Chapter titles, section headers, page numbers, or raw PDF formatting as answer choices or part of questions.
5. NO MARKDOWN: Strip all markdown bullets (•, ●, *, -), bolding (**), or headers (#) from the returned strings. Provide clean plain text.
6. NO CUT-OFFS: Ensure all questions and answers are complete sentences.

Content: ${content}`;

  const response = await client.models.generateContent({
    model: 'gemini-2.5-flash-lite',
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: quizSchema,
      systemInstruction: "You are an expert tutor and researcher. Your goal is to transform raw notes into clear, pedagogical quiz questions. REPHRASE EVERYTHING. Never use chapter titles or slide placeholders as answers. Ensure each distractor reflects a meaningful misconception.",
      temperature: 0.7,
      maxOutputTokens: 8192
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
      .replace(/[•●○◦▪️▫️]/g, '')
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
    model: 'gemini-2.5-flash-lite',
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
      model: 'gemini-2.5-flash-lite',
      contents: [{
        role: "user",
        parts: [
          { inlineData: { data: fileContent, mimeType } },
          { text: "Provide a clean, comprehensive text-only extraction of the document. Absolutely strip out raw bullet points (•, ●, ○), page numbers, headers, and footers. Present the content in well-formed sentences and logical paragraphs while preserving all technical terms and conceptual definitions." }
        ]
      }],
      config: {
        systemInstruction: "You are a highly accurate document text extraction system. Your output must be clean, plain text with no PDF artifacts or raw bullet symbols.",
        temperature: 0.7
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
  const prompt = `Act as an expert tutor. Synthesize the following content into a comprehensive and well-organized study guide exactly matching this template:

# [Topic Name] Study Guide

## Overview
A 2-3 sentence summary written in your own words explaining what this material covers and why it matters.

## Key Concepts
For each major concept:
**Concept Name** — a clear, synthesized explanation in plain language (do not copy raw text).

## Detailed Notes
Synthesize the content into logical sections with your own headers. Under each section:
- Explain the main ideas and supporting details in a structured way.
- Provide examples or analogies to clarify difficult points.

## Quick Reference
A bullet list of the most essential facts, dates, numbers, or terms to memorize.

## Connections & Relationships
Synthesize how the key concepts relate to each other. Use simple bridging language like "X leads to Y" or "A explains the foundation for B."

## Likely Exam Questions
5-8 predictive questions a professor might ask, followed by clear, thorough answers.

## Memory Tips
For difficult concepts, provide a mnemonic, analogy, or simple trick to remember it.

## Summary Checklist
A checklist of everything the student should have mastered before an exam.

CRITICAL RULES:
- REPHRASE EVERYTHING. Do not dump raw PDF snippets.
- CLEAN TEXT: Strip out all raw bullets (•, ●), page numbers, and leftover PDF headers.
- NO EMOJIS.
- Use a formal, clear, and academic tone.

Content: ${content}`;

  const response = await client.models.generateContent({
    model: 'gemini-2.5-flash-lite',
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      systemInstruction: "You are an expert academic synthesizer. Your goal is to transform raw notes into a beautifully structured, rephrased, and pedagogical study guide.",
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
