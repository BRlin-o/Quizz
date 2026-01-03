import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';
// @ts-ignore
import { translate } from 'google-translate-api-x';

export async function POST(request: Request) {
    try {
        const { engine, config } = await request.json();
        const { apiKey, model, apiBase } = config;

        // Test logic
        if (engine === 'google') {
            await translate('test', { to: 'en' });
            return NextResponse.json({ success: true });
        }

        if (engine === 'openai') {
            if (!apiKey) throw new Error("Missing API Key");
            const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
            await openai.models.list(); // Test auth
            return NextResponse.json({ success: true });
        }

        if (engine === 'gemini') {
            if (!apiKey) throw new Error("Missing API Key");
            const genAI = new GoogleGenerativeAI(apiKey);
            const m = genAI.getGenerativeModel({ model: model || "gemini-1.5-flash" });
            await m.generateContent("Test"); // Test generation
            return NextResponse.json({ success: true });
        }

        if (engine === 'claude') {
            if (!apiKey) throw new Error("Missing API Key");
            const anthropic = new Anthropic({ apiKey });
            // Cheap test: maybe just list models or small generation
            await anthropic.messages.create({
                model: model || "claude-3-5-sonnet-20240620",
                max_tokens: 1,
                messages: [{ role: "user", content: "Hi" }]
            });
            return NextResponse.json({ success: true });
        }

        if (engine === 'ollama') {
            const base = apiBase || 'http://localhost:11434';
            // Test list models
            const res = await fetch(`${base}/api/tags`);
            if (!res.ok) throw new Error("Failed to connect to Ollama");
            return NextResponse.json({ success: true });
        }

        if (engine === 'lmstudio') {
            let base = apiBase || 'http://localhost:1234/v1';
            // Ensure base ends with /v1 for OpenAI-compatible endpoint
            base = base.replace(/\/+$/, ''); // Remove trailing slashes
            if (!base.endsWith('/v1')) {
                base = base + '/v1';
            }
            // Test list models (OpenAI-compatible)
            const res = await fetch(`${base}/models`, {
                headers: apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {}
            });
            if (!res.ok) throw new Error("Failed to connect to LM Studio");
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: "Unknown engine" }, { status: 400 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || "Test failed" }, { status: 500 });
    }
}
