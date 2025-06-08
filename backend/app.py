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
CORS(app, origins=['https://local-lang-codes-1.vercel.app', 'http://localhost:5173'])

# Secret key for JWT
app.config['SECRET_KEY'] = 'your-very-secret-key'  # Use a fixed secret key for consistent JWT
TOKEN_EXPIRY = datetime.timedelta(hours=1)  # Token expires in 1 hour
REFRESH_TOKEN_EXPIRY = datetime.timedelta(days=7)  # Refresh token expires in 7 days

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

        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired', 'code': 'TOKEN_EXPIRED'}), 401
        except:
            return jsonify({'error': 'Invalid token'}), 401
        return f(current_user, *args, **kwargs)
    return decorated

# Token refresh route
@app.route('/refresh-token', methods=['POST'])
def refresh_token():
    try:
        refresh_token = request.json.get('refresh_token')
        if not refresh_token:
            logger.error("Refresh token is missing in request")
            return jsonify({'error': 'Refresh token is missing'}), 400

        try:
            # Verify the refresh token
            logger.info("Attempting to decode refresh token")
            data = jwt.decode(refresh_token, app.config['SECRET_KEY'], algorithms=["HS256"])
            email = data['email']
            
            # Check if user exists
            users = load_users()
            if email not in users:
                logger.error(f"User {email} not found during token refresh")
                return jsonify({'error': 'Invalid refresh token'}), 401

            # Generate new access token
            logger.info(f"Generating new access token for user {email}")
            new_token = jwt.encode({
                'email': email,
                'exp': datetime.datetime.utcnow() + TOKEN_EXPIRY
            }, app.config['SECRET_KEY'])

            # Generate new refresh token
            logger.info(f"Generating new refresh token for user {email}")
            new_refresh_token = jwt.encode({
                'email': email,
                'exp': datetime.datetime.utcnow() + REFRESH_TOKEN_EXPIRY
            }, app.config['SECRET_KEY'])

            logger.info(f"Token refresh successful for user {email}")
            return jsonify({
                'token': new_token,
                'refresh_token': new_refresh_token
            })

        except jwt.ExpiredSignatureError:
            logger.error("Refresh token has expired")
            return jsonify({'error': 'Refresh token has expired', 'code': 'REFRESH_TOKEN_EXPIRED'}), 401
        except jwt.InvalidTokenError as e:
            logger.error(f"Invalid refresh token: {str(e)}")
            return jsonify({'error': 'Invalid refresh token'}), 401
        except Exception as e:
            logger.error(f"Unexpected error during token refresh: {str(e)}")
            return jsonify({'error': 'Invalid refresh token'}), 401

    except Exception as e:
        logger.error(f"Token refresh error: {str(e)}")
        return jsonify({'error': 'An error occurred during token refresh'}), 500

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
            'exp': datetime.datetime.utcnow() + TOKEN_EXPIRY
        }, app.config['SECRET_KEY'])

        # Generate refresh token
        refresh_token = jwt.encode({
            'email': email,
            'exp': datetime.datetime.utcnow() + REFRESH_TOKEN_EXPIRY
        }, app.config['SECRET_KEY'])

        return jsonify({
            'token': token,
            'refresh_token': refresh_token,
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
            'exp': datetime.datetime.utcnow() + TOKEN_EXPIRY
        }, app.config['SECRET_KEY'])

        # Generate refresh token
        refresh_token = jwt.encode({
            'email': email,
            'exp': datetime.datetime.utcnow() + REFRESH_TOKEN_EXPIRY
        }, app.config['SECRET_KEY'])

        return jsonify({
            'token': token,
            'refresh_token': refresh_token,
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
GROQ_API_KEY = os.environ.get('GROQ_API_KEY', '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') # Using environment variable for API Key

# Function: Translate using Sarvam
def translate_to_english(user_input, source_language_code):
    logger.info(f"Translating text: {user_input} from {source_language_code}")
    url = "https://api.sarvam.ai/translate"
    headers = {
        "api-subscription-key": SARVAM_API_KEY,
        "Content-Type": "application/json"
    }
    # Convert language code to Sarvam format if needed
    source_code = source_language_code.split('-')[0] if '-' in source_language_code else source_language_code
    payload = {
        "input": user_input,
        "source_language_code": source_code,
        "target_language_code": "en"
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

# Function: Generate App Plan using Groq
def generate_app_plan_from_prompt(prompt):
    logger.info(f"Starting app plan generation for prompt: {prompt}")
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    data = {
        "model": "llama3-70b-8192",
        "messages": [
            {"role": "system", "content": "You are an AI assistant specialized in creating detailed application blueprints in markdown format. Provide a clear structure including sections like Introduction, Features, Technologies, Architecture, and rough steps for implementation. The plan should be comprehensive and easy to understand."},
            {"role": "user", "content": f"Create an app plan for: {prompt}. Provide the output in markdown format."}
        ],
        "temperature": 0.7,
        "max_tokens": 2000
    }
    try:
        logger.info("Sending request to Groq API for app plan...")
        response = requests.post(url, headers=headers, json=data)
        logger.info(f"Groq API App Plan Response Status: {response.status_code}")

        if response.status_code != 200:
            logger.error(f"Groq API App Plan Error: {response.text}")
            return f"Error: API returned status code {response.status_code} - {response.text}"

        response_json = response.json()
        logger.info(f"Groq API App Plan Response: {response_json}")

        if 'choices' in response_json and len(response_json['choices']) > 0:
            app_plan_output = response_json['choices'][0]['message']['content']
            logger.info(f"Successfully generated app plan: {app_plan_output[:100]}...")
            return app_plan_output
        else:
            logger.error(f"Unexpected API response format for app plan: {response_json}")
            return "Error: Unexpected API response format for app plan"
    except Exception as e:
        logger.error(f"App plan generation error: {str(e)}", exc_info=True)
        return f"Error: {str(e)}"

# Function: Generate Code from App Plan using Groq
def generate_code_from_plan_text(app_plan_text):
    logger.info(f"Starting code generation from app plan")
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    data = {
        "model": "llama3-70b-8192",
        "messages": [
            {"role": "system", "content": "You are an AI assistant specialized in generating code based on a provided application plan. Write the code based on the detailed blueprint. Provide clear and concise code."},
            {"role": "user", "content": f"Generate code based on the following app plan:\n\n{app_plan_text}"}
        ],
        "temperature": 0.7,
        "max_tokens": 4000  # Allow more tokens for code generation
    }
    try:
        logger.info("Sending request to Groq API for code from plan...")
        response = requests.post(url, headers=headers, json=data)
        logger.info(f"Groq API Code from Plan Response Status: {response.status_code}")

        if response.status_code != 200:
            logger.error(f"Groq API Code from Plan Error: {response.text}")
            return f"Error: API returned status code {response.status_code} - {response.text}", None

        response_json = response.json()
        logger.info(f"Groq API Code from Plan Response: {response_json}")

        if 'choices' in response_json and len(response_json['choices']) > 0:
            code_output = response_json['choices'][0]['message']['content']
            # For simplicity, let's assume the explanation is part of the code comment or we generate a simple one
            # A more advanced approach would be to make another API call for explanation if needed.
            explanation = "Code generated based on the provided app plan." # Simple placeholder explanation
            logger.info(f"Successfully generated code from plan: {code_output[:100]}...")
            return code_output, explanation
        else:
            logger.error(f"Unexpected API response format for code from plan: {response_json}")
            return "Error: Unexpected API response format for code from plan", None
    except Exception as e:
        logger.error(f"Code generation from plan error: {str(e)}", exc_info=True)
        return f"Error: {str(e)}", None

# Function: Translate from English using Sarvam
def translate_from_english(text, target_language_code):
    logger.info(f"Translating text from English to {target_language_code}")
    url = "https://api.sarvam.ai/translate"
    headers = {
        "api-subscription-key": SARVAM_API_KEY,
        "Content-Type": "application/json"
    }
    # Convert language code to Sarvam format if needed
    target_code = target_language_code.split('-')[0] if '-' in target_language_code else target_language_code
    payload = {
        "input": text,
        "source_language_code": "en",
        "target_language_code": target_code
    }
    try:
        response = requests.post(url, headers=headers, json=payload)
        response_json = response.json()
        logger.info(f"Sarvam API Translate from English Response: {response_json}")

        if response.status_code == 200 and 'translated_text' in response_json:
            return response_json['translated_text']
        else:
            logger.error(f"Translation from English failed: {response_json}")
            return "Translation Failed!"
    except Exception as e:
        logger.error(f"Translation from English error: {str(e)}")
        return "Translation Failed!"

# Main API Route
@app.route('/process', methods=['POST'])
# @token_required  # Temporarily removed for debugging
def process():  # Removed current_user argument
    try:
        data = request.json
        # Note: @token_required is temporarily removed for debugging. User info is not available.
        user_email = 'Unauthorized User' # Indicate request is unauthenticated
        # Use current_user email if available, otherwise use a placeholder
        # user_email = current_user.get('email', 'Unauthorized User') # Uncomment when @token_required is back
        logger.info(f"Incoming Request Data for user {user_email}: {data}")

        user_input = data.get('user_input')
        user_language_code = data.get('user_language_code')
        choice = data.get('choice')

        if not user_input or not user_language_code or not choice:
             logger.error(f"Missing required fields in process request from {user_email}")
             return jsonify({'error': 'Missing required input fields'}), 400

        logger.info(f"Processing request for user {user_email}: Input='{user_input}', Lang='{user_language_code}', Choice='{choice}'")

        # Translate user input to English for Groq (assuming Groq works best with English prompts)
        translated_prompt = translate_to_english(user_input, user_language_code)

        if translated_prompt == "Translation Failed!":
            logger.error(f"Translation of input failed for user {user_email}")
            return jsonify({
                'error': 'Input translation failed. Please try again.',
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

            # Generate explanation (likely in English from Groq)
            explanation_english = explain_code(code_output, "English") # Request explanation in English

            explanation = None # Initialize explanation in target language

            if explanation_english and not explanation_english.startswith("Error:"):
                 # Translate the English explanation to the user's selected language
                 # Only translate if the user's language is not English
                 if user_language_code != 'en-US': # Assuming 'en-US' is English code
                     explanation = translate_from_english(explanation_english, user_language_code)
                     if explanation == "Translation Failed!":
                          logger.warning(f"Explanation translation failed for user {user_email}. Providing English explanation.")
                          explanation = explanation_english # Fallback to English explanation if translation fails
                 else:
                     explanation = explanation_english # Use English explanation if user selected English
            else:
                 logger.warning(f"English Explanation generation failed for user {user_email}. No explanation available.")
                 explanation = None # No explanation if English generation failed


            logger.info(f"Final Explanation for user {user_email}: {explanation[:100]}...") if explanation else logger.info(f"No explanation generated for user {user_email}.")

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

# Generate App Plan route
@app.route('/generate_app_plan', methods=['POST'])
@token_required
def generate_app_plan_route(current_user):
    try:
        data = request.json
        user_input = data.get('user_input')
        user_language_code = data.get('user_language_code')

        if not user_input or not user_language_code:
            return jsonify({'error': 'Missing user_input or user_language_code'}), 400

        logger.info(f"Received request to generate app plan for user {current_user['email']}: Input='{user_input}', Lang='{user_language_code}'")

        # Translate input if not English (assuming Groq works best with English prompts)
        # Note: You might need to adjust the logic if Sarvam API is only for target language translation
        # For simplicity, assuming we translate user_input to English for the Groq prompt
        translated_prompt = translate_to_english(user_input, user_language_code) if user_language_code != 'en-US' else user_input # Assuming 'en-US' is English code

        if translated_prompt.startswith("Translation Failed!"):
             return jsonify({
                'error': 'Translation failed. Cannot generate app plan.',
                'translatedPrompt': translated_prompt,
                'appPlanOutput': None
            }), 500

        app_plan_output = generate_app_plan_from_prompt(translated_prompt)

        if app_plan_output.startswith("Error:"):
            logger.error(f"App plan generation failed for user {current_user['email']}: {app_plan_output}")
            return jsonify({
                'error': f'App plan generation failed: {app_plan_output}',
                'translatedPrompt': translated_prompt,
                'appPlanOutput': None
            }), 500

        # Add generated app plan to history (optional, but good for tracking)
        # add_to_history(current_user['email'], {'type': 'app_plan', 'input': user_input, 'output': app_plan_output})

        return jsonify({
            'translatedPrompt': translated_prompt, # Send the translated prompt back
            'appPlanOutput': app_plan_output
        })
    except Exception as e:
        logger.error(f"Error in generate_app_plan_route for user {current_user['email']}: {str(e)}", exc_info=True)
        return jsonify({'error': 'An internal error occurred during app plan generation'}), 500

# Generate Code from App Plan route
@app.route('/generate-code-from-plan', methods=['POST'])
def generate_code_from_plan():
    try:
        data = request.json
        app_plan_text = data.get('app_plan_text')
        user_language_code = data.get('user_language_code', 'en')  # Default to English if not specified
        
        if not app_plan_text:
            return jsonify({'error': 'App plan text is required'}), 400

        # First, translate the app plan to English for the AI
        translated_plan = translate_to_english(app_plan_text, user_language_code)
        
        # Generate code using the translated plan
        code_prompt = f"""Based on this app plan, generate a complete, production-ready code implementation. 
        Include all necessary files, dependencies, and setup instructions.
        The code should be well-documented and follow best practices.
        
        App Plan:
        {translated_plan}
        
        Please provide:
        1. A complete codebase structure
        2. All necessary files with their contents
        3. Setup instructions
        4. Dependencies list
        5. A brief explanation of the implementation
        
        Format the response as a JSON object with the following structure:
        {{
            "code_output": "The complete code implementation",
            "explanation": "A brief explanation of the implementation"
        }}"""

        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"},
            json={"model": "gpt-4", "messages": [{"role": "user", "content": code_prompt}], "temperature": 0.7, "max_tokens": 4000}
        )

        code_output = response.json()['choices'][0]['message']['content']

        # Parse the JSON response
        try:
            code_data = json.loads(code_output)
            explanation = code_data.get('explanation', '')
            
            # Translate the explanation from English to user's language
            translated_explanation = translate_from_english(explanation, user_language_code)
            
            return jsonify({
                'code_output': code_data.get('code_output', ''),
                'explanation': translated_explanation
            })
        except json.JSONDecodeError:
            # If JSON parsing fails, return the raw output
            return jsonify({
                'code_output': code_output,
                'explanation': translate_from_english('Generated code implementation', user_language_code)
            })

    except Exception as e:
        logger.error(f"Error in generate_code_from_plan: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Run server
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5007, debug=True)
