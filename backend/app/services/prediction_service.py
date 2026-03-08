"""ML-based race prediction service for Pitwall.ai."""
from typing import Any


class PredictionService:
    """
    Race prediction service using historical performance data.

    Currently uses a heuristic model based on qualifying and recent race
    performance. Future versions will integrate scikit-learn / XGBoost
    models trained on historical FastF1 data.
    """

    # Default 2025 grid with approximate strength ratings
    DRIVER_RATINGS = {
        "VER": {"name": "Max Verstappen", "team": "Red Bull Racing", "rating": 0.95},
        "NOR": {"name": "Lando Norris", "team": "McLaren", "rating": 0.92},
        "LEC": {"name": "Charles Leclerc", "team": "Ferrari", "rating": 0.90},
        "PIA": {"name": "Oscar Piastri", "team": "McLaren", "rating": 0.88},
        "SAI": {"name": "Carlos Sainz", "team": "Williams", "rating": 0.86},
        "HAM": {"name": "Lewis Hamilton", "team": "Ferrari", "rating": 0.89},
        "RUS": {"name": "George Russell", "team": "Mercedes", "rating": 0.87},
        "ANT": {"name": "Kimi Antonelli", "team": "Mercedes", "rating": 0.82},
        "ALO": {"name": "Fernando Alonso", "team": "Aston Martin", "rating": 0.84},
        "STR": {"name": "Lance Stroll", "team": "Aston Martin", "rating": 0.75},
        "GAS": {"name": "Pierre Gasly", "team": "Alpine", "rating": 0.80},
        "DOO": {"name": "Jack Doohan", "team": "Alpine", "rating": 0.72},
        "TSU": {"name": "Yuki Tsunoda", "team": "RB", "rating": 0.79},
        "LAW": {"name": "Liam Lawson", "team": "Red Bull Racing", "rating": 0.78},
        "ALB": {"name": "Alexander Albon", "team": "Williams", "rating": 0.81},
        "HUL": {"name": "Nico Hulkenberg", "team": "Sauber", "rating": 0.77},
        "BOR": {"name": "Gabriel Bortoleto", "team": "Sauber", "rating": 0.71},
        "OCO": {"name": "Esteban Ocon", "team": "Haas", "rating": 0.78},
        "BEA": {"name": "Oliver Bearman", "team": "Haas", "rating": 0.73},
        "HAD": {"name": "Isack Hadjar", "team": "RB", "rating": 0.70},
    }

    def predict_race(self, year: int, round_num: int) -> list[dict[str, Any]]:
        """
        Predict finishing order for a race.

        Uses driver ratings with small random variance to simulate
        prediction uncertainty. In production, this would use an
        XGBoost model trained on qualifying gaps, practice pace,
        historical circuit performance, and weather conditions.
        """
        import random
        random.seed(year * 100 + round_num)

        predictions = []
        for code, info in self.DRIVER_RATINGS.items():
            noise = random.gauss(0, 0.05)
            score = info["rating"] + noise
            predictions.append({
                "driver": code,
                "name": info["name"],
                "team": info["team"],
                "score": round(score, 4),
            })

        predictions.sort(key=lambda x: x["score"], reverse=True)

        result = []
        for i, pred in enumerate(predictions, 1):
            confidence = max(0.4, min(0.99, pred["score"]))
            result.append({
                "position": i,
                "driver": pred["driver"],
                "name": pred["name"],
                "team": pred["team"],
                "confidence": round(confidence * 100, 1),
            })
        return result
