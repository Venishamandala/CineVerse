import urllib.request
import urllib.error
import json
import random

BASE_URL = "https://cineverse-1-sxvm.onrender.com/api"

def make_request(url, data=None, token=None, method="POST"):
    req = urllib.request.Request(url, method=method)
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
        
    post_data = None
    if data:
        post_data = json.dumps(data).encode("utf-8")
        
    try:
        with urllib.request.urlopen(req, data=post_data) as response:
            res_body = response.read().decode("utf-8")
            return response.status, json.loads(res_body)
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        try:
            parsed_err = json.loads(err_body)
        except:
            parsed_err = err_body
        return e.code, parsed_err
    except Exception as e:
        return 0, str(e)

def run_tests():
    random_num = random.randint(1000, 9999)
    test_user = {
        "name": f"Test User {random_num}",
        "email": f"testuser_{random_num}@example.com",
        "password": "Password123!",
        "confirmPassword": "Password123!"
    }
    
    print("1. Registering test user...")
    status, res = make_request(f"{BASE_URL}/auth/register", test_user)
    print(f"Status: {status}")
    print(f"Success key: {res.get('success')}")
    print(f"Token key exists: {bool(res.get('token'))}")
    print(f"User keys: {list(res.get('user', {}).keys())}\n")
    
    if status != 200 or not res.get("success"):
        print("Registration failed. Stopping tests.")
        return
        
    token = res.get("token")
    
    # 2. Querying user me profile
    print("2. Checking /auth/me profile...")
    status, res = make_request(f"{BASE_URL}/auth/me", token=token, method="GET")
    print(f"Status: {status}")
    print(f"Success key: {res.get('success')}")
    print(f"User keys: {list(res.get('user', {}).keys())}\n")
    
    # 3. Submitting onboarding preferences
    print("3. Submitting Onboarding Preferences to /users/preferences...")
    preferences_data = {
        "preferredLanguages": ["en", "hi"],
        "favoriteGenres": [28, 35]
    }
    status, res = make_request(f"{BASE_URL}/users/preferences", preferences_data, token=token)
    print(f"Status: {status}")
    print(f"Server response: {res}")

if __name__ == "__main__":
    run_tests()
