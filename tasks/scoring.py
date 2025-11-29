from datetime import date, datetime

def calculate_task_score(task_data):
    """
    Calculates a priority score.
    Higher score = Higher priority.
    """
    score = 0
    
    # 1. Urgency Calculation
    today = date.today()
    
    # Handle due_date being a string or date object
    due_date_val = task_data.get('due_date')
    if isinstance(due_date_val, str):
        try:
            due_date_obj = datetime.strptime(due_date_val, '%Y-%m-%d').date()
        except ValueError:
            # Fallback for invalid date
            due_date_obj = today
    elif isinstance(due_date_val, date):
        due_date_obj = due_date_val
    elif isinstance(due_date_val, datetime):
        due_date_obj = due_date_val.date()
    else:
        due_date_obj = today

    days_until_due = (due_date_obj - today).days

    if days_until_due < 0:
        score += 100  # OVERDUE! Huge priority boost
    elif days_until_due == 0:
        score += 75   # Due today
    elif days_until_due <= 3:
        score += 50   # Due very soon
    elif days_until_due <= 7:
        score += 25   # Due this week

    # 2. Importance Weighting
    importance = task_data.get('importance', 5)
    score += (importance * 5)

    # 3. Effort (Quick wins logic)
    estimated_hours = task_data.get('estimated_hours', 1)
    if estimated_hours < 2:
        score += 10 # Small bonus for quick tasks
    elif estimated_hours > 8:
        score -= 5 # Slight penalty for huge tasks

    return score
