import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
// @ts-ignore
import { translate } from 'google-translate-api-x';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';

const BASE_DIR = path.join(process.cwd(), '../');

export async function POST(request: Request) {
    try {
        const body = await request.json();
        // New: variables
        const { text, targetLang, engine, config, prompt: systemPrompt, contextFilePath, variables } = body;

        // Extract engine-specific config from engines map, fallback to top-level config
        const engineConfig = config?.engines?.[engine] || {};
        const mergedConfig = {
            ...config,
            apiKey: engineConfig.apiKey || config?.apiKey,
            model: engineConfig.model || config?.model,
            apiBase: engineConfig.apiBase || config?.apiBase,
            temperature: engineConfig.temperature || config?.temperature,
        };

        console.log(`[Translate API] Engine: ${engine}, apiBase: ${mergedConfig.apiBase}, model: ${mergedConfig.model}`);

        if (!text) {
            return NextResponse.json({ error: 'Text is required' }, { status: 400 });
        }

        // 1. Prepare Variables & Context
        // Support legacy contextFilePath by adding it to variables as 'context'
        const interpolationVars: Record<string, string> = { ...variables };

        // Helper to load file content
        const loadFile = (relPath: string) => {
            try {
                const safePath = path.resolve(BASE_DIR, relPath);
                if (fs.existsSync(safePath) && safePath.startsWith(BASE_DIR)) {
                    return fs.readFileSync(safePath, 'utf-8');
                }
            } catch (e) {
                console.warn("Failed to read file:", relPath, e);
            }
            return '';
        };

        // Handle legacy context file
        if (contextFilePath && engine !== 'google') {
            const content = loadFile(contextFilePath);
            if (content) {
                interpolationVars['context'] = content;
            }
        }

        // 2. Interpolate Prompt
        let finalSystemPrompt = systemPrompt || "You are a professional translator. Translate the following text into the target language. Return ONLY the translated text.";

        // Perform replacement: {{key}} -> value
        Object.entries(interpolationVars).forEach(([key, val]) => {
            // value might be very long (file content), so we just replace
            // Use global replace
            finalSystemPrompt = finalSystemPrompt.split(`{{${key}}}`).join(val);
        });

        // Specialized replacement for TARGET_LANGUAGE
        finalSystemPrompt = finalSystemPrompt.replace(/{{TARGET_LANGUAGE}}/g, targetLang || 'zh-TW');

        // Check for INPUT_TEXT in system prompt (Allow full control)
        const promptUsedInputText = finalSystemPrompt.includes('{{INPUT_TEXT}}');
        if (promptUsedInputText) {
            finalSystemPrompt = finalSystemPrompt.split('{{INPUT_TEXT}}').join(text);
        }

        const contextData = interpolationVars['context'] || '';
        const promptUsedContext = systemPrompt && systemPrompt.includes('{{context}}');

        let finalUserContent = '';
        if (promptUsedInputText) {
            // If text is already in system prompt, user message can be minimal
            finalUserContent = "Please proceed with the translation.";
        } else {
            // Default behavior: Append text
            finalUserContent = `Text to translate:\n${text}\n\nTarget Language: ${targetLang}`;
        }

        if (contextData && !promptUsedContext) {
            finalUserContent = `Context:\n${contextData.slice(0, 10000)}\n\n` + finalUserContent;
        }

        // 3. Process based on engine
        let translatedText = '';

        if (engine === 'google_free' || engine === 'google') {
            const res = await translate(text, { to: targetLang || 'zh-TW', autoCorrect: true });
            translatedText = res.text;

        } else if (engine === 'openai') {
            if (!mergedConfig?.apiKey) throw new Error("API Key required for OpenAI");
            const openai = new OpenAI({ apiKey: mergedConfig.apiKey, dangerouslyAllowBrowser: true });

            const completion = await openai.chat.completions.create({
                messages: [
                    { role: "system", content: finalSystemPrompt },
                    { role: "user", content: finalUserContent }
                ],
                model: mergedConfig.model || "gpt-4o",
                temperature: mergedConfig.temperature || 0.3,
                response_format: mergedConfig.forceJsonMode ? { type: "json_object" } : undefined
            });

            translatedText = completion.choices[0].message.content || "";

        } else if (engine === 'gemini') {
            if (!mergedConfig?.apiKey) throw new Error("API Key required for Gemini");
            const genAI = new GoogleGenerativeAI(mergedConfig.apiKey);
            const model = genAI.getGenerativeModel({
                model: mergedConfig.model || "gemini-1.5-flash",
                generationConfig: mergedConfig.forceJsonMode ? { responseMimeType: "application/json" } : undefined
            });

            const prompt = `${finalSystemPrompt}\n\n${finalUserContent}`;
            const result = await model.generateContent(prompt);
            const response = await result.response;
            translatedText = response.text();

        } else if (engine === 'claude') {
            if (!mergedConfig?.apiKey) throw new Error("API Key required for Claude");
            const anthropic = new Anthropic({ apiKey: mergedConfig.apiKey });

            // Claude doesn't have a strict JSON mode flag in the same way, but we can append to system prompt
            // However, user prompt control is preferred. We will just ensure the prompt instructions are clear.
            // Recently Claude supports tool use for extraction, but here we just want text.

            const msg = await anthropic.messages.create({
                model: mergedConfig.model || "claude-3-5-sonnet-20240620",
                max_tokens: 1024,
                system: finalSystemPrompt,
                messages: [
                    { role: "user", content: finalUserContent }
                ]
            });

            // @ts-ignore
            translatedText = msg.content[0].text;

        } else if (engine === 'ollama') {
            // Ollama Implementation
            const apiBase = mergedConfig.apiBase || 'http://localhost:11434';

            const res = await fetch(`${apiBase}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: mergedConfig.model || 'llama3',
                    messages: [
                        { role: "system", content: finalSystemPrompt },
                        { role: "user", content: finalUserContent }
                    ],
                    stream: false,
                    format: mergedConfig.forceJsonMode ? 'json' : undefined,
                    options: {
                        temperature: mergedConfig.temperature || 0.3
                    }
                })
            });

            if (!res.ok) {
                throw new Error(`Ollama Error: ${res.status} ${res.statusText}`);
            }

            const data = await res.json();
            translatedText = data.message?.content || "";

        } else if (engine === 'lmstudio') {
            // LM Studio Implementation (OpenAI-compatible API)
            let apiBase = mergedConfig.apiBase || 'http://localhost:1234/v1';
            // Ensure apiBase ends with /v1 for OpenAI-compatible endpoint
            apiBase = apiBase.replace(/\/+$/, ''); // Remove trailing slashes
            if (!apiBase.endsWith('/v1')) {
                apiBase = apiBase + '/v1';
            }

            console.log(`[LM Studio] Calling ${apiBase}/chat/completions with model: ${mergedConfig.model}`);

            const res = await fetch(`${apiBase}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // LM Studio doesn't require API key but accepts it
                    ...(mergedConfig.apiKey ? { 'Authorization': `Bearer ${mergedConfig.apiKey}` } : {})
                },
                body: JSON.stringify({
                    model: mergedConfig.model || 'local-model',
                    messages: [
                        { role: "system", content: finalSystemPrompt },
                        { role: "user", content: finalUserContent }
                    ],
                    temperature: mergedConfig.temperature || 0.3,
                    // LM Studio uses json_schema, not json_object
                    ...(mergedConfig.forceJsonMode ? {
                        response_format: {
                            type: "json_schema",
                            json_schema: {
                                name: "translation_response",
                                strict: false,
                                schema: { type: "array" }
                            }
                        }
                    } : {})
                })
            });

            if (!res.ok) {
                // Try to get error details from response
                let errorDetail = '';
                try {
                    const errorData = await res.json();
                    errorDetail = errorData.error?.message || errorData.message || JSON.stringify(errorData);
                } catch {
                    errorDetail = await res.text().catch(() => '');
                }
                console.error(`[LM Studio] Error response:`, errorDetail);
                throw new Error(`LM Studio Error: ${res.status} ${res.statusText} - ${errorDetail}`);
            }

            const data = await res.json();
            translatedText = data.choices?.[0]?.message?.content || "";

        } else {
            return NextResponse.json({ error: 'Invalid engine' }, { status: 400 });
        }

        return NextResponse.json({ translatedText });

    } catch (error: any) {
        console.error('Translation error:', error);
        return NextResponse.json({ error: error.message || 'Translation failed' }, { status: 500 });
    }
}
