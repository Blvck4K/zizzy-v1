import { GoogleGenerativeAI } from "@google/generative-ai";
import { Mistral } from "@mistralai/mistralai";

export type UserMode = 'explorer' | 'developer';
export type AIProvider = 'gemini' | 'mistral';

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

const geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const mistralApiKey = process.env.NEXT_PUBLIC_MISTRAL_API_KEY;

// Initialize clients (lazy initialization or check inside function to avoid build errors if keys missing)
const genAI = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null;
const mistralClient = mistralApiKey ? new Mistral({ apiKey: mistralApiKey }) : null;

export async function* generateResponseStream(
    prompt: string,
    mode: UserMode,
    provider: AIProvider = 'gemini',
    history: ChatMessage[] = [],
    userName: string = "Friend"
): AsyncGenerator<string, void, unknown> {
    const lowerPrompt = prompt.toLowerCase();

    // 🛡️ ETHICS GUARDRAILS
    const ethicsTriggers = ['do my homework', 'write the full answer', 'complete my assignment', 'answers for exam'];
    const isEthicsViolation = ethicsTriggers.some(trigger => lowerPrompt.includes(trigger));

    if (isEthicsViolation) {
        yield "I can help you understand the concepts behind this assignment, but I can't complete it for you. \n\nLearning works best when you do the core thinking! Shall we break down the problem into smaller steps together? 🌱";
        return;
    }

    try {
        let systemPrompt = "";
        if (mode === 'explorer') {
            systemPrompt = `You are Zizzy, a high-functioning general assistant (Explorer Mode). You are speaking to ${userName}. Your goal is to be a personable, helpful AI. Handle 'Real World' queries—history, current events, trivia, and general problem-solving. Maintain a conversational, engaging, and clear tone. Provide well-structured answers with facts and context. Use a 'Human-first' approach. Valid output: markdown.`;
        } else {
            systemPrompt = `You are Zizzy, an expert senior developer assistant (Developer Mode). You are speaking to ${userName}. Focus strictly on web development, management, system architecture, and optimization. Provide concise, technical, production-ready answers. adhere to clean-code principles. Skip small talk and focus on scalable solutions. Valid output: markdown.`;
        }

        // Dynamic Memory Instruction
        systemPrompt += ` Regardless of the mode, you must use Dynamic Memory. If the user asks a general question and then switches mode, relate to that context if relevant, but shift the vocabulary immediately to the current mode's standards. IMPORTANT: If the user says "hi", "hello", or "hi zizzy", you MUST respond with "Hi ${userName}, what would you like to do today?"`;

        if (provider === 'gemini') {
            if (!genAI) {
                yield "Error: Gemini API key is missing.";
                return;
            }
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

            const chat = model.startChat({
                history: history.map(msg => ({
                    role: msg.role === 'user' ? 'user' : 'model',
                    parts: [{ text: msg.content }]
                })),
                systemInstruction: systemPrompt
            });

            const result = await chat.sendMessageStream(prompt);

            for await (const chunk of result.stream) {
                const chunkText = chunk.text();
                yield chunkText;
            }
        }
        else if (provider === 'mistral') {
            if (!mistralClient) {
                yield "Error: Mistral API key is missing.";
                return;
            }

            const mistralMessages = [
                { role: 'system', content: systemPrompt },
                ...history.map(msg => ({ role: msg.role, content: msg.content })),
                { role: 'user', content: prompt }
            ];

            const chatStream = await mistralClient.chat.stream({
                model: 'mistral-tiny',
                messages: mistralMessages as any
            });

            for await (const chunk of chatStream) {
                const content = chunk.data.choices[0].delta.content;
                if (content) {
                    yield content as string;
                }
            }
        } else {
            yield "Error: Invalid provider selected.";
        }

    } catch (error: any) {
        console.error("AI Error:", error);
        yield `Sorry, I encountered an error connecting to ${provider}. Please check your API keys or try again later.`;
    }
}

// Keep the old function for backward compatibility if needed, or remove it. 
// Changing to strictly use the stream function in the UI.
export async function generateResponse(
    prompt: string,
    mode: UserMode,
    provider: AIProvider = 'gemini',
    history: ChatMessage[] = []
): Promise<string> {
    // Basic wrapper for non-streaming usage
    let fullText = "";
    for await (const chunk of generateResponseStream(prompt, mode, provider, history)) {
        fullText += chunk;
    }
    return fullText;
}
