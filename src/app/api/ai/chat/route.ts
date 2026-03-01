import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Mistral } from "@mistralai/mistralai";

// ENV
const geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
const mistralApiKey = process.env.NEXT_PUBLIC_MISTRAL_API_KEY || process.env.MISTRAL_API_KEY;

// MODES
type Mode = 'knowledge' | 'problem' | 'idea' | 'developer';
type Intent = 'review' | 'refactor' | 'explain' | 'general';
type Provider = 'gemini' | 'mistral';

interface ChatRequestBody {
    mode: Mode;
    intent?: Intent;
    message: string;
    provider?: Provider;
}

// SYSTEM PROMPTS
const PROMPTS = {
    knowledge: `You are Zizzy Explorer, a friendly and intelligent AI designed to help users explore ideas, understand topics, plan effectively, and get unstuck. You act as a thinking partner, not just a chatbot. You prioritize clarity, structure, and helpful guidance. You explain concepts simply, break tasks into steps, help with planning, brainstorming, and learning, and offer gentle follow-up suggestions. You do not act as a developer tool in this version. If asked about developer features, respond that those features are coming in a future release.`,

    problem: `You are Zizzy Problem Solver.
Solve problems step-by-step using logic and precision.
Ask clarifying questions if needed.
Explain reasoning clearly.
For code: identifying the issue, explain it, then fix it.
Prioritize correctness over speed.
Tone: Technical, focused, precise.`,

    idea: `You are Zizzy Idea Lab.
Generate bold, original, and practical ideas.
Provide multiple options.
Explain the thinking behind ideas.
Adapt ideas to user context when available.
Encourage iteration and refinement.
Tone: Creative, energetic, inspiring.`,

    developer: {
        base: `You are Zizzy Developer Companion.
You are a senior staff engineer pairing with the user.
Focus on clean, maintainable, modern code.
Assume the user knows the basics; skip boilerplate unless asked.
Use best practices for security and performance.
Tone: Professional, terse, helpful.`,

        review: `TASK: Code Review.
Analyze the provided code for:
1. Bugs or logic errors.
2. Performance optimizations.
3. Security vulnerabilities.
4. Readability and style improvements.
Output: A structured list of findings followed by a summary.`,

        refactor: `TASK: Refactor.
Rewrite the provided code to be cleaner, more efficient, and more maintainable.
Preserve the original behavior.
Explain what you changed and why.`,

        explain: `TASK: Code Explanation.
Explain how the code works step-by-step.
Highlight key logic flows and important side effects.
If the code is complex, use a high-level summary first.`,

        general: `TASK: General Assistance.
Assist the developer with their query using the guidelines defined in the base prompt.`
    }
};

// HELPERS
function getSuggestions(mode: Mode, intent?: Intent): string[] {
    if (mode === 'developer') {
        const intentSuggestions = {
            review: ["Fix these issues", "How safe is this?", "Make it faster"],
            refactor: ["Why did you change that?", "Undo the loop change", "Use functional style"],
            explain: ["Explain the edge cases", "What are the dependencies?", "Visualize the flow"],
            general: ["Review my code", "Help me debug", "Architecture advice"]
        };
        return intentSuggestions[intent || 'general'];
    }

    switch (mode) {
        case 'knowledge': return ["Deep dive into this", "Explain like I'm 5", "Historical context"];
        case 'problem': return ["Optimize this", "Find edge cases", "Alternative solution"];
        case 'idea': return ["Give me another option", "Make it cheaper", "How to market this"];
        default: return ["Tell me more"];
    }
}

function getSystemPrompt(mode: Mode, intent?: Intent): string {
    if (mode === 'developer') {
        const base = PROMPTS.developer.base;
        const specific = PROMPTS.developer[intent || 'general'] || "";
        return `${base}\n\n${specific}`;
    }
    return PROMPTS[mode] || PROMPTS.knowledge;
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json() as ChatRequestBody;

        if (!body) {
            return NextResponse.json({ error: "Empty request body" }, { status: 400 });
        }

        const { mode, intent, message, provider = 'gemini' } = body;

        console.log(`[API] AI Request: Mode=${mode}, Intent=${intent}, Provider=${provider}`);

        const systemPrompt = getSystemPrompt(mode, intent);
        let answer = "";

        // GEMINI
        if (provider === 'gemini') {
            if (!geminiApiKey) {
                console.error("Gemini API Key missing");
                return NextResponse.json({ error: "Gemini API Key missing on server" }, { status: 500 });
            }

            try {
                const genAI = new GoogleGenerativeAI(geminiApiKey);
                let modelName = "gemini-2.5-flash";

                const model = genAI.getGenerativeModel({
                    model: modelName,
                    systemInstruction: systemPrompt
                });

                const chat = model.startChat({
                    history: []
                });

                const result = await chat.sendMessage(message);
                answer = result.response.text();

            } catch (geminiError: any) {
                console.error("Gemini API Error details:", geminiError);
                return NextResponse.json({
                    error: "Gemini API Failed",
                    details: geminiError.message || JSON.stringify(geminiError)
                }, { status: 502 });
            }
        }

        // MISTRAL
        else if (provider === 'mistral') {
            if (!mistralApiKey) {
                return NextResponse.json({ error: "Mistral API Key missing on server" }, { status: 500 });
            }

            try {
                const client = new Mistral({ apiKey: mistralApiKey });
                const chatResponse = await client.chat.complete({
                    model: 'mistral-small-latest',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: message }
                    ]
                });
                answer = (chatResponse.choices && chatResponse.choices[0].message.content) as string || "";

            } catch (mistralError: any) {
                console.error("Mistral API Error:", mistralError);
                return NextResponse.json({
                    error: "Mistral API Failed",
                    details: mistralError.message || JSON.stringify(mistralError)
                }, { status: 502 });
            }
        }

        // UNKNOWN
        else {
            return NextResponse.json({ error: `Invalid Provider: ${provider}` }, { status: 400 });
        }

        // FORMATTING
        if (answer) {
            answer = answer.replace(/#\*\*/g, '**');
        }

        return NextResponse.json({
            mode,
            answer,
            followUps: getSuggestions(mode, intent),
            sources: []
        });

    } catch (error: any) {
        console.error("Critical Backend Error:", error);
        return NextResponse.json(
            { error: "Server Internal Error", details: error.message, stack: error.stack },
            { status: 500 }
        );
    }
}
