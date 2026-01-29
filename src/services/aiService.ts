import { GoogleGenerativeAI } from "@google/generative-ai";
import { Mistral } from "@mistralai/mistralai";

export type UserMode = 'explorer' | 'developer';
export type ExplorerIntent = 'knowledge' | 'problem' | 'idea';
export type AIProvider = 'gemini' | 'mistral';

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

const geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const mistralApiKey = process.env.NEXT_PUBLIC_MISTRAL_API_KEY;

// Initialize clients
const genAI = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null;
const mistralClient = mistralApiKey ? new Mistral({ apiKey: mistralApiKey }) : null;


// 🔍 SEARCH HELPERS
// Helper to extract domain from URL
function getDomain(url: string): string {
    try {
        const domain = new URL(url).hostname;
        return domain.replace('www.', '');
    } catch (e) {
        return url;
    }
}

async function performWebSearch(query: string): Promise<string> {
    try {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        const response = await fetch(`${baseUrl}/api/search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query })
        });

        if (!response.ok) return "Search failed.";

        const data = await response.json();
        if (!data.results || data.results.length === 0) return "No results found.";

        return data.results.map((r: any) => `Title: ${r.title}\nURL: ${r.url}\nContent: ${r.content}\n`).join('\n---\n');
    } catch (e) {
        console.error("Search request error:", e);
        return "Search unavailable.";
    }
}

async function checkSearchNecessity(
    prompt: string,
    history: ChatMessage[],
    provider: AIProvider
): Promise<{ needsSearch: boolean; searchQuery: string }> {
    // Fast check: if query is too short or clearly phatic, skip
    if (prompt.length < 5 || /^(hi|hello|hey|thanks|bye)/i.test(prompt)) {
        return { needsSearch: false, searchQuery: "" };
    }

    const verificationPrompt = `
    Analyze this user query: "${prompt}"
    Does it require real-time web search (news, current stats, events, specific libs updates) or is it a conceptual/coding question I can answer with internal knowledge?

    Rules:
    - NO search for: "Explain React hooks", "Write a python script", "What is history of Rome", "Optimize this code", "Philosophy".
    - YES search for: "Latest Next.js version", "Who won the game yesterday", "Stock price of Apple", "New features in Python 3.12", "Current weather".

    Return JSON ONLY: {"needsSearch": boolean, "searchQuery": "concise query"}
    `;

    try {
        let responseText = "";
        if (provider === 'gemini' && genAI) {
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", generationConfig: { responseMimeType: "application/json" } });
            const result = await model.generateContent(verificationPrompt);
            responseText = result.response.text();
        } else if (provider === 'mistral' && mistralClient) {
            const chatResponse = await mistralClient.chat.complete({
                model: 'mistral-small-latest',
                messages: [{ role: 'user', content: verificationPrompt }],
                responseFormat: { type: 'json_object' }
            });
            responseText = (chatResponse.choices && chatResponse.choices[0].message.content) as string || "";
        }

        const decision = JSON.parse(responseText);
        return {
            needsSearch: Boolean(decision.needsSearch),
            searchQuery: decision.searchQuery || prompt
        };
    } catch (e) {
        console.error("Search decision error:", e);
        return { needsSearch: false, searchQuery: "" };
    }
}

export interface AIImage {
    base64: string;
    mimeType: string;
}

export async function* generateResponseStream(
    prompt: string,
    mode: UserMode,
    intent: ExplorerIntent = 'knowledge',
    provider: AIProvider = 'gemini',
    history: ChatMessage[] = [],
    userName: string = "Friend",
    onStatusUpdate?: (status: string | null) => void,
    signal?: AbortSignal,
    images: AIImage[] = []
): AsyncGenerator<string, void, unknown> {

    // 🛡️ ETHICS GUARDRAILS (Client Side Fast Check)
    const lowerPrompt = prompt.toLowerCase();
    const ethicsTriggers = ['do my homework', 'write the full answer', 'complete my assignment', 'answers for exam'];
    if (ethicsTriggers.some(trigger => lowerPrompt.includes(trigger))) {
        yield "I can help you understand the concepts behind this assignment, but I can't complete it for you. \n\nLearning works best when you do the core thinking! Shall we break down the problem into smaller steps together? 🌱";
        return;
    }

    try {
        if (onStatusUpdate) onStatusUpdate("Consulting Zizzy Backend...");

        // Construct Payload
        // Note: Currently backend only takes mode/message. 
        // We map 'intent' to 'mode' in the backend payload as per requirements.
        // UserMode 'explorer' | 'developer' is high level.
        // ExplorerIntent 'knowledge' | 'problem' | 'idea' is granular.

        // Developer mode is locked for v1
        let backendMode = intent === 'problem' ? 'problem' : 'knowledge';

        // Handle Images - For V1 backend, we might skip images or need to send base64 in body
        // The implementation plan for backend didn't explicitly handle images JSON body yet
        // but we should pass them if we can. 
        // For this step, we'll focus on the text flow as primary.

        const response = await fetch('/api/ai/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                mode: backendMode,
                message: prompt,
                provider: provider // Pass the selected provider to backend
                // history: history // Can pass history if backend is updated to use it
            }),
            signal // Pass signal for abortion
        });

        if (!response.ok) {
            let errorMsg = `Server Error: ${response.status}`;
            try {
                const errorData = await response.json();
                if (errorData.details) {
                    errorMsg += ` - ${errorData.details}`;
                } else if (errorData.error) {
                    errorMsg += ` - ${errorData.error}`;
                }
            } catch (e) {
                // Ignore json parse error if body is empty or not json
            }
            throw new Error(errorMsg);
        }

        const data = await response.json();

        if (onStatusUpdate) onStatusUpdate(null);

        // Yield the answer
        if (data.answer) {
            yield data.answer;
        }

        // If data.followUps exists, we might want to expose it?
        // Currently the UI doesn't have a specific slot for "FollowUps" from the stream
        // except appended text.
        // We could append them lightly:
        if (data.followUps && data.followUps.length > 0) {
            // Optional: Appending suggestions to the message
            // yield `\n\n**Suggestions:**\n` + data.followUps.map(s => `- ${s}`).join('\n');
        }

    } catch (error: any) {
        if (error.name === 'AbortError') {
            return;
        }
        console.error("AI Service Error:", error);
        yield "Sorry, I'm having trouble connecting to the Zizzy brain right now. Please try again.";
    }
}

export async function generateResponse(
    prompt: string,
    mode: UserMode,
    intent: ExplorerIntent = 'knowledge',
    provider: AIProvider = 'gemini',
    history: ChatMessage[] = []
): Promise<string> {
    let fullText = "";
    for await (const chunk of generateResponseStream(prompt, mode, intent, provider, history)) {
        fullText += chunk;
    }
    return fullText;
}
