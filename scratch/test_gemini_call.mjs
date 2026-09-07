const apiKey = process.env.GEMINI_API_KEY;

async function testCall() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: 'Balas dengan satu kalimat ramah menyapa Pak Budi pedagang pasar.' }] }]
    })
  });
  const data = await res.json();
  console.log('Gemini 3.6 Flash response:', JSON.stringify(data, null, 2));
  console.log('\nGenerated Text:', data.candidates?.[0]?.content?.parts?.[0]?.text);
}

testCall();
