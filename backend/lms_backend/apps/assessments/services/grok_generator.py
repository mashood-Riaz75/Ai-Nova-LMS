import json
import os
import re
from openai import OpenAI
from django.db import transaction
from django.conf import settings
from ..models import Assessment, Question, Option

def generate_questions_for_assessment(assessment_id: str):
    assessment = Assessment.objects.get(id=assessment_id)
    
    # 1. Safely retrieve API key from os.environ or Django settings
    api_key = os.getenv("GROQ_API_KEY") or getattr(settings, "GROQ_API_KEY", None)
    if not api_key:
        raise ValueError("GROQ_API_KEY is not set in environment variables or Django settings.")

    # Initialize OpenAI SDK pointed to Groq Cloud's base URL
    client = OpenAI(
        api_key=api_key,
        base_url="https://api.groq.com/openai/v1"
    )

    prompt = f"""
    Generate exactly 30 multiple-choice questions for an assessment on the topic: "{assessment.topic}".
    
    Difficulty Distribution Required:
    - 10 LOW difficulty questions (1 mark each)
    - 10 MEDIUM difficulty questions (2 marks each)
    - 10 HIGH difficulty questions (3 marks each)

    Requirements:
    1. Output MUST be a single JSON object containing a "questions" key.
    2. Format structure:
    {{
      "questions": [
        {{
          "prompt": "Question text here",
          "difficulty": "LOW",
          "marks": 1,
          "options": [
            {{"text": "Option 1", "is_correct": true}},
            {{"text": "Option 2", "is_correct": false}},
            {{"text": "Option 3", "is_correct": false}},
            {{"text": "Option 4", "is_correct": false}}
          ]
        }}
      ]
    }}
    3. Exactly 4 options per question. Only 1 option marked is_correct: true.
    """

    # Call Groq's high-speed Llama 3.3 model
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "system", 
                "content": "You are an automated academic question generator. You must respond strictly in JSON format matching the requested schema."
            },
            {"role": "user", "content": prompt}
        ],
        temperature=0.3,
        response_format={"type": "json_object"}
    )

    content = response.choices[0].message.content.strip()
    
    # Clean markdown backticks cleanly using regex
    content = re.sub(r'^```(?:json)?\s*', '', content, flags=re.MULTILINE)
    content = re.sub(r'\s*```$', '', content, flags=re.MULTILINE).strip()

    parsed_data = json.loads(content)
    
    # Safely extract questions array regardless of object wrapper key
    if isinstance(parsed_data, dict):
        questions_data = parsed_data.get("questions") or next(iter(parsed_data.values()), [])
    else:
        questions_data = parsed_data

    # Save to DB inside an atomic transaction
    with transaction.atomic():
        for q_item in questions_data:
            question = Question.objects.create(
                assessment=assessment,
                prompt=q_item.get("prompt", "Question Prompt"),
                difficulty=q_item.get("difficulty", "MEDIUM"),
                marks=q_item.get("marks", 1)
            )
            
            options_to_create = [
                Option(
                    question=question,
                    text=opt_item.get("text", ""),
                    is_correct=opt_item.get("is_correct", False)
                )
                for opt_item in q_item.get("options", [])
            ]
            Option.objects.bulk_create(options_to_create)

    return True