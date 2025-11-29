import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .scoring import calculate_task_score
from .models import Task
from datetime import date

@csrf_exempt
def analyze_tasks(request):
    if request.method == 'POST':
        try:
            tasks = json.loads(request.body)
            
            # 1. Calculate base scores
            for task in tasks:
                task['score'] = calculate_task_score(task)
                # Ensure ID exists for dependency check logic, default to None if missing
                if 'id' not in task:
                    task['id'] = None
            
            # 2. Dependency Logic
            # Map task IDs to their objects for easy lookup
            task_map = {t.get('id'): t for t in tasks if t.get('id') is not None}
            
            # Build Adjacency List for Cycle Detection & Blocker Counting
            graph = {}
            dependency_counts = {}
            
            for task in tasks:
                t_id = task.get('id')
                deps = task.get('dependencies', [])
                
                # For blocker counting (who depends on me?)
                for dep_id in deps:
                    dependency_counts[dep_id] = dependency_counts.get(dep_id, 0) + 1
                
                # For cycle detection (who do I depend on?)
                if t_id is not None:
                    graph[t_id] = deps

            # Detect Cycles using DFS
            visited = set()
            recursion_stack = set()
            cycles = set()

            def dfs(node):
                visited.add(node)
                recursion_stack.add(node)
                
                for neighbor in graph.get(node, []):
                    if neighbor not in visited:
                        if dfs(neighbor):
                            return True
                    elif neighbor in recursion_stack:
                        cycles.add(node) # Mark node as part of cycle
                        return True
                
                recursion_stack.remove(node)
                return False

            for t_id in graph:
                if t_id not in visited:
                    dfs(t_id)

            # Boost score for blockers & Flag cycles
            for task in tasks:
                task_id = task.get('id')
                explanation_parts = []
                
                # Cycle Check
                if task_id in cycles:
                    task['has_circular_dependency'] = True
                    task['score'] = -100 # Penalize or flag specifically
                    explanation_parts.append("⚠️ CIRCULAR DEPENDENCY DETECTED!")
                
                # Blocker Boost
                if task_id is not None and task_id in dependency_counts:
                    boost = dependency_counts[task_id] * 10
                    task['score'] += boost
                    explanation_parts.append(f"Blocks {dependency_counts[task_id]} tasks (+{boost}).")
                
                if not explanation_parts:
                    explanation_parts.append("Standard priority.")
                    
                task['explanation'] = f"Base Score: {task['score']}. " + " ".join(explanation_parts)

            # Sort by score descending
            sorted_tasks = sorted(tasks, key=lambda x: x['score'], reverse=True)
            
            return JsonResponse(sorted_tasks, safe=False)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
    return JsonResponse({'error': 'Only POST allowed'}, status=405)

def suggest_tasks(request):
    # Fetch tasks from DB
    db_tasks = Task.objects.all()
    tasks_data = []
    for t in db_tasks:
        tasks_data.append({
            'id': t.id,
            'title': t.title,
            'due_date': t.due_date,
            'importance': t.importance,
            'estimated_hours': t.estimated_hours,
            'dependencies': t.dependencies
        })
    
    scored_tasks = []
    for t in tasks_data:
        score = calculate_task_score(t)
        t['score'] = score
        scored_tasks.append(t)
        
    # Sort
    scored_tasks.sort(key=lambda x: x['score'], reverse=True)
    
    top_3 = scored_tasks[:3]
    
    return JsonResponse({'suggestions': top_3}, safe=False)
