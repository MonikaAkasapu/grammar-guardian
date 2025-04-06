from flask import Flask, render_template, request, jsonify
import language_tool_python

app = Flask(__name__)

def calculate_grammar_score(text):
    tool = language_tool_python.LanguageTool('en-US')
    matches = tool.check(text)
    
    error_count = len(matches)
    word_count = len(text.split())
    score = max(0, 100 - (error_count / (word_count + 1)) * 100) if word_count > 0 else 100
    corrected_text = tool.correct(text)
    return score, matches, corrected_text

@app.route('/')
def index():
    return render_template('index.html')  # Flask will look in templates/index.html

@app.route('/analyze', methods=['POST'])
def analyze():
    try:
        data = request.json
        text = data['text']
        
        score, matches, corrected_text = calculate_grammar_score(text)
        
        feedback = []
        for match in matches[:5]:
            feedback.append({
                'message': match.message,
                'context': match.context,
                'replacements': match.replacements[:3]
            })
        
        return jsonify({
            'score': round(score, 1),
            'feedback': feedback,
            'error_count': len(matches),
            'corrected_text': corrected_text
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
