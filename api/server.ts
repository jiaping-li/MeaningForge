import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const port = Number(process.env.PORT || 8787);
const deepSeekApiUrl = "https://api.deepseek.com/v1/chat/completions";
const openAiApiUrl = "https://api.openai.com/v1/chat/completions";
const maxBodyBytes = 8 * 1024 * 1024;

type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

type LlmToolDefinition = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
};

type ToolChoice = "auto" | "none" | "required";

type ToolCallResult = {
  toolName: string | null;
  arguments: unknown;
  rawArguments: string;
  rawMessageContent: string;
  rawToolCall: unknown;
  toolCalls: Array<{
    toolName: string;
    arguments: unknown;
    rawArguments: string;
    rawToolCall: unknown;
  }>;
};

type LlmProviderConfig = {
  apiUrl: string;
  apiKey: string;
  model: string;
};

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
const projectRoot = path.resolve(currentDir, "..");

function loadEnvFile(filePath: string): void {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, "utf8");
  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      return;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      return;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    if (!key || process.env[key] !== undefined) {
      return;
    }

    process.env[key] = rawValue.replace(/^["']|["']$/g, "");
  });
}

[
  path.resolve(projectRoot, "api/.env.local"),
  path.resolve(projectRoot, "api/.env"),
].forEach(loadEnvFile);

function getDeepSeekApiKey(): string {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key || key.trim().length === 0) {
    throw new Error("The API server is missing its provider credentials.");
  }
  return key;
}

function getLlmProviderConfig(): LlmProviderConfig {
  const openAiKey = process.env.OPENAI_API_KEY?.trim();
  if (openAiKey) {
    return {
      apiUrl: process.env.OPENAI_API_URL?.trim() || openAiApiUrl,
      apiKey: openAiKey,
      model: process.env.OPENAI_MODEL?.trim() || process.env.LLM_MODEL?.trim() || "gpt-4o-mini",
    };
  }

  const deepSeekKey = process.env.DEEPSEEK_API_KEY?.trim();
  if (deepSeekKey) {
    return {
      apiUrl: process.env.DEEPSEEK_API_URL?.trim() || deepSeekApiUrl,
      apiKey: deepSeekKey,
      model: process.env.DEEPSEEK_MODEL?.trim() || process.env.LLM_MODEL?.trim() || "deepseek-chat",
    };
  }

  throw new Error("Set OPENAI_API_KEY or DEEPSEEK_API_KEY before using live LLM endpoints.");
}

function parseJsonSafe<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

function parseJsonFromModel<T>(text: string): T {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const candidate = fenced?.[1] || trimmed;
  const parsed = parseJsonSafe<T>(candidate);
  if (parsed) return parsed;

  const firstBrace = candidate.indexOf("{");
  const lastBrace = candidate.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    const sliced = candidate.slice(firstBrace, lastBrace + 1);
    const slicedParsed = parseJsonSafe<T>(sliced);
    if (slicedParsed) return slicedParsed;
  }

  throw new Error("Model response was not valid JSON.");
}

function sendJson(response: http.ServerResponse, status: number, payload: unknown): void {
  response.writeHead(status, {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type",
    "content-type": "application/json",
  });
  response.end(JSON.stringify(payload));
}

function sendInternalError(response: http.ServerResponse, error: unknown): void {
  console.error("[api] request failed", error);
  sendJson(response, 500, { error: "LLM service unavailable." });
}

function isChatMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== "object") {
    return false;
  }

  const item = value as Record<string, unknown>;
  return (
    (item.role === "user" || item.role === "assistant" || item.role === "system") &&
    typeof item.content === "string"
  );
}

function isToolChoice(value: unknown): value is ToolChoice {
  return value === "auto" || value === "none" || value === "required";
}

function readJsonBody(request: http.IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let totalBytes = 0;

    request.on("data", (chunk: Buffer) => {
      totalBytes += chunk.length;
      if (totalBytes > maxBodyBytes) {
        reject(new Error("Request body is too large."));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });

    request.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw.trim()) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error("Request body must be valid JSON."));
      }
    });

    request.on("error", reject);
  });
}

async function postDeepSeek(payload: Record<string, unknown>): Promise<unknown> {
  const response = await fetch(deepSeekApiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getDeepSeekApiKey()}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message =
      typeof errorData === "object" &&
      errorData !== null &&
      "error" in errorData &&
      typeof (errorData as { error?: { message?: unknown } }).error?.message === "string"
        ? (errorData as { error: { message: string } }).error.message
        : response.statusText;
    throw new Error(`DeepSeek API error: ${response.status} - ${message}`);
  }

  return response.json();
}

async function postChatCompletion(payload: Record<string, unknown>): Promise<unknown> {
  const provider = getLlmProviderConfig();
  const responseFormatMode = process.env.LLM_RESPONSE_FORMAT?.trim();
  const requestPayload = { ...payload };
  if (responseFormatMode) {
    requestPayload.response_format = { type: responseFormatMode };
  }

  const response = await fetch(provider.apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${provider.apiKey}`,
    },
    body: JSON.stringify({
      model: provider.model,
      temperature: 0.2,
      stream: false,
      ...requestPayload,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText);
    throw new Error(`LLM API error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

function readChatContent(data: unknown): string {
  const content = (data as { choices?: Array<{ message?: { content?: unknown } }> })
    .choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("LLM response did not include message content.");
  }
  return content;
}

function meaningSystemPrompt(): string {
  return [
    "You are assisting an HCI research prototype called Mapping Meaning.",
    "Your job is not to produce a final literary interpretation.",
    "Return inspectable JSON for interactive close reading.",
    "Separate concrete carrier, mapping relations, textual evidence, cultural grounding, alternatives, uncertainty, and reader-editable replacement analysis.",
    "Treat the LLM as a scaffold generator: the reader must be able to accept, revise, reject, and compare every important claim.",
    "Use theory-guided detection before interpretation: MIP/MIPVU, Chinese poetics, symbol/motif, and narrative structure are complementary lenses.",
    "Do not label every symbol as metaphor. Prefer candidates with concrete carrier, contextual shift, evidence, mapping potential, and replaceability.",
    "Avoid unsupported certainty. Keep claims grounded in the supplied passage and well-known literary/cultural context.",
    "Use Chinese for user-facing labels, titles, explanations, and diagnostic questions unless the source text itself is not Chinese and an exact quoted phrase is needed.",
    "Return JSON only.",
  ].join(" ");
}

async function handleScanCandidates(request: http.IncomingMessage, response: http.ServerResponse): Promise<void> {
  const body = await readJsonBody(request);
  const payload = body && typeof body === "object" ? body as Record<string, unknown> : {};
  const workTitle = String(payload.workTitle || "Imported work");
  const author = String(payload.author || "");
  const language = String(payload.language || "other");
  const tradition = String(payload.tradition || "Imported");
  const theoryLenses = Array.isArray(payload.theoryLenses)
    ? payload.theoryLenses.map((item) => String(item)).filter(Boolean)
    : [];
  const passageLabel = String(payload.passageLabel || "Selected passage");
  const passage = String(payload.passage || "");

  if (!passage.trim()) {
    sendJson(response, 400, { error: "passage is required." });
    return;
  }

  const data = await postChatCompletion({
    messages: [
      { role: "system", content: meaningSystemPrompt() },
      {
        role: "user",
        content: JSON.stringify({
          task: "Scan this passage before interpretation. Do not produce a final reading. Produce preprocess data and ranked candidate carriers for later human/LLM selection.",
          outputContract: {
            scan: {
              workTitle: "string",
              passageLabel: "string",
              preprocess: {
                segments: ["short segment strings"],
                entities: ["people, places, objects, named abstractions"],
                images: ["concrete images, symbolic objects, motifs"],
                actions: ["salient verbs/actions"],
                repeatedTerms: ["repeated words or phrases"],
                allusions: ["possible allusions or classical references"],
                narrativeFrames: ["dream frame, mythic frame, social frame, dramatic frame, etc."],
              },
              candidates: [
                {
                  id: "string",
                  span: "short exact phrase from passage",
                  label: "string",
                  whyCandidate: "why this may carry metaphorical/symbolic meaning",
                  evidenceExcerpt: "short excerpt from passage",
                  priority: "high | medium | low",
                  detectionMethod: "MIP/MIPVU | Chinese poetics | Symbol/motif | Narrative structure | LLM semantic scan",
                  basicMeaning: "basic/concrete/conventional meaning",
                  contextualMeaning: "meaning in this passage",
                  semanticTension: "basic-contextual tension or symbolic tension",
                  culturalResonance: "poetics, allusion, motif, genre, tradition",
                  readerSalience: "high | medium | low",
                  confidence: "high | medium | low",
                  replaceability: "high | medium | low",
                  theoryTrace: {
                    mipVu: "basic/contextual meaning comparison or why not applicable",
                    chinesePoetics: "比/兴/意象/寄托/典故/意境 reason or empty string",
                    symbolMotif: "symbolic or motif recurrence reason or empty string",
                    narrativeStructure: "how this carrier matters to scene, character, fate, or action",
                  },
                  scores: {
                    mipTension: "number 0-1",
                    poeticImagery: "number 0-1",
                    motifRecurrence: "number 0-1",
                    narrativeImportance: "number 0-1",
                    evidenceDensity: "number 0-1",
                  },
                },
              ],
            },
          },
          workTitle,
          author,
          language,
          tradition,
          theoryLenses,
          passageLabel,
          passage,
          constraints: [
            "This is a VeriForge-style scaffold: generate inspectable candidates, not a final answer.",
            "Use all selected theoryLenses as complementary filters.",
            "For Chinese classics, actively scan 比, 興, 意象, 寄托, 典故, 命名/諧音, 真假/夢幻 structures, recurring motifs, and narrative frames.",
            "For MIP/MIPVU, explicitly compare basic meaning and contextual meaning.",
            "Prefer candidates that a human reader would notice: repeated, strange, culturally loaded, narratively central, or emotionally salient images.",
            "Prefer candidates that are productive under replacement: replacing the carrier should preserve, break, or create some mapping relations.",
            "Penalize isolated proper names or literal objects unless you can state a contextual shift, cultural resonance, or narrative function.",
            "Return 5-10 candidates when the passage is long enough.",
            "Rank candidates by readerSalience, evidenceDensity, culturalResonance, semanticTension, and narrativeImportance.",
            "Use short excerpts only. Do not invent quotations.",
          ],
        }),
      },
    ],
    response_format: { type: "json_object" },
  });

  const parsed = parseJsonFromModel<{ scan: unknown }>(readChatContent(data));
  sendJson(response, 200, parsed);
}

async function handleAnalyzePassage(request: http.IncomingMessage, response: http.ServerResponse): Promise<void> {
  const body = await readJsonBody(request);
  const payload = body && typeof body === "object" ? body as Record<string, unknown> : {};
  const workTitle = String(payload.workTitle || "Imported work");
  const author = String(payload.author || "");
  const language = String(payload.language || "other");
  const tradition = String(payload.tradition || "Imported");
  const theoryLenses = Array.isArray(payload.theoryLenses)
    ? payload.theoryLenses.map((item) => String(item)).filter(Boolean)
    : [];
  const passageLabel = String(payload.passageLabel || "Selected passage");
  const passage = String(payload.passage || "");
  const selectedSpan = String(payload.selectedSpan || "").trim();

  if (!passage.trim()) {
    sendJson(response, 400, { error: "passage is required." });
    return;
  }

  const schemaInstruction = {
    id: "string",
    title: "string",
    workTitle: "string",
    passageLabel: "string",
    passage: "string",
    selectedSpan: "string",
    expressionTypes: [
      "lexical_metaphor | metaphorically_structured_image | recurring_metaphorical_motif | metaphorically_structured_action",
    ],
    literalScene: { entities: ["string"], actions: ["string"] },
    concreteCarrier: { name: "string", attributes: ["string"], relations: ["string"] },
    broaderMeaningHypotheses: ["string"],
    mappingRelations: [
      {
        id: "string",
        carrierRelation: "string",
        meaningRelation: "string",
        importance: "high | medium | low",
        evidenceIds: ["string"],
        relationType: "attribute | action | affect | cultural | narrative | contrast",
      },
    ],
    evidence: [
      {
        id: "string",
        kind: "textual | cultural | critical",
        label: "string",
        excerpt: "string",
        note: "string",
        sourceRole: "passage | cultural_context | critical_context | reader_added",
        groundedness: "direct_quote | paraphrase | inference",
      },
    ],
    candidateCarriers: [
      {
        id: "string",
        span: "short literal phrase from the passage",
        label: "string",
        whyCandidate: "why this image or phrase may carry metaphorical meaning",
        evidenceExcerpt: "short excerpt from the supplied passage",
        priority: "high | medium | low",
        detectionMethod: "MIP/MIPVU | Chinese poetics | Symbol/motif | Narrative structure | LLM semantic scan",
        basicMeaning: "basic, concrete, embodied, or conventional meaning when applicable",
        contextualMeaning: "meaning in this passage",
        semanticTension: "tension between basic and contextual meaning, or why it is not a strict MIP case",
        culturalResonance: "genre, tradition, allusion, motif, poetics, or cultural reason",
        readerSalience: "high | medium | low",
        confidence: "high | medium | low",
        replaceability: "high | medium | low",
        theoryTrace: {
          mipVu: "string",
          chinesePoetics: "string",
          symbolMotif: "string",
          narrativeStructure: "string",
        },
      },
    ],
    alternativeInterpretations: ["string"],
    replacements: [
      {
        id: "string",
        label: "string",
        replacementCarrier: "string",
        replacementStrategy: "near_neighbor | cultural_variant | oppositional | literalizing | reader_authored",
        purpose: "string",
        comparisons: [
          {
            id: "string",
            status: "preserved | broken | emergent",
            title: "string",
            explanation: "string",
            relationIds: ["string"],
            diagnosticQuestion: "question the reader can use to judge this effect",
          },
        ],
      },
    ],
    uncertainty: "low | medium | high",
    analysisProvenance: {
      systemRole: "scaffold",
      theoryLenses: ["string"],
      source: "llm",
      generatedAt: "ISO timestamp string",
    },
    studyHooks: {
      designGoal: ["string"],
      expectedUserAction: ["string"],
      measurableOutcome: ["string"],
    },
  };

  const data = await postChatCompletion({
    messages: [
      { role: "system", content: meaningSystemPrompt() },
      {
        role: "user",
        content: JSON.stringify({
          task: "Analyze this literary passage as a literary metaphorical mapping for interactive reworking.",
          outputContract: { mapping: schemaInstruction },
          workTitle,
          author,
          language,
          tradition,
          theoryLenses,
          passageLabel,
          passage,
          selectedSpan,
          constraints: [
            "Use stable IDs with short lowercase strings.",
            "Use a theory-guided detection pass before interpretation.",
            "Use all selected theoryLenses together; they are complementary, not mutually exclusive.",
            "If theoryLenses is empty, choose lenses from language/tradition/genre: Chinese classics should prioritize Chinese poetics, symbol/motif, narrative structure, then MIP/MIPVU; English prose/drama should prioritize MIP/MIPVU, symbol/motif, and narrative structure.",
            "For MIP/MIPVU candidates, compare contextual meaning with a more basic/concrete meaning and state the semantic tension.",
            "For Chinese classics, scan for 比, 興, 意象, 寄托, 典故, 命名/諧音, 真假/夢幻 structures, and recurring cultural motifs.",
            "For symbol/motif candidates, prefer repeated, culturally loaded, narratively salient images rather than isolated nouns.",
            "First identify 4-8 candidate carriers/images/motifs in the passage, especially for long classic chapters.",
            "Put those candidates in candidateCarriers with short exact spans, evidence excerpts, detectionMethod, basicMeaning, contextualMeaning, semanticTension, culturalResonance, readerSalience, and confidence.",
            "Rank candidates by reader salience, textual evidence density, cultural resonance, and interpretive productivity.",
            "Then choose one most promising candidate as selectedSpan/concreteCarrier for the detailed mapping.",
            "If selectedSpan is provided by the user, prioritize it as the detailed mapping but still list other candidates.",
            "Create 2-4 mappingRelations with relationType and evidenceIds.",
            "Create 2-5 evidence items with sourceRole and groundedness. Textual evidence must quote only from the provided passage.",
            "Create 2-3 replacement candidates with different replacementStrategy values where possible.",
            "Each replacement should include at least one preserved, one broken, and one emergent comparison. If a category is weak or uncertain, still include it and state that uncertainty for the reader to judge.",
            "Each replacement comparison should include a diagnosticQuestion for the reader.",
            "Add analysisProvenance and studyHooks that make the system usable in a CHI user study.",
            "Do not invent long quotations. Use short excerpts from the provided passage or paraphrased cultural notes.",
          ],
        }),
      },
    ],
    response_format: { type: "json_object" },
  });

  const parsed = parseJsonFromModel<{ mapping: unknown }>(readChatContent(data));
  sendJson(response, 200, parsed);
}

async function handleCompareReplacement(request: http.IncomingMessage, response: http.ServerResponse): Promise<void> {
  const body = await readJsonBody(request);
  const payload = body && typeof body === "object" ? body as Record<string, unknown> : {};
  const mapping = payload.mapping;
  const replacementCarrier = String(payload.replacementCarrier || "").trim();

  if (!mapping || typeof mapping !== "object" || !replacementCarrier) {
    sendJson(response, 400, { error: "mapping and replacementCarrier are required." });
    return;
  }

  const data = await postChatCompletion({
    messages: [
      { role: "system", content: meaningSystemPrompt() },
      {
        role: "user",
        content: JSON.stringify({
          task: "Compare a replacement carrier against an existing literary metaphorical mapping.",
          outputContract: {
            replacement: {
              id: "string",
              label: "string",
              replacementCarrier: "string",
              replacementStrategy: "near_neighbor | cultural_variant | oppositional | literalizing | reader_authored",
              purpose: "string",
              comparisons: [
                {
                  id: "string",
                  status: "preserved | broken | emergent",
                  title: "string",
                  explanation: "string",
                  relationIds: ["string"],
                  diagnosticQuestion: "question the reader can use to judge this effect",
                },
              ],
            },
          },
          mapping,
          replacementCarrier,
          constraints: [
            "Use relationIds from the supplied mapping when a comparison refers to an existing relation.",
            "Include at least one preserved, one broken, and one emergent comparison. If a category is weak or uncertain, still include it and state that uncertainty for the reader to judge.",
            "Do not judge the replacement as simply better or worse; explain structural consequences.",
            "Name the replacementStrategy and give diagnosticQuestion values for each comparison.",
          ],
        }),
      },
    ],
    response_format: { type: "json_object" },
  });

  const parsed = parseJsonFromModel<{ replacement: unknown }>(readChatContent(data));
  sendJson(response, 200, parsed);
}

async function handleChat(request: http.IncomingMessage, response: http.ServerResponse): Promise<void> {
  const body = await readJsonBody(request);
  const payload = body && typeof body === "object" ? body as Record<string, unknown> : {};
  const messages = payload.messages;

  if (!Array.isArray(messages) || !messages.every(isChatMessage)) {
    sendJson(response, 400, { error: "messages must be an array of chat messages." });
    return;
  }

  const data = await postDeepSeek({
    model: "deepseek-chat",
    messages,
    temperature: 0.7,
    stream: false,
  });

  const content = (data as { choices?: Array<{ message?: { content?: unknown } }> })
    .choices?.[0]?.message?.content;
  sendJson(response, 200, {
    content: typeof content === "string" ? content : "抱歉，没有收到回复。",
  });
}

async function handleToolChat(request: http.IncomingMessage, response: http.ServerResponse): Promise<void> {
  const body = await readJsonBody(request);
  const payload = body && typeof body === "object" ? body as Record<string, unknown> : {};
  const messages = payload.messages;
  const tools = payload.tools;
  const toolChoice = isToolChoice(payload.toolChoice) ? payload.toolChoice : "auto";

  if (!Array.isArray(messages) || !messages.every(isChatMessage)) {
    sendJson(response, 400, { error: "messages must be an array of chat messages." });
    return;
  }

  if (!Array.isArray(tools)) {
    sendJson(response, 400, { error: "tools must be an array." });
    return;
  }

  const data = await postDeepSeek({
    model: "deepseek-chat",
    messages,
    tools: tools as LlmToolDefinition[],
    tool_choice: toolChoice,
    temperature: 0.2,
    stream: false,
  });

  const message = (data as { choices?: Array<{ message?: Record<string, unknown> }> })
    .choices?.[0]?.message;
  const rawToolCalls = Array.isArray(message?.tool_calls) ? message.tool_calls : [];
  const parsedToolCalls = rawToolCalls
    .map((toolCall) => {
      if (!toolCall || typeof toolCall !== "object") {
        return null;
      }

      const rawToolCall = toolCall as { function?: { name?: unknown; arguments?: unknown } };
      const name = rawToolCall.function?.name;
      if (typeof name !== "string" || name.trim().length === 0) {
        return null;
      }

      const rawArguments = String(rawToolCall.function?.arguments || "{}");
      return {
        toolName: name,
        arguments: parseJsonSafe<unknown>(rawArguments) ?? {},
        rawArguments,
        rawToolCall: toolCall,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  const firstToolCall = parsedToolCalls[0] || null;
  const result: ToolCallResult = {
    toolName: firstToolCall?.toolName || null,
    arguments: firstToolCall?.arguments ?? {},
    rawArguments: firstToolCall?.rawArguments || "{}",
    rawMessageContent: String(message?.content || ""),
    rawToolCall: firstToolCall?.rawToolCall || null,
    toolCalls: parsedToolCalls,
  };

  sendJson(response, 200, result);
}

const server = http.createServer((request, response) => {
  const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);

  if (request.method === "OPTIONS") {
    sendJson(response, 204, {});
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/health") {
    sendJson(response, 200, { ok: true, service: "meaningforge-api" });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/llm/chat") {
    handleChat(request, response).catch((error: unknown) => {
      sendInternalError(response, error);
    });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/llm/tool-chat") {
    handleToolChat(request, response).catch((error: unknown) => {
      sendInternalError(response, error);
    });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/meaning/analyze") {
    handleAnalyzePassage(request, response).catch((error: unknown) => {
      sendInternalError(response, error);
    });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/meaning/scan") {
    handleScanCandidates(request, response).catch((error: unknown) => {
      sendInternalError(response, error);
    });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/meaning/compare") {
    handleCompareReplacement(request, response).catch((error: unknown) => {
      sendInternalError(response, error);
    });
    return;
  }

  sendJson(response, 404, { error: "Not Found" });
});

server.listen(port, () => {
  console.log(`MeaningForge API listening on http://localhost:${port}`);
});
