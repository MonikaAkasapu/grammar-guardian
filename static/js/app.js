const startBtn = document.getElementById('startBtn');
const statusDiv = document.getElementById('status');
const transcriptDiv = document.getElementById('transcript');
const resultsDiv = document.getElementById('results');
const scoreDiv = document.getElementById('score');
const feedbackDiv = document.getElementById('feedback');

let recognition;
let finalTranscript = '';

if ('webkitSpeechRecognition' in window) {
    recognition = new webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
        startBtn.classList.add('listening');
        statusDiv.textContent = 'Listening...';
    };

    recognition.onresult = (event) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                finalTranscript += transcript + ' ';
            } else {
                interimTranscript += transcript;
            }
        }
        transcriptDiv.innerHTML = finalTranscript + '<i style="color:#666">' + interimTranscript + '</i>';
    };

    recognition.onerror = (event) => {
        console.error(event.error);
        statusDiv.textContent = 'Error occurred: ' + event.error;
    };

    recognition.onend = () => {
        startBtn.classList.remove('listening');
        statusDiv.textContent = 'Click microphone to start recording';
        analyzeText(finalTranscript);
    };

    startBtn.addEventListener('click', () => {
        if (startBtn.classList.contains('listening')) {
            recognition.stop();
        } else {
            finalTranscript = '';
            transcriptDiv.textContent = '';
            resultsDiv.classList.remove('show-result');
            recognition.start();
        }
    });
} else {
    startBtn.disabled = true;
    statusDiv.textContent = 'Speech recognition not supported in this browser';
}

async function analyzeText(text) {
    try {
        const response = await fetch('/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text })
        });

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error);
        }

        resultsDiv.classList.add('show-result');
        scoreDiv.textContent = data.score;

        feedbackDiv.innerHTML = data.feedback.map(item => `
            <div class="list-group-item">
                <div class="fw-bold">${item.message}</div>
                <div class="text-muted">Context: "${item.context}"</div>
                ${item.replacements.length ? `Suggestions: ${item.replacements.join(', ')}` : ''}
            </div>
        `).join('');

    } catch (error) {
        console.error('Analysis error:', error);
        alert('Error analyzing text: ' + error.message);
    }
}
