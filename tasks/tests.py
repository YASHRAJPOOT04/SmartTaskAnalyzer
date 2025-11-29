from django.test import TestCase
from .scoring import calculate_task_score
from datetime import date, timedelta

class ScoringTests(TestCase):
    def test_overdue_task(self):
        yesterday = date.today() - timedelta(days=1)
        task = {'due_date': yesterday, 'importance': 5, 'estimated_hours': 5}
        score = calculate_task_score(task)
        # 100 (overdue) + 25 (imp) = 125
        self.assertEqual(score, 125)

    def test_urgent_task(self):
        tomorrow = date.today() + timedelta(days=1)
        task = {'due_date': tomorrow, 'importance': 5, 'estimated_hours': 5}
        score = calculate_task_score(task)
        # 50 (<=3 days) + 25 (imp) = 75
        self.assertEqual(score, 75)

    def test_quick_win(self):
        future = date.today() + timedelta(days=10)
        task = {'due_date': future, 'importance': 5, 'estimated_hours': 1}
        score = calculate_task_score(task)
        # 0 (urgency) + 25 (imp) + 10 (quick) = 35
        self.assertEqual(score, 35)
        
    def test_high_importance(self):
        future = date.today() + timedelta(days=10)
        task = {'due_date': future, 'importance': 10, 'estimated_hours': 5}
        score = calculate_task_score(task)
        # 0 (urgency) + 50 (imp) = 50
        self.assertEqual(score, 50)
