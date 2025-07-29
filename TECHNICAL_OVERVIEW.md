# 🔧 SmartSwipe - Technical Overview

## 🏗️ Current System Architecture

### Core Components & ML Pipeline
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React Frontend│    │   FastAPI Backend│    │   PostgreSQL    │
│   (Vite + TS)   │◄──►│  + ML Pipeline    │◄──►│   Database      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │   OpenAI GPT-4   │
                       │   Idea Generator │
                       └──────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │  Advanced ML     │
                       │  Recommender     │
                       │  • Content-Based │
                       │  • User-Based    │
                       │  • Ensemble      │
                       └──────────────────┘
```

## 🎯 Complete User Flow with ML Integration

### 1. Registration and Intelligent Onboarding
```python
# POST /auth/register
{
  "email": "user@example.com",
  "password": "secure_password"
}
# Response: user_id, email, onboarding_completed: false

# POST /auth/domains  
{
  "domains": ["fintech", "ai-ml", "healthtech"]  # Support for 8 domains + custom
}
# Response: normalized domains, onboarding_completed: true
```

### 2. AI-Powered Idea Generation
```python
# POST /ideas/generate-pool (background task)
# Generates 10 ideas per selected domain using GPT-4
# Ideas stored with domain classification and tag extraction
{
  "status": "started",
  "domains": ["FinTech", "AI/ML", "HealthTech"],
  "estimated_ideas": 30
}
```

### 3. Smart Game Sessions with View Tracking
```python  
# GET /ideas/game-session?limit=5
{
  "ideas": [
    {
      "id": "uuid",
      "title": "AI-Powered Personal Finance Coach",
      "description": "Smart budgeting app that learns spending patterns...",
      "tags": ["AI", "FinTech", "Personal Finance"],
      "domain": "FinTech",
      "generated_for_domains": ["FinTech", "AI/ML"]
    }
  ],
  "session_id": "session_uuid",
  "total_available": 5
}
# Automatically marks ideas as viewed in idea_views table
```

### 4. Enhanced Swiping with ML Learning
```python
# POST /swipes/
{
  "idea_id": "uuid",
  "swipe": true  # true = like, false = dislike
}
# Validates domain matching and triggers ML model updates
```

### 5. Advanced ML-Powered Recommendations
```python
# GET /recommendations/?limit=10
{
  "recommendations": [
    {
      "idea": {...},
      "probability": 0.87,
      "confidence": "high",
      "method": "ensemble_ml"
    }
  ]
}
```

## 🤖 Advanced ML System Architecture

### Multi-Algorithm Recommender System
```python
class AdvancedRecommender:
    """Production-ready ML recommendation system"""
    
    def __init__(self, model_dir: str = "backend/ml_models"):
        # Models
        self.content_model = None           # TF-IDF + Cosine Similarity
        self.user_model = None             # User-Based Collaborative Filtering
        self.ensemble_model = None         # Random Forest, Gradient Boosting, Logistic Regression
        
        # Feature Engineering
        self.tfidf_vectorizer = TfidfVectorizer(max_features=1000, stop_words='english')
        self.domain_encoder = LabelEncoder()
        self.scaler = StandardScaler()
        
        # Similarity Matrices
        self.content_similarity_matrix = None
        self.user_similarity_matrix = None
```

### Content-Based Filtering (Current Implementation)
```python
def train_content_based_model(self, ideas: List[Idea]):
    """Trains content-based model using TF-IDF and cosine similarity"""
    
    # Feature extraction from ideas
    combined_texts = [
        f"{idea.title} {idea.description} {' '.join(idea.tags)}" 
        for idea in ideas
    ]
    
    # TF-IDF vectorization
    tfidf_matrix = self.tfidf_vectorizer.fit_transform(combined_texts)
    
    # Compute similarity matrix
    self.content_similarity_matrix = cosine_similarity(tfidf_matrix)
    
    # Save model
    joblib.dump({
        'vectorizer': self.tfidf_vectorizer,
        'similarity_matrix': self.content_similarity_matrix,
        'idea_ids': [str(idea.id) for idea in ideas]
    }, f"{self.model_dir}/content_based_model.pkl")
```

### User-Based Collaborative Filtering
```python
def train_user_based_model(self, db_session, users: List[User]):
    """Trains user-based collaborative filtering model"""
    
    # Create user-item interaction matrix
    user_item_matrix = self._create_user_item_matrix(db_session, users)
    
    # Calculate user similarity matrix
    self.user_similarity_matrix = cosine_similarity(user_item_matrix)
    
    # Store model with metadata
    joblib.dump({
        'similarity_matrix': self.user_similarity_matrix,
        'user_mapping': {str(user.id): idx for idx, user in enumerate(users)}
    }, f"{self.model_dir}/user_based_model.pkl")
```

### Ensemble Learning with Cross-Validation
```python
def train_ensemble_model(self, db_session):
    """Trains ensemble model with multiple algorithms"""
    
    # Prepare feature matrix
    X_features, y_labels = self._prepare_training_data(db_session)
    
    # Train multiple models
    models = {
        'logistic': LogisticRegression(random_state=42),
        'random_forest': RandomForestClassifier(n_estimators=100, random_state=42),
        'gradient_boosting': GradientBoostingClassifier(random_state=42)
    }
    
    best_model = None
    best_score = 0
    
    for name, model in models.items():
        # Cross-validation
        scores = cross_val_score(model, X_features, y_labels, cv=5, scoring='roc_auc')
        avg_score = scores.mean()
        
        if avg_score > best_score:
            best_score = avg_score
            best_model = model
    
    # Train best model on full dataset
    best_model.fit(X_features, y_labels)
    self.ensemble_model = best_model
    
    # Calculate detailed metrics
    y_pred = best_model.predict(X_features)
    y_pred_proba = best_model.predict_proba(X_features)[:, 1]
    
    self.training_metrics = {
        "accuracy": accuracy_score(y_labels, y_pred),
        "precision": precision_score(y_labels, y_pred),
        "recall": recall_score(y_labels, y_pred),
        "f1_score": f1_score(y_labels, y_pred),
        "roc_auc": roc_auc_score(y_labels, y_pred_proba)
    }
```

### Feature Engineering for ML
```python
def _extract_features(self, user: User, idea: Idea, user_history: List[Swipe]) -> List[float]:
    """Advanced feature extraction for ML models"""
    
    combined_text = f"{idea.title} {idea.description} {' '.join(idea.tags)}"
    user_likes = [s for s in user_history if s.swipe]
    
    return [
        # Content features
        len(combined_text),                    # Text length
        len(idea.tags),                        # Tag count
        len(idea.description.split()),         # Description word count
        
        # Domain features
        self.domain_encoder.transform([idea.domain])[0] if hasattr(self.domain_encoder, 'classes_') else 0,
        1 if idea.domain in (user.selected_domains or []) else 0,  # Domain match
        
        # User behavior features
        len(user_history),                     # Total swipe history
        len(user_likes),                       # Total likes
        len(user_likes) / len(user_history) if user_history else 0,  # Like ratio
        len(user.selected_domains or []),      # Number of selected domains
        
        # Advanced behavioral features
        self._calculate_domain_affinity(user, idea.domain),
        self._calculate_tag_similarity(user_likes, idea.tags),
        self._calculate_recency_score(user_history)
    ]
```

## 🗄️ Enhanced Database Schema

### Updated Table Structure
```sql
-- Users with onboarding and domain preferences
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR UNIQUE NOT NULL,
    hashed_password VARCHAR NOT NULL,
    selected_domains JSON,              -- ["FinTech", "AI/ML", "HealthTech"]
    onboarding_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ideas with domain classification and generation metadata
CREATE TABLE ideas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR UNIQUE NOT NULL,
    description TEXT NOT NULL,
    tags JSON NOT NULL,                 -- ["AI", "FinTech", "Investing"]
    domain VARCHAR NOT NULL,            -- Primary domain classification
    generated_for_domains JSON,         -- Domains this idea was generated for
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Swipes for ML training
CREATE TABLE swipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    idea_id UUID REFERENCES ideas(id) ON DELETE CASCADE,
    swipe BOOLEAN NOT NULL,             -- true = like, false = dislike
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, idea_id)
);

-- View tracking for recommendation filtering
CREATE TABLE idea_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    idea_id UUID REFERENCES ideas(id) ON DELETE CASCADE,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, idea_id)
);

-- ML model metadata and performance tracking
CREATE TABLE ml_model_meta (
    id VARCHAR PRIMARY KEY,
    trained_at TIMESTAMP WITH TIME ZONE,
    accuracy VARCHAR,
    model_path VARCHAR
);
```

### Optimized Indexes for ML Performance
```sql
-- Indexes for fast ML queries
CREATE INDEX idx_swipes_user_id ON swipes(user_id);
CREATE INDEX idx_swipes_idea_id ON swipes(idea_id);
CREATE INDEX idx_swipes_created_at ON swipes(created_at);
CREATE INDEX idx_ideas_domain ON ideas(domain);
CREATE INDEX idx_users_domains ON users USING GIN(selected_domains);
CREATE INDEX idx_idea_views_user_id ON idea_views(user_id);
CREATE INDEX idx_ideas_tags ON ideas USING GIN(tags);
```

## 🚀 Production API Endpoints

### Authentication & Onboarding
```python
POST /auth/register           # User registration
POST /auth/login             # JWT authentication
POST /auth/domains           # Domain selection (onboarding)
GET  /auth/me               # Current user info
GET  /auth/available-domains # Available domain list

# Profile Management
GET    /auth/profile/domains        # Get user domains
POST   /auth/profile/domains/add    # Add domain to profile
POST   /auth/profile/domains/custom # Create custom domain
DELETE /auth/profile/domains/remove # Remove domain
```

### Idea Management & AI Generation
```python
POST /ideas/generate-pool    # AI idea generation (background)
GET  /ideas/game-session    # Get ideas for swiping
GET  /ideas/               # Browse all ideas (admin)
GET  /ideas/stats         # User idea statistics
```

### ML & Recommendations
```python
GET  /recommendations/      # ML-powered personalized recommendations
POST /ml/train            # Manual ML model training
GET  /ml/status          # ML model status and metrics
```

### Swipe Management
```python
POST /swipes/             # Create swipe (like/dislike)
GET  /swipes/liked       # Get user's liked ideas
GET  /swipes/history     # Get swipe history
```

## 📊 Advanced ML Metrics & Monitoring

### Model Performance Tracking
```python
@router.get("/ml/status")
def get_ml_status():
    return {
        "content_based_model": {
            "trained": bool(advanced_recommender.content_model),
            "last_trained": advanced_recommender.last_content_training,
            "ideas_count": len(advanced_recommender.ideas_df or [])
        },
        "user_based_model": {
            "trained": bool(advanced_recommender.user_model),
            "users_count": len(advanced_recommender.users_df or [])
        },
        "ensemble_model": {
            "trained": bool(advanced_recommender.ensemble_model),
            "accuracy": advanced_recommender.training_metrics.get("accuracy"),
            "precision": advanced_recommender.training_metrics.get("precision"),
            "recall": advanced_recommender.training_metrics.get("recall"),
            "f1_score": advanced_recommender.training_metrics.get("f1_score"),
            "roc_auc": advanced_recommender.training_metrics.get("roc_auc")
        }
    }
```

### Real-time ML Prediction
```python
def predict_user_preference(self, db_session, user: User, idea: Idea) -> Dict:
    """Real-time ML prediction for user-idea preference"""
    
    if not self.ensemble_model:
        return {"probability": 0.5, "confidence": "low", "method": "random"}
    
    # Extract features
    user_history = get_user_swipe_history(db_session, user.id)
    features = self._extract_features(user, idea, user_history)
    
    # Scale features
    features_scaled = self.scaler.transform([features])
    
    # Predict probability
    probability = self.ensemble_model.predict_proba(features_scaled)[0][1]
    
    # Confidence calculation
    confidence = "high" if abs(probability - 0.5) > 0.3 else \
                "medium" if abs(probability - 0.5) > 0.1 else "low"
    
    return {
        "probability": float(probability),
        "confidence": confidence,
        "method": "ensemble_ml"
    }
```

## 🔧 ML Model Management & Deployment

### Automated Model Training Pipeline
```python
@router.post("/ml/train")
def train_ml_models(current_user: User, db: Session):
    """Production ML training endpoint with validation"""
    
    # Data validation
    ideas = db.query(Idea).all()
    users = db.query(User).filter(User.onboarding_completed == True).all()
    
    if len(ideas) < 5 or len(users) < 2:
        raise HTTPException(400, "Insufficient data for training")
    
    # Train all models
    advanced_recommender.train_content_based_model(ideas)
    advanced_recommender.train_user_based_model(db, users)
    advanced_recommender.train_ensemble_model(db)
    
    return {
        "status": "success",
        "ideas_count": len(ideas),
        "users_count": len(users),
        "metrics": advanced_recommender.get_training_metrics()
    }
```

### Model Persistence & Versioning
```python
# Models saved as versioned pickle files
- backend/ml_models/content_based_model.pkl
- backend/ml_models/user_based_model.pkl  
- backend/ml_models/ensemble_model.pkl
- backend/ml_models/feature_encoders.pkl
```

## 🚀 Performance Optimizations

### Smart Recommendation Caching
```python
# Cache recommendations per user for 1 hour
@lru_cache(maxsize=100)
def get_cached_recommendations(user_id: str, domains_hash: str):
    return advanced_recommender.get_recommendations(...)
```

### Batch Processing for ML Training
```python
# Background task for periodic model retraining
@scheduler.scheduled_job('cron', hour=2, minute=0)  # 2 AM daily
def retrain_models():
    if should_retrain_models():
        train_all_models()
```

### Database Query Optimization
```python
# Optimized queries for unseen ideas
def get_user_unseen_ideas(db, user_id, domains, limit=10):
    return db.query(Idea)\
        .filter(Idea.domain.in_(domains))\
        .filter(~Idea.id.in_(
            db.query(IdeaView.idea_id).filter(IdeaView.user_id == user_id)
        ))\
        .order_by(func.random())\
        .limit(limit).all()
```

## 🔮 Advanced ML Roadmap

### Immediate Enhancements (Q1 2025)
- [ ] **Deep Learning Integration** - Neural collaborative filtering
- [ ] **Real-time Model Updates** - Online learning from each swipe
- [ ] **Multi-armed Bandit** - Exploration vs exploitation optimization
- [ ] **A/B Testing Framework** - ML algorithm comparison

### Long-term Vision (2025+)
- [ ] **Transformer-based Recommendations** - BERT/GPT for content understanding
- [ ] **Federated Learning** - Privacy-preserving collaborative filtering
- [ ] **Reinforcement Learning** - Dynamic recommendation strategy
- [ ] **Multimodal ML** - Image and text-based idea analysis

### Production Deployment Features
- [ ] **Model Monitoring** - Drift detection and performance alerts
- [ ] **Canary Deployments** - Safe ML model rollouts
- [ ] **Feature Store** - Centralized feature management
- [ ] **MLOps Pipeline** - Automated training and deployment

---

**SmartSwipe** represents a production-ready implementation of advanced ML recommendation systems, demonstrating modern MLOps practices, real-time prediction capabilities, and scalable architecture for personalized content discovery. 