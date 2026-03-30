from __future__ import annotations


class RankingAgent:
    def rank(self, directions: list[dict]) -> list[dict]:
        for direction in directions:
            overall = (
                direction["novelty_score"] * 0.35
                + direction["impact_score"] * 0.4
                + direction["feasibility_score"] * 0.25
            )
            direction["overall_score"] = round(overall, 2)
            direction["priority"] = self._priority(direction["overall_score"])

        return sorted(directions, key=lambda d: d["overall_score"], reverse=True)

    @staticmethod
    def _priority(score: float) -> str:
        if score >= 7.5:
            return "high"
        if score >= 6.0:
            return "medium"
        return "low"
