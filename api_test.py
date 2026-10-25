import requests
import sys
import json
from datetime import datetime

class TruthLensAPITester:
    def __init__(self, base_url="https://credibility-check-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.analysis_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, timeout=30):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=timeout)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=timeout)

            print(f"Status Code: {response.status_code}")
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"Response keys: {list(response_data.keys()) if isinstance(response_data, dict) else 'Non-dict response'}")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"Error details: {error_detail}")
                except:
                    print(f"Response text: {response.text[:200]}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        success, response = self.run_test(
            "Root API Endpoint",
            "GET",
            "",
            200
        )
        return success

    def test_text_analysis(self):
        """Test text analysis functionality"""
        sample_text = """
        Breaking: Scientists Discover Revolutionary Cancer Treatment That Big Pharma Doesn't Want You to Know About!
        
        In a shocking turn of events, researchers at a small university have allegedly found a cure for cancer using common household items. The pharmaceutical industry is reportedly trying to suppress this information to protect their profits.
        
        This groundbreaking discovery could change everything we know about medicine, but mainstream media refuses to cover it. The treatment involves a simple combination of ingredients that costs less than $5.
        """
        
        success, response = self.run_test(
            "Text Analysis",
            "POST",
            "analyze",
            200,
            data={
                "input_type": "text",
                "content": sample_text
            },
            timeout=60  # AI analysis might take longer
        )
        
        if success and response:
            self.analysis_id = response.get('id')
            print(f"Analysis ID: {self.analysis_id}")
            print(f"Trust Score: {response.get('trust_score')}")
            print(f"Bias Level: {response.get('bias_level')}")
            print(f"Bias Label: {response.get('bias_label')}")
            
            # Validate response structure
            required_fields = ['id', 'trust_score', 'bias_level', 'bias_label', 'key_findings', 'highlights', 'credibility_notes']
            missing_fields = [field for field in required_fields if field not in response]
            if missing_fields:
                print(f"⚠️  Missing fields in response: {missing_fields}")
                return False
                
        return success

    def test_url_analysis(self):
        """Test URL analysis functionality"""
        # Using a real BBC news article
        test_url = "https://www.bbc.com/news/articles/c9873dve3g4o"
        
        success, response = self.run_test(
            "URL Analysis",
            "POST",
            "analyze",
            200,
            data={
                "input_type": "url",
                "content": test_url
            },
            timeout=60  # Scraping + AI analysis might take longer
        )
        
        if success and response:
            print(f"Headline: {response.get('headline', 'No headline')}")
            print(f"Trust Score: {response.get('trust_score')}")
            print(f"Bias Level: {response.get('bias_level')}")
            
            # For URL analysis, we should have a headline
            if not response.get('headline'):
                print("⚠️  No headline extracted from URL")
                
        return success

    def test_history_endpoint(self):
        """Test history retrieval"""
        success, response = self.run_test(
            "History Endpoint",
            "GET",
            "history",
            200
        )
        
        if success and response:
            if isinstance(response, list):
                print(f"History items count: {len(response)}")
                if len(response) > 0:
                    print(f"Latest analysis timestamp: {response[0].get('timestamp')}")
                    # Check if our previous analysis is in history
                    if self.analysis_id:
                        found = any(item.get('id') == self.analysis_id for item in response)
                        print(f"Previous analysis found in history: {found}")
            else:
                print("⚠️  History response is not a list")
                return False
                
        return success

    def test_invalid_requests(self):
        """Test error handling"""
        print("\n🔍 Testing Error Handling...")
        
        # Test empty content
        success, _ = self.run_test(
            "Empty Content Error",
            "POST",
            "analyze",
            400,
            data={
                "input_type": "text",
                "content": ""
            }
        )
        
        # Test invalid URL
        success2, _ = self.run_test(
            "Invalid URL Error",
            "POST",
            "analyze",
            400,
            data={
                "input_type": "url",
                "content": "not-a-valid-url"
            }
        )
        
        return success and success2

def main():
    print("🚀 Starting TruthLens API Testing...")
    print("=" * 50)
    
    tester = TruthLensAPITester()
    
    # Run all tests
    tests = [
        tester.test_root_endpoint,
        tester.test_text_analysis,
        tester.test_url_analysis,
        tester.test_history_endpoint,
        tester.test_invalid_requests
    ]
    
    for test in tests:
        try:
            test()
        except Exception as e:
            print(f"❌ Test failed with exception: {str(e)}")
            tester.tests_run += 1
    
    # Print results
    print("\n" + "=" * 50)
    print(f"📊 Tests Results: {tester.tests_passed}/{tester.tests_run} passed")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("⚠️  Some tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())