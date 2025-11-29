# Smart Task Analyzer

A mini-application that intelligently scores and prioritizes tasks based on urgency, importance, effort, and dependencies.

## Setup Instructions

1.  **Prerequisites**: Python 3.8+, Git.
2.  **Clone/Navigate**:
    ```bash
    cd task-analyzer
    ```
3.  **Backend Setup**:
    ```bash
    # Create virtual environment
    python -m venv venv
    
    # Activate virtual environment
    # Windows:
    venv\Scripts\activate
    # Mac/Linux:
    source venv/bin/activate
    
    # Install dependencies
    pip install django
    
    # Run migrations
    python manage.py migrate
    
    # Start server
    python manage.py runserver
    ```
4.  **Frontend Setup**:
    - Open `frontend/index.html` in your browser.
    - Alternatively, use a live server extension in VS Code.

## Algorithm Explanation

The scoring algorithm prioritizes tasks based on a weighted sum of several factors:

1.  **Urgency (Due Date)**:
    - **Overdue**: +100 points (Highest priority).
    - **Due Today**: +75 points.
    - **Due within 3 days**: +50 points.
    - **Due within 7 days**: +25 points.
    
2.  **Importance**:
    - Multiplied by 5 (e.g., Importance 10 = +50 points).
    
3.  **Effort (Quick Wins)**:
    - Tasks taking < 2 hours get a +10 point bonus to encourage clearing small items.
    - Tasks taking > 8 hours get a -5 point penalty to reflect the difficulty/procrastination factor.

4.  **Dependencies (Bonus)**:
    - Tasks that block other tasks are identified.
    - For every task that a task blocks, it receives +10 points. This ensures that bottlenecks are cleared first.

## Design Decisions

-   **Stateless Analysis**: The `/analyze/` endpoint is designed to be stateless, accepting a JSON payload. This allows for quick "what-if" scenarios without polluting the database.
-   **Dependency Graph**: Implemented a dependency check in the view layer to identify "blockers" within the submitted list, boosting their score dynamically.
-   **Frontend Sorting**: While the backend provides a "Smart" score, the frontend allows users to re-sort by "Fastest Wins" or "Deadline" instantly without re-fetching, providing a snappy UX.

## Time Breakdown

-   **Project Setup**: 15 mins
-   **Backend Development**: 1 hour
-   **Frontend Development**: 45 mins
-   **Documentation & Testing**: 30 mins

## Bonus Challenges Attempted

-   **Dependency Awareness**: The system detects tasks that are dependencies for others and boosts their priority.
