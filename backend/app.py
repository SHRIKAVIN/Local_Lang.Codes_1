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
# Allow CORS for frontend-backend communication
CORS(app, origins=['https://local-lang-codes-1.vercel.app', 'http://localhost:5173'])

# Secret key for JWT (should be stored in environment variables in production)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your-very-secret-key')
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
            
            # Add email to the current_user object
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

        # Create new user (Note: In production, hash the password!)
        users[email] = {
            'name': name,
            'password': password  # Use bcrypt or similar for password hashing
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

# API Keys (should be stored in environment variables)
SARVAM_API_KEY = os.environ.get('SARVAM_API_KEY', 'sk_vyr4ze68_kzjm76DIOxG0dOQmmDDN1QMK')
GROQ_API_KEY = os.environ.get('GROQ_API_KEY', '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')

# Function: Translate using Sarvam
def translate_to_english(user_input, source_language_code):
    logger.info(f"Translating text: {user_input[:100]}... from {source_language_code}")
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

# Function: Translate from English using Sarvam
def translate_from_english(text, target_language_code):
    logger.info(f"Translating text from English to {target_language_code}")
    url = "https://api.sarvam.ai/translate"
    headers = {
        "api-subscription-key": SARVAM_API_KEY,
        "Content-Type": "application/json"
    }
    payload = {
        "input": text,
        "source_language_code": "en-IN",
        "target_language_code": target_language_code
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

# Function: Generate code using Groq (LLaMA 3 - 70B)
def generate_code(prompt):
    logger.info(f"Starting code generation for prompt: {prompt[:100]}...")
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
            {"role": "system", "content": f"You are a helpful programming assistant. Provide a clear and concise explanation of the code in {target_language}."},
            {"role": "user", "content": f"Explain the following code:\n{code}"}
        ],
        "temperature": 0.7,
        "max_tokens": 1000
    }
    try:
        response = requests.post(url, headers=headers, json=data)
        response_json = response.json()
        logger.info(f"Groq Explain API Response: {response_json}")

        if 'choices' in response_json and len(response_json['choices']) > 0:
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
    logger.info(f"Starting app plan generation for prompt: {prompt[:100]}...")
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
        "max_tokens": 4000
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

        # Check for error in response
        if 'error' in response_json:
            error_message = response_json['error'].get('message', 'Unknown error')
            logger.error(f"Groq API Error: {error_message}")
            return f"Error: {error_message}", None

        # Check for choices in response
        if 'choices' not in response_json or not response_json['choices']:
            logger.error(f"Unexpected API response format: {response_json}")
            return "Error: No choices in API response", None

        code_output = response_json['choices'][0]['message']['content']
        explanation = "Code generated based on the provided app plan."
        logger.info(f"Successfully generated code from plan: {code_output[:100]}...")
        return code_output, explanation

    except Exception as e:
        logger.error(f"Code generation from plan error: {str(e)}", exc_info=True)
        return f"Error: {str(e)}", None

# Main API Route
@app.route('/process', methods=['POST'])
@token_required
def process(current_user):
    try:
        data = request.json
        user_email = current_user.get('email', 'Unauthorized User')
        logger.info(f"Incoming Request Data for user {user_email}: {data}")

        user_input = data.get('user_input')
        user_language_code = data.get('user_language_code')
        choice = data.get('choice')

        if not user_input or not user_language_code or not choice:
            logger.error(f"Missing required fields in process request from {user_email}")
            return jsonify({'error': 'Missing required input fields'}), 400

        logger.info(f"Processing request for user {user_email}: Input='{user_input}', Lang='{user_language_code}', Choice='{choice}'")

        # Translate user input to English for Groq
        translated_prompt = translate_to_english(user_input, user_language_code)

        if translated_prompt == "Translation Failed!":
            logger.error(f"Translation of input failed for user {user_email}")
            return jsonify({
                'error': 'Input translation failed. Please try again.',
                'translatedPrompt': translated_prompt,
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
                    'translatedPrompt': translated_prompt,
                    'codeOutput': None,
                    'explanation': None
                }), 500

            logger.info(f"Code Output for user {user_email}: {code_output[:100]}...")

            # Generate explanation in the user's native language
            explanation = explain_code(code_output, user_language_code)

            if explanation.startswith("Error:"):
                logger.warning(f"Explanation generation failed for user {user_email}: {explanation}")
                # Fallback to English explanation
                explanation = explain_code(code_output, "English")
                if explanation.startswith("Error:"):
                    logger.warning(f"English explanation also failed for user {user_email}: {explanation}")
                    explanation = "Unable to generate explanation due to an error."

            logger.info(f"Final Explanation for user {user_email}: {explanation[:100] if explanation else 'No explanation'}...")

            # Save to history
            add_to_history(user_email, {
                'type': 'code',
                'input': user_input,
                'translatedPrompt': translated_prompt,
                'codeOutput': code_output,
                'explanation': explanation,
                'languageCode': user_language_code
            })

            return jsonify({
                'translatedPrompt': translated_prompt,
                'codeOutput': code_output,
                'explanation': explanation
            })

        elif choice == 'website':
            website_html = f"""
            <html>
              <head>
                <title>Generated Website</title>
                <meta charset='utf-8'>
                <style>
                  body {{ font-family: sans-serif; padding: 2rem; background: #f9f9f9; }}
                  h1 {{ color: #2563eb; }}
                </style>
              </head>
              <body>
                <h1>Website generated for:</h1>
                <p>{translated_prompt}</p>
              </body>
            </html>
            """
            # Translate explanation to user's language
            explanation_english = f'This website was generated based on your description: {translated_prompt}'
            explanation = translate_from_english(explanation_english, user_language_code) if user_language_code != 'en-US' else explanation_english

            if explanation == "Translation Failed!":
                logger.warning(f"Website explanation translation failed for user {user_email}. Using English.")
                explanation = explanation_english

            # Save to history
            add_to_history(user_email, {
                'type': 'website',
                'input': user_input,
                'translatedPrompt': translated_prompt,
                'websiteHtml': website_html,
                'explanation': explanation,
                'languageCode': user_language_code
            })

            return jsonify({
                'translatedPrompt': translated_prompt,
                'websiteHtml': website_html,
                'explanation': explanation
            })

        else:
            logger.error(f"Invalid choice received for user {user_email}: {choice}")
            return jsonify({'error': 'Invalid choice provided'}), 400

    except Exception as e:
        logger.error(f"Critical Process error for user {user_email}: {str(e)}", exc_info=True)
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

        # Translate input if not English
        translated_prompt = translate_to_english(user_input, user_language_code) if user_language_code != 'en-US' else user_input

        if translated_prompt == "Translation Failed!":
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

        # Save to history
        add_to_history(current_user['email'], {
            'type': 'app_plan',
            'input': user_input,
            'translatedPrompt': translated_prompt,
            'appPlanOutput': app_plan_output,
            'languageCode': user_language_code
        })

        return jsonify({
            'translatedPrompt': translated_prompt,
            'appPlanOutput': app_plan_output
        })
    except Exception as e:
        logger.error(f"Error in generate_app_plan_route for user {current_user['email']}: {str(e)}", exc_info=True)
        return jsonify({'error': 'An internal error occurred during app plan generation'}), 500

# Generate Code from App Plan route
@app.route('/generate-code-from-plan', methods=['POST'])
@token_required
def generate_code_from_plan(current_user):
    try:
        data = request.json
        app_plan_text = data.get('app_plan_text')
        user_language_code = data.get('user_language_code', 'en-US')

        if not app_plan_text:
            logger.error(f"Missing app_plan_text for user {current_user['email']}")
            return jsonify({'error': 'App plan text is required'}), 400

        logger.info(f"Generating code from app plan for user {current_user['email']}, language: {user_language_code}")

        # Check input length for Sarvam API
        if len(app_plan_text) > 2000:
            logger.warning(f"App plan text for user {current_user['email']} exceeds 2000 characters ({len(app_plan_text)}). Truncating.")
            app_plan_text = app_plan_text[:2000]

        # Translate the app plan to English for Groq
        translated_plan = translate_to_english(app_plan_text, user_language_code) if user_language_code != 'en-US' else app_plan_text

        if translated_plan == "Translation Failed!":
            logger.error(f"Translation of app plan failed for user {current_user['email']}")
            return jsonify({
                'error': 'Translation of app plan failed. Please try again.',
                'codeOutput': None,
                'explanation': None
            }), 500

        code_output, explanation_english = generate_code_from_plan_text(translated_plan)

        if code_output.startswith("Error:"):
            logger.error(f"Code generation from plan failed for user {current_user['email']}: {code_output}")
            return jsonify({
                'error': f'Code generation failed: {code_output}',
                'codeOutput': None,
                'explanation': None
            }), 500

        # Translate explanation to user's language
        explanation = translate_from_english(explanation_english, user_language_code) if user_language_code != 'en-US' else explanation_english

        if explanation == "Translation Failed!":
            logger.warning(f"Code explanation translation failed for user {current_user['email']}. Using English.")
            explanation = explanation_english

        # Save to history
        add_to_history(current_user['email'], {
            'type': 'code_from_plan',
            'input': app_plan_text,
            'translatedPlan': translated_plan,
            'codeOutput': code_output,
            'explanation': explanation,
            'languageCode': user_language_code
        })

        return jsonify({
            'codeOutput': code_output,
            'explanation': explanation
        })

    except Exception as e:
        logger.error(f"Error in generate_code_from_plan for user {current_user['email']}: {str(e)}", exc_info=True)
        return jsonify({'error': f'An internal error occurred: {str(e)}'}), 500

# Run server
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5007, debug=True)