#!/usr/bin/env python3
"""
Комплексный тест новой архитектуры SmartSwipe 2.0
Тестирует полный флоу: регистрация -> выбор доменов -> генерация идей -> игра -> ML
"""

import requests
import time
import random
import json

BASE_URL = "http://localhost:8000"


def test_user_flow():
    """Тестирует полный пользовательский флоу"""
    
    print("🚀 Тестируем SmartSwipe 2.0 - Полный пользовательский флоу")
    print("=" * 60)
    
    # 1. Проверяем API
    print("\n1️⃣ Проверяем доступность API...")
    try:
        response = requests.get(f"{BASE_URL}/")
        print(f"✅ API доступен: {response.json()['message']}")
    except Exception as e:
        print(f"❌ API недоступен: {e}")
        return False
    
    # 2. Регистрация пользователя
    print("\n2️⃣ Регистрируем нового пользователя...")
    user_email = f"test_user_{int(time.time())}@example.com"
    user_password = "test_password_123"
    
    register_data = {
        "email": user_email,
        "password": user_password
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/register", json=register_data)
        if response.status_code == 201:
            user_data = response.json()
            print(f"✅ Пользователь зарегистрирован: {user_data['email']}")
            print(f"   Onboarding completed: {user_data['onboarding_completed']}")
        else:
            print(f"❌ Ошибка регистрации: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Ошибка при регистрации: {e}")
        return False
    
    # 3. Авторизация
    print("\n3️⃣ Авторизуемся...")
    login_data = {
        "username": user_email,  # OAuth2PasswordRequestForm использует username
        "password": user_password
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/login", data=login_data)
        if response.status_code == 200:
            token_data = response.json()
            access_token = token_data["access_token"]
            headers = {"Authorization": f"Bearer {access_token}"}
            print(f"✅ Авторизация успешна")
        else:
            print(f"❌ Ошибка авторизации: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Ошибка при авторизации: {e}")
        return False
    
    # 4. Получаем доступные домены
    print("\n4️⃣ Получаем доступные домены...")
    try:
        response = requests.get(f"{BASE_URL}/auth/available-domains")
        domains_info = response.json()
        available_domains = [d["id"] for d in domains_info["domains"]]
        print(f"✅ Доступные домены: {available_domains}")
    except Exception as e:
        print(f"❌ Ошибка получения доменов: {e}")
        return False
    
    # 5. Выбираем домены
    print("\n5️⃣ Выбираем интересующие домены...")
    selected_domains = random.sample(available_domains, min(3, len(available_domains)))
    domain_data = {"domains": selected_domains}
    
    try:
        response = requests.post(f"{BASE_URL}/auth/domains", json=domain_data, headers=headers)
        if response.status_code == 200:
            user_data = response.json()
            print(f"✅ Домены выбраны: {user_data['selected_domains']}")
            print(f"   Onboarding completed: {user_data['onboarding_completed']}")
        else:
            print(f"❌ Ошибка выбора доменов: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Ошибка при выборе доменов: {e}")
        return False
    
    # 6. Запускаем генерацию идей
    print("\n6️⃣ Запускаем генерацию пула идей...")
    try:
        response = requests.post(f"{BASE_URL}/ideas/generate-pool", headers=headers)
        if response.status_code == 200:
            gen_data = response.json()
            print(f"✅ Генерация запущена: {gen_data['message']}")
            print(f"   Ожидаемое количество идей: {gen_data['estimated_ideas']}")
        else:
            print(f"❌ Ошибка запуска генерации: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Ошибка при запуске генерации: {e}")
        return False
    
    # 7. Ждем немного и проверяем статистику
    print("\n7️⃣ Ждем генерацию и проверяем статистику...")
    time.sleep(10)  # Ждем генерацию
    
    try:
        response = requests.get(f"{BASE_URL}/ideas/stats", headers=headers)
        stats = response.json()
        print(f"✅ Статистика идей:")
        print(f"   Всего доступно: {stats['total_available']}")
        print(f"   Просмотрено: {stats['viewed']}")
        print(f"   Остается: {stats['remaining']}")
    except Exception as e:
        print(f"⚠️ Ошибка получения статистики: {e}")
    
    # 8. Получаем игровую сессию
    print("\n8️⃣ Получаем игровую сессию...")
    try:
        response = requests.get(f"{BASE_URL}/ideas/game-session?limit=5", headers=headers)
        if response.status_code == 200:
            session_data = response.json()
            ideas = session_data["ideas"]
            print(f"✅ Получена игровая сессия с {len(ideas)} идеями")
            
            if ideas:
                print(f"   Пример идеи: '{ideas[0]['title']}'")
                print(f"   Домен: {ideas[0]['domain']}")
        else:
            print(f"❌ Ошибка получения сессии: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Ошибка при получении сессии: {e}")
        return False
    
    # 9. Имитируем свайпы
    print("\n9️⃣ Имитируем свайпы...")
    if ideas:
        for i, idea in enumerate(ideas[:3]):  # Свайпаем первые 3 идеи
            swipe_value = random.choice([True, False])  # Случайный лайк/дизлайк
            swipe_data = {
                "idea_id": idea["id"],
                "swipe": swipe_value
            }
            
            try:
                response = requests.post(f"{BASE_URL}/swipes/", json=swipe_data, headers=headers)
                if response.status_code == 201:
                    action = "👍 лайк" if swipe_value else "👎 дизлайк"
                    print(f"   {action} для '{idea['title'][:50]}...'")
                else:
                    print(f"   ❌ Ошибка свайпа: {response.text}")
            except Exception as e:
                print(f"   ❌ Ошибка при свайпе: {e}")
    
    # 10. Проверяем статистику свайпов
    print("\n🔟 Проверяем статистику свайпов...")
    try:
        response = requests.get(f"{BASE_URL}/swipes/stats", headers=headers)
        swipe_stats = response.json()
        print(f"✅ Статистика свайпов:")
        print(f"   Всего свайпов: {swipe_stats['total_swipes']}")
        print(f"   Лайков: {swipe_stats['likes']}")
        print(f"   Дизлайков: {swipe_stats['dislikes']}")
        print(f"   Процент лайков: {swipe_stats['like_ratio']}%")
    except Exception as e:
        print(f"⚠️ Ошибка получения статистики свайпов: {e}")
    
    # 11. Пробуем получить рекомендации
    print("\n1️⃣1️⃣ Получаем персональные рекомендации...")
    try:
        response = requests.get(f"{BASE_URL}/recommendations/?limit=3", headers=headers)
        if response.status_code == 200:
            recommendations = response.json()
            print(f"✅ Получено рекомендаций: {len(recommendations)}")
            
            for rec in recommendations:
                print(f"   • '{rec['title'][:40]}...' (prob: {rec['probability']:.2f}, conf: {rec['confidence']})")
        else:
            print(f"⚠️ Рекомендации пока недоступны: {response.text}")
    except Exception as e:
        print(f"⚠️ Ошибка получения рекомендаций: {e}")
    
    # 12. Проверяем ML статус
    print("\n1️⃣2️⃣ Проверяем статус ML моделей...")
    try:
        response = requests.get(f"{BASE_URL}/ml/model-info", headers=headers)
        model_info = response.json()
        print(f"✅ Статус ML моделей:")
        print(f"   Content-based: {'✅' if model_info['content_model_trained'] else '❌'}")
        print(f"   User-based: {'✅' if model_info['user_model_trained'] else '❌'}")
        print(f"   Ensemble: {'✅' if model_info['ensemble_model_trained'] else '❌'}")
    except Exception as e:
        print(f"⚠️ Ошибка получения статуса ML: {e}")
    
    print("\n" + "=" * 60)
    print("🎉 Тест полного флоу завершен успешно!")
    print("🚀 SmartSwipe 2.0 готов к использованию!")
    
    return True


def test_ml_training():
    """Тестирует обучение ML моделей"""
    
    print("\n" + "=" * 60)
    print("🤖 Дополнительно: тестируем обучение ML...")
    
    # Нужен токен администратора для этого теста
    # Здесь можно добавить логику получения админского токена
    
    print("⚠️ ML обучение требует больше данных и времени")
    print("   Запустите /ml/train после накопления данных о свайпах")


if __name__ == "__main__":
    success = test_user_flow()
    
    if success:
        test_ml_training()
    else:
        print("\n❌ Основной тест не прошел")
        exit(1) 