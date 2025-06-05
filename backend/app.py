# Import necessary libraries
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import logging
import jwt
import datetime
import os
from functools import wraps
import json
from pathlib import Path

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
# Allow CORS for frontend-backend communication, specifically from Vercel origin
CORS(app, origins=['https://local-lang-codes-1.vercel.app'])

# Secret key for JWT
app.config['SECRET_KEY'] = 'your-very-secret-key'  # Use a fixed secret key for consistent JWT

# User database file
USERS_DB_FILE = Path('users.json')
HISTORY_DB_FILE = Path('generation_history.json')

# Initialize users database
def init_users_db():
    if not USERS_DB_FILE.exists():
        with open(USERS_DB_FILE, 'w') as f:
            json.dump({}, f)

def load_users():
    init_users_db()
    with open(USERS_DB_FILE, 'r') as f:
        return json.load(f)

def save_users(users):
    with open(USERS_DB_FILE, 'w') as f:
        json.dump(users, f, indent=2)

# Initialize history database
def init_history_db():
    if not HISTORY_DB_FILE.exists():
        with open(HISTORY_DB_FILE, 'w') as f:
            json.dump({}, f)

def load_history():
    init_history_db()
    with open(HISTORY_DB_FILE, 'r') as f:
        return json.load(f)

def save_history(history):
    with open(HISTORY_DB_FILE, 'w') as f:
        json.dump(history, f, indent=2)

def add_to_history(email, generation_data):
    history = load_history()
    if email not in history:
        history[email] = []
    
    # Add timestamp to the generation data
    generation_data['timestamp'] = datetime.datetime.utcnow().isoformat()
    
    # Add to the beginning of the list (most recent first)
    history[email].insert(0, generation_data)
    
    # Keep only the last 10 generations
    history[email] = history[email][:10]
    
    save_history(history)

# JWT token required decorator
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        try:
            token = token.split(' ')[1]  # Remove 'Bearer ' prefix
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            users = load_users()
            current_user = users.get(data['email'])
            if not current_user:
                return jsonify({'error': 'Invalid token'}), 401
            
            # Add email to the current_user object before passing it
            current_user['email'] = data['email']

        except:
            return jsonify({'error': 'Invalid token'}), 401
        return f(current_user, *args, **kwargs)
    return decorated

# Get generation history route
@app.route('/history', methods=['GET'])
@token_required
def get_history(current_user):
    try:
        history = load_history()
        user_history = history.get(current_user['email'], [])
        return jsonify({'history': user_history})
    except Exception as e:
        logger.error(f"Error fetching history: {str(e)}")
        return jsonify({'error': 'Failed to fetch history'}), 500

# Signup route
@app.route('/signup', methods=['POST'])
def signup():
    try:
        data = request.json
        name = data.get('name')
        email = data.get('email')
        password = data.get('password')

        if not all([name, email, password]):
            return jsonify({'error': 'Missing required fields'}), 400

        users = load_users()
        
        # Check if user already exists
        if email in users:
            return jsonify({'error': 'Email already registered'}), 400

        # Create new user
        users[email] = {
            'name': name,
            'password': password  # In production, hash the password!
        }
        save_users(users)

        # Generate JWT token
        token = jwt.encode({
            'email': email,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }, app.config['SECRET_KEY'])

        return jsonify({
            'token': token,
            'user': {
                'email': email,
                'name': name
            }
        })
    except Exception as e:
        logger.error(f"Signup error: {str(e)}")
        return jsonify({'error': 'An error occurred during signup'}), 500

# Login route
@app.route('/login', methods=['POST'])
def login():
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return jsonify({'error': 'Missing email or password'}), 400

        users = load_users()
        user = users.get(email)
        
        if not user or user['password'] != password:  # In production, use proper password hashing!
            return jsonify({'error': 'Invalid email or password'}), 401

        # Generate JWT token
        token = jwt.encode({
            'email': email,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }, app.config['SECRET_KEY'])

        return jsonify({
            'token': token,
            'user': {
                'email': email,
                'name': user['name']
            }
        })
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return jsonify({'error': 'An error occurred during login'}), 500

# Get user data route
@app.route('/user', methods=['GET'])
@token_required
def get_user(current_user):
    try:
        return jsonify({
            'user': {
                'email': current_user['email'],
                'name': current_user['name']
            }
        })
    except Exception as e:
        logger.error(f"Error fetching user data: {str(e)}")
        return jsonify({'error': 'Failed to fetch user data'}), 500

# API Keys
SARVAM_API_KEY = 'sk_vyr4ze68_kzjm76DIOxG0dOQmmDDN1QMK'  # <-- your Sarvam API Key
GROQ_API_KEY = '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'  # <-- your Groq API Key

# Function: Translate using Sarvam
def translate_to_english(user_input, source_language_code):
    logger.info(f"Translating text: {user_input} from {source_language_code}")
    url = "https://api.sarvam.ai/translate"
    headers = {
        "api-subscription-key": SARVAM_API_KEY,
        "Content-Type": "application/json"
    }
    payload = {
        "input": user_input,
        "source_language_code": source_language_code,
        "target_language_code": "en-IN"
    }
    try:
        response = requests.post(url, headers=headers, json=payload)
        response_json = response.json()
        logger.info(f"Sarvam API Response: {response_json}")

        if response.status_code == 200 and 'translated_text' in response_json:
            return response_json['translated_text']
        else:
            logger.error(f"Translation failed: {response_json}")
            return "Translation Failed!"
    except Exception as e:
        logger.error(f"Translation error: {str(e)}")
        return "Translation Failed!"

# Function: Generate code using Groq (LLaMA 3 - 70B)
def generate_code(prompt):
    logger.info(f"Starting code generation for prompt: {prompt}")
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    data = {
        "model": "llama3-70b-8192",
        "messages": [
            {"role": "system", "content": "You are a helpful programming assistant. Generate clean, efficient, and well-documented code."},
            {"role": "user", "content": f"Write a Python code for: {prompt}. Include comments explaining the code."}
        ],
        "temperature": 0.7,
        "max_tokens": 2000
    }
    try:
        logger.info("Sending request to Groq API...")
        response = requests.post(url, headers=headers, json=data)
        logger.info(f"Groq API Response Status: {response.status_code}")
        
        if response.status_code != 200:
            logger.error(f"Groq API Error: {response.text}")
            return f"Error: API returned status code {response.status_code}"
            
        response_json = response.json()
        logger.info(f"Groq API Response: {response_json}")

        if 'choices' in response_json and len(response_json['choices']) > 0:
            code_output = response_json['choices'][0]['message']['content']
            logger.info(f"Successfully generated code: {code_output[:100]}...")
            return code_output
        else:
            logger.error(f"Unexpected API response format: {response_json}")
            return f"Error: Unexpected API response format"
    except Exception as e:
        logger.error(f"Code generation error: {str(e)}", exc_info=True)
        return f"Error: {str(e)}"

# Function: Explain code in selected language
def explain_code(code, target_language):
    logger.info(f"Explaining code in {target_language}")
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    data = {
        "model": "llama3-70b-8192",
        "messages": [
            {"role": "user", "content": f"Explain the following code in {target_language} language:\n{code}"}
        ],
        "temperature": 0.7
    }
    try:
        response = requests.post(url, headers=headers, json=data)
        response_json = response.json()
        logger.info(f"Groq Explain API Response: {response_json}")

        if 'choices' in response_json:
            explanation = response_json['choices'][0]['message']['content']
            return explanation
        else:
            logger.error(f"Explanation failed: {response_json}")
            return f"Error: {response_json.get('error', {}).get('message', 'Unknown error')}"
    except Exception as e:
        logger.error(f"Explanation error: {str(e)}")
        return f"Error: {str(e)}"

# Main API Route
@app.route('/process', methods=['POST'])
# @token_required  # Temporarily removed for debugging
def process():  # Removed current_user argument
    try:
        data = request.json
        # Note: @token_required is temporarily removed for debugging. User info is not available.
        user_email = 'Unauthorized User' # Indicate request is unauthenticated
        logger.info(f"Incoming Request Data for user {user_email}: {data}")

        user_input = data.get('user_input')
        user_language_code = data.get('user_language_code')
        choice = data.get('choice')

        if not user_input or not user_language_code or not choice:
             logger.error(f"Missing required fields in process request from {user_email}")
             return jsonify({'error': 'Missing required input fields'}), 400

        logger.info(f"Processing request for user {user_email}: Input='{user_input}', Lang='{user_language_code}', Choice='{choice}'")

        translated_prompt = translate_to_english(user_input, user_language_code)
        
        if translated_prompt == "Translation Failed!":
            logger.error(f"Translation failed for user {user_email}")
            return jsonify({
                'error': 'Translation failed. Please try again.',
                'translatedPrompt': "Translation Failed!", # Use camelCase
                'codeOutput': None,
                'explanation': None
            }), 500

        logger.info(f"Translated Prompt for user {user_email}: {translated_prompt}")

        if choice == 'code':
            code_output = generate_code(translated_prompt)
            
            if code_output.startswith("Error:"):
                logger.error(f"Code generation failed for user {user_email}: {code_output}")
                return jsonify({
                    'error': f'Code generation failed: {code_output}',
                    'translatedPrompt': translated_prompt, # Use camelCase
                    'codeOutput': None,
                    'explanation': None
                }), 500

            logger.info(f"Code Output for user {user_email}: {code_output[:100]}...") # Log first 100 chars

            # Language Map
            language_map = {
                "ta-IN": "Tamil",
                "hi-IN": "Hindi",
                "te-IN": "Telugu",
                "ml-IN": "Malayalam",
                "bn-IN": "Bengali",
                "gu-IN": "Gujarati",
                "kn-IN": "Kannada",
                "mr-IN": "Marathi",
                "od-IN": "Odia",
                "pa-IN": "Punjabi",
            }
            selected_language = language_map.get(user_language_code, "English") # Default to English if language not mapped
            logger.info(f"Attempting to generate explanation for user {user_email} in: {selected_language}")

            explanation = explain_code(code_output, selected_language)
            
            if explanation and explanation.startswith("Error:"):
                 logger.warning(f"Explanation generation failed for user {user_email}: {explanation}. Proceeding without explanation.")
                 explanation = None # Send None explanation if it failed
            
            logger.info(f"Explanation for user {user_email}: {explanation[:100]}...") if explanation else logger.info(f"No explanation generated for user {user_email}.")

            return jsonify({
                'translatedPrompt': translated_prompt, # Use camelCase for consistency with frontend
                'codeOutput': code_output,             # Use camelCase
                'explanation': explanation
            })

        elif choice == 'website':
            # Example: Generate a simple HTML page using the translated prompt
            website_html = f"""
            <html>
              <head>
                <title>Generated Website</title>
                <meta charset='utf-8'>
                <style>
                  body {{ font-family: sans-serif; padding: 2rem; background: #f9f9f9; }}\n                  h1 {{ color: #2563eb; }}\n                </style>
              </head>
              <body>
                <h1>Website generated for:</h1>
                <p>{translated_prompt}</p>
              </body>
            </html>
            """
            # Note: You would integrate a website generation API here
            explanation = f'This website was generated based on your description: {translated_prompt}'
            logger.info(f"Website HTML (partial) for user {user_email}: {website_html[:100]}...")

            return jsonify({
                'translatedPrompt': translated_prompt, # Use camelCase
                'websiteHtml': website_html,           # Use camelCase
                'explanation': explanation
            })
            
        else:
            logger.error(f"Invalid choice received for user {user_email}: {choice}")
            return jsonify({'error': 'Invalid choice provided'}), 400

    except Exception as e:
        user_email = 'Unauthorized User' # In case exception happens before user is determined
        logger.error(f"Critical Process error for user {user_email}: {str(e)}", exc_info=True) # Log full traceback
        return jsonify({
            'error': f'An internal server error occurred: {str(e)}'
        }), 500

# Run server
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5007, debug=True)
