"""
Генератор идей для доменов через OpenAI API
Создает пул идей для каждого домена и сохраняет в БД
"""

import json
import re
from typing import List
from openai import AsyncOpenAI
import asyncio

from ..config import get_settings
from ..schemas.idea import IdeaCreate
from ..crud.idea import bulk_create_ideas
from ..database import SessionLocal

settings = get_settings()

client = None
# Используем обычный OpenAI API
if settings.OPENAI_API_KEY and settings.OPENAI_API_KEY.get_secret_value():
    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY.get_secret_value())
else:
    print("⚠️ OpenAI API key not configured – idea generation is disabled")
    client = None


def _extract_json(text: str) -> str:
    """Извлекает JSON-блок из ответа OpenAI"""
    match = re.search(r"```json(.*?)```", text, re.S)
    if match:
        return match.group(1).strip()
    return text.strip()


async def _generate_ideas_for_domain(domain: str, count: int = 10) -> List[IdeaCreate]:
    """Генерирует идеи для конкретного домена через OpenAI"""
    
    # Если нет OpenAI клиента, генерацию не выполняем (без заглушек)
    if not client:
        return []
    
    # Настройки промптов для разных доменов
    domain_prompts = {
        "FinTech": "финансовых технологий, включая банкинг, платежи, инвестиции, блокчейн, криптовалюты",
        "HealthTech": "медицинских технологий, включая цифровое здравоохранение, медицинские устройства, телемедицину",
        "EdTech": "образовательных технологий, включая онлайн-обучение, платформы для образования, EdTech-решения",
        "E-commerce": "электронной коммерции, включая онлайн-ретейл, маркетплейсы, logistics-решения",
        "Gaming": "игровой индустрии, включая видеоигры, мобильные игры, геймификацию",
        "SaaS": "SaaS-решений, включая бизнес-софт, productivity tools, корпоративные решения",
        "AI/ML": "искусственного интеллекта и машинного обучения, включая AI-решения, автоматизацию",
        "Sustainability": "устойчивого развития и экологических технологий, включая зеленую энергетику, переработку, экологичные решения"
    }
    
    domain_context = domain_prompts.get(domain, f"сферы {domain}")
    
    system_prompt = f"""
    You are an experienced product manager. Generate innovative yet feasible startup ideas in the domain of {domain_context}.
    
    Requirements:
    - Realistic and implementable
    - Solve a clear problem
    - Have a well-defined target audience
    - Monetizable
    - Reflect current trends
    
    Return a pure JSON array with objects: title, description, tags.
    - title: concise (<= 50 chars), English
    - description: problem and solution summary (<= 200 chars), English
    - tags: 3-5 relevant English tags
    """
    
    user_prompt = f"""
    Generate {count} unique startup ideas in {domain_context}.
    Each idea must be original and not repeat existing solutions.
    
    Return ONLY raw JSON array, no extra text.
    """
    
    try:
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.8,
            max_tokens=2000
        )
        
        content = response.choices[0].message.content
        content = _extract_json(content)
        
        # Парсим JSON ответ
        ideas_raw = json.loads(content)
        
        # Создаем объекты IdeaCreate
        ideas = []
        for idea_data in ideas_raw:
            idea = IdeaCreate(
                title=idea_data["title"],
                description=idea_data["description"],
                tags=idea_data["tags"],
                domain=domain
            )
            ideas.append(idea)
        
        return ideas
        
    except Exception as e:
        print(f"❌ Ошибка генерации идей для {domain}: {str(e)}")
        return []


async def generate_ideas_for_domains(db_session, domains: List[str], ideas_per_domain: int = 10):
    """Генерирует идеи для всех доменов пользователя"""
    
    print(f"🚀 Начинаем генерацию идей для доменов: {domains}")
    
    all_generated_ideas = []
    
    for domain in domains:
        try:
            ideas = await _generate_ideas_for_domain(domain, ideas_per_domain)
            all_generated_ideas.extend(ideas)
            
            await asyncio.sleep(1)
            
        except Exception as e:
            print(f"❌ Ошибка для домена {domain}: {e}")
            continue
    
    # Сохраняем все идеи в БД
    if all_generated_ideas:
        try:
            created_ideas = bulk_create_ideas(db_session, all_generated_ideas)
            print(f"💾 Сохранено {len(created_ideas)} новых идей в БД")
            
            # Группируем по доменам для отчета
            domain_counts = {}
            for idea in created_ideas:
                domain_counts[idea.domain] = domain_counts.get(idea.domain, 0) + 1
            
            print("📊 Создано идей по доменам:")
            for domain, count in domain_counts.items():
                print(f"   • {domain}: {count} идей")
                
        except Exception as e:
            print(f"❌ Ошибка сохранения в БД: {e}")
    else:
        print("⚠️ Не сгенерировано ни одной идеи")
    
    print("🏁 Генерация завершена")


def run_sync_generation(db_session, domains: List[str], ideas_per_domain: int = 10):
    """Синхронная обёртка для использования в BackgroundTasks"""
    return asyncio.run(generate_ideas_for_domains(db_session, domains, ideas_per_domain))


# ------------------- Helper for FastAPI BackgroundTasks (async) -------------------
def enqueue_async_generation(db_session_dummy, domains: List[str], ideas_per_domain: int = 10):
    """Кладётся в BackgroundTasks. Создаёт свой SessionLocal, чтобы не зависеть
    от request-scope сессии (которая будет закрыта после ответа)."""

    # Создаём новый DB-сеанс специально для фоновой задачи
    bg_session = SessionLocal()

    def _runner():
        try:
            asyncio.run(generate_ideas_for_domains(bg_session, domains, ideas_per_domain))
        finally:
            bg_session.close()

    # Запускаем в отдельном потоке
    import threading
    thread = threading.Thread(target=_runner)
    thread.daemon = True
    thread.start() 