

async function testVeo2() {
    try {
        console.log('Sending request to /api/veo2...');
        const response = await fetch('http://localhost:5173/api/veo2', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                prompt: 'A cyberpunk city with neon lights, cinematic 4k',
                aspectRatio: '16:9'
            })
        });

        console.log('Status:', response.status);
        const data = await response.json();
        console.log('Response:', JSON.stringify(data, null, 2));

    } catch (error) {
        console.error('Error:', error.message);
        if (error.code === 'ECONNREFUSED') {
            console.log('Server is likely not running on port 5173');
        }
    }
}

testVeo2();
