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

settings = get_settings()

client = None
# Используем обычный OpenAI API
if settings.OPENAI_API_KEY:
    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY.get_secret_value())
else:
    raise RuntimeError("OpenAI API key is not configured")


def _extract_json(text: str) -> str:
    """Извлекает JSON-блок из ответа OpenAI"""
    match = re.search(r"```json(.*?)```", text, re.S)
    if match:
        return match.group(1).strip()
    return text.strip()


async def _generate_ideas_for_domain(domain: str, count: int = 10) -> List[IdeaCreate]:
    """Генерирует идеи для конкретного домена через OpenAI"""
    
    if not client:
        raise RuntimeError("OpenAI API key is not configured")
    
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
    Ты опытный предприниматель и продукт-менеджер. Генерируешь инновационные и реализуемые стартап-идеи в сфере {domain_context}.
    
    Требования к идеям:
    - Реалистичные и выполнимые
    - Решают реальную проблему
    - Имеют четкую целевую аудиторию
    - Монетизируемые
    - Учитывают современные тренды
    
    Верни результат в виде JSON-массива с полями: title, description, tags.
    - title: краткое название (до 50 символов)
    - description: описание проблемы и решения (до 200 символов)
    - tags: 3-5 релевантных тегов
    """
    
    user_prompt = f"""
    Сгенерируй {count} уникальных стартап-идей в сфере {domain_context}.
    Каждая идея должна быть оригинальной и не повторять существующие решения.
    
    Верни чистый JSON-массив без дополнительных пояснений.
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
            
            # Небольшая пауза между запросами к OpenAI
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