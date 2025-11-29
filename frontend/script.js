document.addEventListener('DOMContentLoaded', () => {
    const taskInput = document.getElementById('taskInput');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const loadSampleBtn = document.getElementById('loadSampleBtn');
    const clearBtn = document.getElementById('clearBtn');
    const resultsContainer = document.getElementById('resultsContainer');
    const matrixContainer = document.getElementById('matrixContainer');
    const sortStrategy = document.getElementById('sortStrategy');
    const listViewBtn = document.getElementById('listViewBtn');
    const matrixViewBtn = document.getElementById('matrixViewBtn');

    let currentTasks = [];

    const sampleData = [
        { "id": 1, "title": "Fix critical bug", "due_date": "2025-11-28", "importance": 10, "estimated_hours": 4, "dependencies": [] },
        { "id": 2, "title": "Write documentation", "due_date": "2025-12-05", "importance": 6, "estimated_hours": 2, "dependencies": [1] },
        { "id": 3, "title": "Team meeting", "due_date": "2025-11-30", "importance": 8, "estimated_hours": 1, "dependencies": [] },
        { "id": 4, "title": "Update dependencies", "due_date": "2025-12-10", "importance": 4, "estimated_hours": 0.5, "dependencies": [] },
        { "id": 5, "title": "Long term project", "due_date": "2026-01-01", "importance": 9, "estimated_hours": 20, "dependencies": [] },
        { "id": 6, "title": "Circular Dep A", "due_date": "2025-12-01", "importance": 5, "estimated_hours": 1, "dependencies": [7] },
        { "id": 7, "title": "Circular Dep B", "due_date": "2025-12-01", "importance": 5, "estimated_hours": 1, "dependencies": [6] }
    ];

    loadSampleBtn.addEventListener('click', () => {
        taskInput.value = JSON.stringify(sampleData, null, 4);
    });

    clearBtn.addEventListener('click', () => {
        taskInput.value = '';
        currentTasks = [];
        renderViews();
    });

    analyzeBtn.addEventListener('click', analyzeTasks);

    // View Toggles
    listViewBtn.addEventListener('click', () => {
        // UI toggle handled in HTML script for immediate feedback, 
        // but we ensure logic sync here if needed.
        renderViews();
    });

    matrixViewBtn.addEventListener('click', () => {
        renderViews();
    });

    async function analyzeTasks() {
        const input = taskInput.value.trim();
        if (!input) {
            alert("Please enter some tasks.");
            return;
        }

        let tasks;
        try {
            tasks = JSON.parse(input);
        } catch (e) {
            alert("Invalid JSON format.");
            return;
        }

        resultsContainer.innerHTML = '<div class="placeholder-text text-neutral-500">Analyzing...</div>';

        try {
            const response = await fetch('http://127.0.0.1:8000/api/tasks/analyze/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(tasks)
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            currentTasks = await response.json();
            renderViews();

        } catch (error) {
            console.error('Error:', error);
            resultsContainer.innerHTML = `<div class="placeholder-text text-red-400">Error: ${error.message}</div>`;
        }
    }

    function renderViews() {
        // Sort based on strategy for List View
        let sortedTasks = [...currentTasks];
        const strategy = sortStrategy.value;

        if (strategy === 'fastest') {
            sortedTasks.sort((a, b) => a.estimated_hours - b.estimated_hours);
        } else if (strategy === 'impact') {
            sortedTasks.sort((a, b) => b.importance - a.importance);
        } else if (strategy === 'deadline') {
            sortedTasks.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
        }

        displayResults(sortedTasks);
        displayMatrix(currentTasks); // Matrix doesn't use sorted list, it uses quadrants
    }

    // Re-sort when strategy changes
    sortStrategy.addEventListener('change', renderViews);

    function displayResults(tasks) {
        resultsContainer.innerHTML = '';
        if (tasks.length === 0) {
            resultsContainer.innerHTML = '<div class="placeholder-text text-neutral-500 italic p-8 text-center">No tasks found.</div>';
            return;
        }

        tasks.forEach(task => {
            const card = createCard(task);
            resultsContainer.appendChild(card);
        });
    }

    function displayMatrix(tasks) {
        // Clear quadrants
        document.getElementById('q1-content').innerHTML = '';
        document.getElementById('q2-content').innerHTML = '';
        document.getElementById('q3-content').innerHTML = '';
        document.getElementById('q4-content').innerHTML = '';

        const today = new Date();

        tasks.forEach(task => {
            // Determine Quadrant
            // Urgent: Due within 3 days
            // Important: Importance >= 6

            let dueDate = new Date(task.due_date);
            // Simple day diff
            const diffTime = dueDate - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            const isUrgent = diffDays <= 3;
            const isImportant = task.importance >= 6;

            let targetId = '';
            if (isUrgent && isImportant) targetId = 'q1-content';
            else if (!isUrgent && isImportant) targetId = 'q2-content';
            else if (isUrgent && !isImportant) targetId = 'q3-content';
            else targetId = 'q4-content';

            const card = createCard(task);
            document.getElementById(targetId).appendChild(card);
        });
    }

    function createCard(task) {
        const card = document.createElement('div');
        // Base card styles
        let borderClass = 'border-neutral-700';
        let badgeClass = 'bg-neutral-800 text-neutral-300';

        if (task.score >= 80) {
            borderClass = 'border-red-500/50 shadow-[0_0_15px_-5px_rgba(239,68,68,0.3)]';
            badgeClass = 'bg-red-500/20 text-red-300 border border-red-500/30';
        } else if (task.score >= 50) {
            borderClass = 'border-yellow-500/50 shadow-[0_0_15px_-5px_rgba(234,179,8,0.3)]';
            badgeClass = 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30';
        } else {
            borderClass = 'border-emerald-500/50 shadow-[0_0_15px_-5px_rgba(16,185,129,0.3)]';
            badgeClass = 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
        }

        card.className = `bg-white/5 border ${borderClass} rounded-xl p-4 transition-all hover:-translate-y-1 hover:bg-white/10 group relative overflow-hidden`;

        card.innerHTML = `
            <div class="flex justify-between items-start mb-3">
                <h3 class="font-bold text-white text-lg leading-tight group-hover:text-emerald-300 transition-colors">${task.title}</h3>
                <span class="text-xs font-mono font-bold px-2 py-1 rounded-md ${badgeClass}">${task.score}</span>
            </div>
            
            <div class="grid grid-cols-2 gap-2 text-xs text-neutral-400 mb-3 border-b border-white/5 pb-3">
                <div class="flex items-center gap-1"><i data-lucide="calendar" class="w-3 h-3"></i> ${task.due_date}</div>
                <div class="flex items-center gap-1"><i data-lucide="clock" class="w-3 h-3"></i> ${task.estimated_hours}h</div>
                <div class="flex items-center gap-1"><i data-lucide="alert-circle" class="w-3 h-3"></i> Imp: ${task.importance}</div>
                <div class="flex items-center gap-1"><i data-lucide="link" class="w-3 h-3"></i> ${task.dependencies && task.dependencies.length > 0 ? task.dependencies.length + ' deps' : 'No deps'}</div>
            </div>
            
            <div class="text-xs text-neutral-500 bg-black/20 p-2 rounded-lg border border-white/5">
                <strong class="text-neutral-400">Why?</strong> ${task.explanation || 'Calculated priority.'}
            </div>
        `;

        // Re-initialize icons for this new card
        setTimeout(() => {
            if (window.lucide) window.lucide.createIcons();
        }, 0);

        return card;
    }
});
