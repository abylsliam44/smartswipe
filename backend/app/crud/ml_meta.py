from datetime import datetime
from sqlalchemy.orm import Session
from ..models import MLModelMeta

def upsert_meta(db: Session, accuracy: float, precision: float, recall: float, f1: float, roc_auc: float, model_path: str):
    meta = db.query(MLModelMeta).first()
    if not meta:
        meta = MLModelMeta(id="current")
        db.add(meta)
    meta.trained_at = datetime.utcnow()
    meta.accuracy = accuracy
    meta.precision = precision
    meta.recall = recall
    meta.f1 = f1
    meta.roc_auc = roc_auc
    meta.model_path = model_path
    db.commit()
    return meta 