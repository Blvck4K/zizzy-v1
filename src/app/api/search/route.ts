import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { query, max_results = 5 } = await req.json();

        if (!query) {
            return NextResponse.json({ error: 'Query is required' }, { status: 400 });
        }

        const apiKey = process.env.TAVILY_API_KEY;

        if (!apiKey) {
            console.warn("Tavily API Key is missing. Returning mock results for testing.");
            // Fallback for when no key is present - crucial for not breaking the app immediately
            // In a real scenario, this might return an error, but for smooth dev UX we'll hint it.
            return NextResponse.json({
                results: [
                    {
                        title: "Search Unavailable (Missing API Key)",
                        url: "https://tavily.com",
                        content: "The search service is currently unavailable because the TAVILY_API_KEY environment variable is not set. Please add it to your .env.local file to enable real web search."
                    }
                ]
            });
        }

        const response = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                api_key: apiKey,
                query,
                search_depth: "basic",
                include_answer: false,
                include_images: false,
                include_raw_content: false,
                max_results: max_results,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Tavily API Error:", errorData);
            throw new Error(`Search provider error: ${response.statusText}`);
        }

        const data = await response.json();

        // Tavily returns { results: [...] }
        return NextResponse.json({ results: data.results });

    } catch (error: any) {
        console.error('Search API Error:', error);
        return NextResponse.json(
            { error: 'Failed to perform search', details: error.message },
            { status: 500 }
        );
    }
}
