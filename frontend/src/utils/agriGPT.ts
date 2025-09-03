const FLOWISE_API_URL = import.meta.env.VITE_FLOWISE_API_URL!;

export async function getAgriQAAnswer(userMessage: string): Promise<string> {
  try {
    const response = await fetch(FLOWISE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ question: userMessage })
    });
    if (!response.ok) {
      const text = await response.text();
      console.error(`Flowise API error: HTTP ${response.status}: ${text}`);
      return `Sorry, AgriGPT API error: ${response.status}`;
    }
    const data = await response.json();
    return data.answer || "No response from AgriGPT.";
  } catch (err) {
    console.error("AgriGPT Error:", err);
    return "Sorry, something went wrong with AgriGPT.";
  }
}
