from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import requests
from bs4 import BeautifulSoup
from groq import Groq
import json
from contextlib import asynccontextmanager

# -------------------------
# ENV + DATABASE
# -------------------------

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

# -------------------------
# FASTAPI SETUP
# -------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    yield
    # Shutdown
    client.close()

app = FastAPI(lifespan=lifespan)
api_router = APIRouter(prefix="/api")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------
# MODELS
# -------------------------

class AnalysisRequest(BaseModel):
    input_type: str
    content: str


class HighlightSegment(BaseModel):
    text: str
    type: str
    explanation: str


class AnalysisResult(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    input_type: str
    original_content: str
    headline: Optional[str] = None
    trust_score: int
    bias_level: int
    bias_label: str
    key_findings: List[str]
    highlights: List[HighlightSegment]
    credibility_notes: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class AnalysisResponse(BaseModel):
    id: str
    input_type: str
    original_content: str
    headline: Optional[str]
    trust_score: int
    bias_level: int
    bias_label: str
    key_findings: List[str]
    highlights: List[HighlightSegment]
    credibility_notes: str
    timestamp: str


# -------------------------
# SCRAPER
# -------------------------

def scrape_article(url: str):

    try:
        headers = {"User-Agent": "Mozilla/5.0"}

        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()

        soup = BeautifulSoup(response.content, "html.parser")

        title = ""

        if soup.find("h1"):
            title = soup.find("h1").get_text(strip=True)

        elif soup.find("title"):
            title = soup.find("title").get_text(strip=True)

        paragraphs = soup.find_all("p")

        content = " ".join(
            [p.get_text(strip=True) for p in paragraphs if p.get_text(strip=True)]
        )

        return {
            "headline": title,
            "content": content[:5000],
        }

    except Exception as e:
        logging.error(f"Scraping error: {str(e)}")
        raise HTTPException(status_code=400, detail="Failed to scrape URL")


# -------------------------
# GOOGLE FACT CHECK
# -------------------------

def fact_check_claim(text: str):

    api_key = os.environ.get("FACT_CHECK_API_KEY")

    if not api_key:
        return {"fact_checked": False}

    url = "https://factchecktools.googleapis.com/v1alpha1/claims:search"

    params = {
        "query": text[:200],
        "key": api_key
    }

    try:

        response = requests.get(url, params=params)
        data = response.json()

        if "claims" in data and len(data["claims"]) > 0:

            claim = data["claims"][0]
            review = claim["claimReview"][0]

            return {
                "fact_checked": True,
                "publisher": review["publisher"]["name"],
                "rating": review["textualRating"]
            }

        return {"fact_checked": False}

    except:
        return {"fact_checked": False}


# -------------------------
# AI ANALYSIS (GROQ)
# -------------------------

async def analyze_with_ai(text: str, headline: str = None):

    api_key = os.environ.get("GROQ_API_KEY")

    if not api_key:
        raise HTTPException(status_code=500, detail="Missing GROQ_API_KEY")

    prompt = f"""
You are an AI news credibility analyzer.

Headline: {headline if headline else "N/A"}

Content:
{text[:4000]}

Return ONLY JSON in this format:

{{
"trust_score": 0-100,
"bias_level": 0-100,
"bias_label": "Objective | Slightly Biased | Moderately Biased | Highly Biased | Inflammatory",
"key_findings": ["point1","point2","point3"],
"highlights":[
{{"text":"example","type":"factual","explanation":"reason"}}
],
"credibility_notes":"summary"
}}
"""

    try:

        client = Groq(api_key=api_key)

        response = client.chat.completions.create(
            model="openai/gpt-oss-20b",
            messages=[{"role": "user", "content": prompt}],
        )

        response_text = response.choices[0].message.content.strip()

        if response_text.startswith("```"):
            response_text = response_text.replace("```json", "").replace("```", "")

        return json.loads(response_text)

    except Exception as e:

        logging.error(f"AI Analysis error: {str(e)}")

        return {
            "trust_score": 50,
            "bias_level": 50,
            "bias_label": "Analysis Failed",
            "key_findings": ["AI analysis failed"],
            "highlights": [],
            "credibility_notes": str(e),
        }


# -------------------------
# API ROUTES
# -------------------------

@api_router.post("/analyze", response_model=AnalysisResponse)
async def analyze_content(request: AnalysisRequest):

    headline = None
    content = request.content

    if request.input_type == "url":
        scraped = scrape_article(request.content)
        headline = scraped["headline"]
        content = scraped["content"]

    if not content or len(content) < 50:
        raise HTTPException(status_code=400, detail="Content too short")

    # Fact check
    fact_result = fact_check_claim(content)

    # AI analysis
    analysis = await analyze_with_ai(content, headline)

    result = AnalysisResult(
        input_type=request.input_type,
        original_content=request.content,
        headline=headline,
        trust_score=analysis.get("trust_score", 50),
        bias_level=analysis.get("bias_level", 50),
        bias_label=analysis.get("bias_label", "Unknown"),
        key_findings=analysis.get("key_findings", []),
        highlights=[HighlightSegment(**h) for h in analysis.get("highlights", [])],
        credibility_notes=analysis.get("credibility_notes", "")
        + f" | Fact Check: {fact_result}",
    )

    doc = result.model_dump()
    doc["timestamp"] = doc["timestamp"].isoformat()

    try:
        await db.analyses.insert_one(doc)
    except Exception as e:
        logging.exception("MongoDB save failed")
        raise HTTPException(status_code=500, detail=f"MongoDB save failed: {str(e)}")

    return AnalysisResponse(
        id=result.id,
        input_type=result.input_type,
        original_content=result.original_content,
        headline=result.headline,
        trust_score=result.trust_score,
        bias_level=result.bias_level,
        bias_label=result.bias_label,
        key_findings=result.key_findings,
        highlights=[h.model_dump() for h in result.highlights],
        credibility_notes=result.credibility_notes,
        timestamp=result.timestamp.isoformat(),
    )


@api_router.get("/history")
async def get_history():

    analyses = (
        await db.analyses.find({}, {"_id": 0})
        .sort("timestamp", -1)
        .limit(10)
        .to_list(10)
    )

    return analyses


@api_router.get("/")
async def root():
    return {"message": "TruthLens API running"}


# -------------------------

app.include_router(api_router)