#!/usr/bin/env python3
"""
Fantrax API Test Script
This script tests the fantraxapi wrapper with a specific league ID using email/password authentication
"""

import sys
import os
import getpass
import requests
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Check if running in a virtual environment, if not create one
if not os.environ.get('VIRTUAL_ENV'):
    print("Setting up virtual environment...")
    os.system('python3 -m venv venv')
    if sys.platform == 'win32':
        os.system('venv\\Scripts\\pip install fantraxapi python-dotenv requests')
        print("Please run: venv\\Scripts\\python fantrax_test.py")
    else:
        os.system('./venv/bin/pip install fantraxapi python-dotenv requests')
        print("Please run: ./venv/bin/python fantrax_test.py")
    sys.exit(0)

try:
    from fantraxapi import FantraxAPI
except ImportError:
    print("Installing required packages...")
    os.system(f'{sys.executable} -m pip install fantraxapi python-dotenv requests')
    from fantraxapi import FantraxAPI

def login_to_fantrax(email, password):
    """Login to Fantrax and get a session"""
    session = requests.Session()
    
    # Login to Fantrax
    login_data = {
        'email': email,
        'password': password,
        'rememberMe': True
    }
    
    try:
        login_response = session.post(
            'https://www.fantrax.com/api/v3/users/login', 
            json=login_data,
            headers={
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        )
        
        if login_response.status_code == 200:
            print("Login successful!")
            return session
        else:
            print(f"Login failed: {login_response.status_code} - {login_response.text}")
            return None
    except Exception as e:
        print(f"Login error: {str(e)}")
        return None

def test_fantrax_api(league_id, email=None, password=None):
    """Test the Fantrax API with the given league ID and credentials"""
    print(f"Testing Fantrax API with league ID: {league_id}")
    
    # Get credentials from environment variables or prompt user
    if not email:
        email = os.environ.get('FANTRAX_EMAIL')
        if not email:
            email = input("Enter your Fantrax email: ")
    
    if not password:
        password = os.environ.get('FANTRAX_PASSWORD')
        if not password:
            password = getpass.getpass("Enter your Fantrax password: ")
    
    try:
        # Login to Fantrax
        print("\nLogging in to Fantrax...")
        session = login_to_fantrax(email, password)
        
        if not session:
            print("Login failed. Please check your credentials.")
            return
        
        # Initialize the API with the league ID and session
        api = FantraxAPI(league_id, session=session)
        
        # Get basic league info
        print("\n=== League Information ===")
        print(f"League ID: {api.league_id}")
        
        # Get teams
        print("\n=== Teams ===")
        for i, team in enumerate(api.teams, 1):
            print(f"{i}. {team.name} (ID: {team.id})")
        
        # Get scoring periods
        print("\n=== Scoring Periods ===")
        periods = api.scoring_periods()
        for period_num, period in list(periods.items())[:5]:  # Show first 5 periods
            print(f"Period {period_num}: {period}")
        
        # Get standings
        print("\n=== Standings ===")
        standings = api.standings()
        for i, team in enumerate(standings.teams, 1):
            record = team.record
            print(f"{i}. {team.name}: {record.wins}-{record.losses}-{record.ties}")
        
        print("\nAPI test completed successfully!")
        
    except Exception as e:
        print(f"Error testing Fantrax API: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    # League ID to test
    LEAGUE_ID = "vehodfr1m8ne179d"
    
    # Get email and password from command line arguments if provided
    email = None
    password = None
    
    if len(sys.argv) > 1:
        email = sys.argv[1]
    if len(sys.argv) > 2:
        password = sys.argv[2]
    
    test_fantrax_api(LEAGUE_ID, email, password)
