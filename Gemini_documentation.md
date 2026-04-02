# Gemini API Documentation

The Gemini API generates text output from text, images, video, and audio inputs.

## Core Features & Usage (Gemini 3 Flash Preview)

### Basic Text Generation

**Python**

from google import genai

client \= genai.Client()

response \= client.models.generate\_content(model="gemini-3-flash-preview", contents="How does AI work?")

print(response.text)

**JavaScript**

import { GoogleGenAI } from "@google/genai";

const ai \= new GoogleGenAI({});

async function main() {

  const response \= await ai.models.generateContent({ model: "gemini-3-flash-preview", contents: "How does AI work?" });

  console.log(response.text);

}

await main();

**Go**

package main

import ("context"; "fmt"; "log"; "google.golang.org/genai")

func main() {

  ctx := context.Background()

  client, err := genai.NewClient(ctx, nil)

  if err \!= nil { log.Fatal(err) }

  result, \_ := client.Models.GenerateContent(ctx, "gemini-3-flash-preview", genai.Text("Explain how AI works in a few words"), nil)

  fmt.Println(result.Text())

}

**Java**

import com.google.genai.Client;

import com.google.genai.types.GenerateContentResponse;

public class GenerateContentWithTextInput {

  public static void main(String\[\] args) {

    Client client \= new Client();

    GenerateContentResponse response \= client.models.generateContent("gemini-3-flash-preview", "How does AI work?", null);

    System.out.println(response.text());

  }

}

**REST**

curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent" \\

  \-H "x-goog-api-key: $GEMINI\_API\_KEY" \-H 'Content-Type: application/json' \-X POST \\

  \-d '{"contents": \[{"parts": \[{"text": "How does AI work?"}\]}\]}'

**Apps Script**

const apiKey \= PropertiesService.getScriptProperties().getProperty('GEMINI\_API\_KEY');

function main() {

  const payload \= { contents:\[{ parts: \[{ text: 'How AI does work?' }\] }\] };

  const url \= 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent';

  const options \= { method: 'POST', contentType: 'application/json', headers: { 'x-goog-api-key': apiKey }, payload: JSON.stringify(payload) };

  const response \= UrlFetchApp.fetch(url, options);

  const data \= JSON.parse(response);

  console.log(data\['candidates'\]\[0\]\['content'\]\['parts'\]\[0\]\['text'\]);

}

### Thinking with Gemini

Models often have "thinking" enabled by default to reason before responding. Control cost/latency via configuration. **Python**: `config=types.GenerateContentConfig(thinking_config=types.ThinkingConfig(thinking_level="low"))` **JavaScript**: `config: { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }` **Go**: `&genai.GenerateContentConfig{ ThinkingConfig: &genai.ThinkingConfig{ ThinkingLevel: &thinkingLevelVal } }` (where `thinkingLevelVal := "low"`) **Java**: `GenerateContentConfig.builder().thinkingConfig(ThinkingConfig.builder().thinkingLevel(new ThinkingLevel("low"))).build();` **REST**: `"generationConfig": { "thinkingConfig": { "thinkingLevel": "low" } }`

### System Instructions & Configurations

Guide behavior via `GenerateContentConfig`. **Warning**: For Gemini 3 models, strictly keep `temperature` at the default `1.0`. Lowering it causes unexpected behavior (looping, degraded math/reasoning). **Python**: `config=types.GenerateContentConfig(system_instruction="You are a cat. Your name is Neko.")` **JavaScript**: `config: { systemInstruction: "You are a cat. Your name is Neko." }` **Go**: `config := &genai.GenerateContentConfig{ SystemInstruction: genai.NewContentFromText("You are a cat.", genai.RoleUser) }` **Java**: `GenerateContentConfig.builder().systemInstruction(Content.fromParts(Part.fromText("You are a cat."))).build();` **REST**: `"system_instruction": { "parts": [ { "text": "You are a cat." } ] }`

### Multimodal Inputs (Images, Audio, Video, Documents)

Combine text and media in the `contents` array. **Python**: `contents=[PIL.Image.open("/path/to/organ.png"), "Tell me about this instrument"]` **JavaScript**: Upload first via `ai.files.upload()`, then pass `createPartFromUri(image.uri, image.mimeType)`. **Go**: Use `&genai.Part{ InlineData: &genai.Blob{ MIMEType: "image/jpeg", Data: imgData } }` **Java**: `Content.fromParts(Part.fromText("..."), Part.fromUri("/path/to/organ.jpg", "image/jpeg"));` **REST**: Pass `"inline_data": { "mime_type": "image/jpeg", "data": "<BASE64>" }` inside `parts`.

### Streaming Responses

Use `generateContentStream` to receive incremental `GenerateContentResponse` instances. **Python**: `for chunk in client.models.generate_content_stream(...): print(chunk.text, end="")` **JavaScript**: `for await (const chunk of await ai.models.generateContentStream(...)) { console.log(chunk.text); }` **Go**: `for chunk, _ := range client.Models.GenerateContentStream(...) { fmt.Print(chunk.Candidates[0].Content.Parts[0].Text) }` **Java**: `for (GenerateContentResponse res : client.models.generateContentStream(...)) { System.out.print(res.text()); }` (Recommend closing stream after consumption). **REST**: Change endpoint to `streamGenerateContent?alt=sse`.

### Multi-turn Conversations (Chat)

SDKs track conversation history automatically; internally uses standard `generateContent` by sending full history. **Python**: `chat = client.chats.create(model="..."); chat.send_message("..."); chat.get_history()` **JavaScript**: `chat = ai.chats.create({ model: "...", history: [...] }); chat.sendMessage({ message: "..." });` **Go**: `chat, _ := client.Chats.Create(ctx, "...", nil, history); chat.SendMessage(ctx, genai.Part{Text: "..."})` **Java**: `Chat chatSession = client.chats.create("..."); chatSession.sendMessage("..."); chatSession.getHistory(true)` **REST**: Pass array of alternating `role: "user"` and `role: "model"` parts in `contents`. *Streaming Chat*: Use `send_message_stream`, `sendMessageStream`, or `SendMessageStream` depending on the language SDK.

---

## API Reference

### Method: `models.generateContent` & `models.streamGenerateContent`

**Endpoints**:

* `POST https://generativelanguage.googleapis.com/v1beta/{model=models/*}:generateContent`  
* `POST https://generativelanguage.googleapis.com/v1beta/{model=models/*}:streamGenerateContent`

**Path Parameters**:

* `model` (string, required): Format `models/{model}`.

**Request Body**:

* `contents[]` (*Content*, required): Conversation history/latest request.  
* `tools[]` (*Tool*, optional): Code enabling external interaction (`Function`, `codeExecution`).  
* `toolConfig` (*ToolConfig*, optional): Configuration for Tools.  
* `safetySettings[]` (*SafetySetting*, optional): Overrides default safety thresholds. Harm categories supported: `HATE_SPEECH`, `SEXUALLY_EXPLICIT`, `DANGEROUS_CONTENT`, `HARASSMENT`, `CIVIC_INTEGRITY`. Maximum one setting per `SafetyCategory`.  
* `systemInstruction` (*Content*, optional): Developer system instructions (text only).  
* `generationConfig` (*GenerationConfig*, optional): Output configurations.  
* `cachedContent` (string, optional): Context cache name. Format: `cachedContents/{cachedContent}`.

### Example Workflows (Gemini 2.0 Flash / Pro)

* **Audio Upload & Generation**:  
  * **Python/Node/Go**: Upload via `client.files.upload()`, then pass file object/URI in `contents`.  
  * **REST**: Resumable upload to `/upload/v1beta/files`, get `file_uri`, pass as `{"file_data": {"mime_type": "audio/mpeg", "file_uri": "..."}}`.  
* **Video Upload**: Videos require polling until processed (`file.state == "ACTIVE"`).  
* **Caching**:  
  * **Python**: `cache = client.caches.create(model=..., config=types.CreateCachedContentConfig(contents=[doc], system_instruction="..."))` \-\> `config=types.GenerateContentConfig(cached_content=cache.name)`.  
* **JSON Mode (Structured Output)**:  
  * **Python**: `config=types.GenerateContentConfig(response_mime_type="application/json", response_schema=list[Recipe])`  
  * **REST**: `"generationConfig": { "response_mime_type": "application/json", "response_schema": { "type": "ARRAY", "items": { "type": "OBJECT", "properties": {...} } } }`  
* **Code Execution**: Available in `gemini-2.0-pro-exp-02-05`. Ensure prompt restricts output to code and execution results.  
* **Function Calling**: Define function schemas \-\> Wrap in `tools` \-\> Pass to `GenerateContentConfig(tools=[...])`. Model returns `FunctionCall` \-\> Run locally \-\> Return result via `GenerateContent`.  
* **Safety Settings Override**:  
  * **Python**: `config=types.GenerateContentConfig(safety_settings=[types.SafetySetting(category="HARM_CATEGORY_HATE_SPEECH", threshold="BLOCK_MEDIUM_AND_ABOVE")])`

---

## API Schema Dictionary

**GenerateContentResponse**

* `candidates[]` (*Candidate*): Model responses.  
* `promptFeedback` (*PromptFeedback*): Feedback on content filters.  
* `usageMetadata` (*UsageMetadata*): Token usage stats.  
* `modelVersion` (string): Model version used.  
* `responseId` (string): Unique response identifier.  
* `modelStatus` (*ModelStatus*): Underlying model status.

**PromptFeedback**

* `blockReason` (*BlockReason*): \[Optional\] Reason prompt was blocked.  
* `safetyRatings[]` (*SafetyRating*): Safety ratings of the prompt (max 1 per category).

**BlockReason (Enum)**

* `BLOCK_REASON_UNSPECIFIED`, `SAFETY`, `OTHER`, `BLOCKLIST`, `PROHIBITED_CONTENT`, `IMAGE_SAFETY`.

**UsageMetadata**

* `promptTokenCount` (integer): Total prompt size (including cached content).  
* `cachedContentTokenCount` (integer): Tokens in cached content.  
* `candidatesTokenCount` (integer): Tokens across all generated candidates.  
* `toolUsePromptTokenCount` (integer): Tokens in tool-use prompt(s).  
* `thoughtsTokenCount` (integer): Tokens of thoughts for thinking models.  
* `totalTokenCount` (integer): Prompt \+ response candidates.  
* `promptTokensDetails[]`, `cacheTokensDetails[]`, `candidatesTokensDetails[]`, `toolUsePromptTokensDetails[]` (*ModalityTokenCount*): Modalities processed/returned.

**ModelStatus**

* `modelStage` (*ModelStage*)  
* `retirementTime` (string, RFC 3339 Timestamp): When model retires.  
* `message` (string): Explanation of status.

**ModelStage (Enum)**

* `MODEL_STAGE_UNSPECIFIED`, `UNSTABLE_EXPERIMENTAL`, `EXPERIMENTAL`, `PREVIEW`, `STABLE`, `LEGACY`, `DEPRECATED`, `RETIRED`.

**Candidate**

* `content` (*Content*): Generated content.  
* `finishReason` (*FinishReason*): Reason generation stopped (empty if generating).  
* `safetyRatings[]` (*SafetyRating*): List of candidate safety ratings.  
* `citationMetadata` (*CitationMetadata*): Recitation info for foundational LLM training data.  
* `tokenCount` (integer)  
* `groundingAttributions[]` (*GroundingAttribution*): Attribution for sources (`GenerateAnswer`).  
* `groundingMetadata` (*GroundingMetadata*): Grounding metadata (`GenerateContent`).  
* `avgLogprobs` (number): Average log probability score.  
* `logprobsResult` (*LogprobsResult*): Log-likelihood scores.  
* `urlContextMetadata` (*UrlContextMetadata*): Context retrieval tool metadata.  
* `index` (integer): Candidate index.  
* `finishMessage` (string): Details reason generation stopped.

**FinishReason (Enum)**

* `FINISH_REASON_UNSPECIFIED`, `STOP`, `MAX_TOKENS`, `SAFETY`, `RECITATION`, `LANGUAGE`, `OTHER`, `BLOCKLIST`, `PROHIBITED_CONTENT`, `SPII`, `MALFORMED_FUNCTION_CALL`, `IMAGE_SAFETY`, `IMAGE_PROHIBITED_CONTENT`, `IMAGE_OTHER`, `NO_IMAGE`, `IMAGE_RECITATION`, `UNEXPECTED_TOOL_CALL`, `TOO_MANY_TOOL_CALLS`, `MISSING_THOUGHT_SIGNATURE`.

**GroundingAttribution / AttributionSourceId / GroundingPassageId / SemanticRetrieverChunk**

* `GroundingAttribution`: `sourceId` (*AttributionSourceId*), `content` (*Content*).  
* `AttributionSourceId`: Union of `groundingPassage` (*GroundingPassageId*) OR `semanticRetrieverChunk` (*SemanticRetrieverChunk*).  
* `GroundingPassageId`: `passageId` (string), `partIndex` (integer).  
* `SemanticRetrieverChunk`: `source` (string), `chunk` (string).

**GroundingMetadata**

* `groundingChunks[]` (*GroundingChunk*): Retrieved supporting references.  
* `groundingSupports[]` (*GroundingSupport*): Grounding support list.  
* `webSearchQueries[]` (string): Queries for follow-up search.  
* `searchEntryPoint` (*SearchEntryPoint*): Google search entry.  
* `retrievalMetadata` (*RetrievalMetadata*): Retrieval flow metadata.  
* `googleMapsWidgetContextToken` (string): Token for PlacesContextElement widget.

**SearchEntryPoint**

* `renderedContent` (string): Embeddable web content snippet.  
* `sdkBlob` (bytes): Base64 JSON of `<search term, search url>` tuples.

**GroundingChunk** Union of:

* `web` (*Web*): `uri` (string), `title` (string).  
* `retrievedContext` (*RetrievedContext*): `uri` (string), `title` (string), `text` (string), `fileSearchStore` (string).  
* `maps` (*Maps*): `uri` (string), `title` (string), `text` (string), `placeId` (string), `placeAnswerSources` (*PlaceAnswerSources*).

**PlaceAnswerSources & ReviewSnippet**

* `PlaceAnswerSources`: `reviewSnippets[]` (*ReviewSnippet*).  
* `ReviewSnippet`: `reviewId` (string), `googleMapsUri` (string), `title` (string).

**GroundingSupport & Segment**

* `GroundingSupport`: `groundingChunkIndices[]` (integer), `confidenceScores[]` (number, 0-1), `segment` (*Segment*).  
* `Segment`: `partIndex` (integer), `startIndex` (integer), `endIndex` (integer), `text` (string).

**RetrievalMetadata**

* `googleSearchDynamicRetrievalScore` (number): \[0, 1\] probability search helps. Triggers search based on threshold.

**LogprobsResult / TopCandidates / Candidate (Logprobs)**

* `LogprobsResult`: `topCandidates[]` (*TopCandidates*), `chosenCandidates[]` (*Candidate*), `logProbabilitySum` (number).  
* `TopCandidates`: `candidates[]` (*Candidate*).  
* `Candidate` (Logprobs): `token` (string), `tokenId` (integer), `logProbability` (number).

**UrlContextMetadata & UrlMetadata**

* `UrlContextMetadata`: `urlMetadata[]` (*UrlMetadata*).  
* `UrlMetadata`: `retrievedUrl` (string), `urlRetrievalStatus` (*UrlRetrievalStatus* Enum: `UNSPECIFIED`, `SUCCESS`, `ERROR`, `PAYWALL`, `UNSAFE`).

**CitationMetadata & CitationSource**

* `CitationMetadata`: `citationSources[]` (*CitationSource*).  
* `CitationSource`: `startIndex` (integer), `endIndex` (integer), `uri` (string), `license` (string).

**GenerationConfig**

* `stopSequences[]` (string): Max 5 sequences.  
* `responseMimeType` (string): `text/plain`, `application/json`, `text/x.enum`.  
* `responseSchema` (*Schema*): OpenAPI schema subset. Requires compatible MIME type.  
* `_responseJsonSchema` / `responseJsonSchema` (value): Internal/alternative JSON Schema. Supports limited JSON Schema properties (`$id`, `$ref`, `type`, `enum`, `anyOf`, etc).  
* `responseModalities[]` (*Modality* Enum: `UNSPECIFIED`, `TEXT`, `IMAGE`, `VIDEO`, `AUDIO`, `DOCUMENT`).  
* `candidateCount` (integer): Default 1\. N/A for Gemini 1.0.  
* `maxOutputTokens` (integer).  
* `temperature` (number): Range \[0.0, 2.0\].  
* `topP` (number): Maximum cumulative probability.  
* `topK` (integer): Maximum tokens to consider.  
* `seed` (integer): Decoding seed.  
* `presencePenalty` (number): Modifies logprobs if token already seen. Positive discourages reuse, negative encourages reuse.  
* `frequencyPenalty` (number): Modifies logprobs multiplied by times token seen.  
* `responseLogprobs` (boolean): Export logprobs.  
* `logprobs` (integer): Top logprobs count \[0, 20\].  
* `enableEnhancedCivicAnswers` (boolean).  
* `speechConfig` (*SpeechConfig*), `thinkingConfig` (*ThinkingConfig*), `imageConfig` (*ImageConfig*).  
* `mediaResolution` (*MediaResolution* Enum: `UNSPECIFIED`, `LOW` (64 tokens), `MEDIUM` (256 tokens), `HIGH` (zoomed reframing, 256 tokens)).

**SpeechConfig & Voice Configs**

* `SpeechConfig`: `voiceConfig` OR `multiSpeakerVoiceConfig`, `languageCode` (string, BCP 47).  
* `VoiceConfig`: `prebuiltVoiceConfig` (*PrebuiltVoiceConfig* \-\> `voiceName` (string)).  
* `MultiSpeakerVoiceConfig`: \`speakerVoiceConfigs

