const geminiKey = process.env.GEMINI_API_KEY;

async function testGemini() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${geminiKey}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log('Gemini HTTP Status:', res.status);
    if (!res.ok) {
      console.error('Gemini API Error Response:', data);
    } else {
      console.log('Gemini API OK! Models count:', data.models?.length);
      const flash = data.models?.find(m => m.name.includes('flash'));
      console.log('Sample model:', flash?.name);
    }
  } catch (err) {
    console.error('Gemini fetch catch:', err);
  }
}

testGemini();
