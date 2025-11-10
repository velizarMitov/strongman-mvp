// ===================================
// STRONGMAN CALCULATOR - APPLICATION LOGIC
// ===================================

// Data Structure
const app = {
    currentEvent: null,
    participants: [],
    results: []
};

// ===================================
// STATE MANAGEMENT
// ===================================

function updateUI() {
    console.log('Updating UI - Current event:', app.currentEvent);
    
    if (!app.currentEvent) {
        // Show no event state
        switchState('no-event');
        document.getElementById('leaderboardSection').style.display = 'none';
    } else {
        // Show event active state
        switchState('event-active');
        document.getElementById('leaderboardSection').style.display = 'block';
        updateEventDisplay();
        updateParticipantsList();
        updateParticipantSelect();
        updateCalculatorVisibility();
        updateResultsTable();
        updateLeaderboard();
    }
}

function switchState(stateName) {
    document.querySelectorAll('.state').forEach(state => {
        state.style.display = 'none';
    });
    
    const state = document.getElementById('state-' + stateName);
    if (state) {
        state.style.display = 'block';
    }
}

// ===================================
// EVENT MANAGEMENT
// ===================================

function showEventModal() {
    console.log('showEventModal called');
    const modal = document.getElementById('eventModal');
    const input = document.getElementById('eventNameInput');
    
    if (!modal) {
        console.error('Event modal not found!');
        return;
    }
    
    modal.style.display = 'flex';
    
    if (input) {
        input.value = '';
        input.focus();
    }
    
    // Ensure correct radio button is selected
    const distanceRadio = document.querySelector('input[name="eventType"][value="distance"]');
    if (distanceRadio) {
        distanceRadio.checked = true;
    }
    
    console.log('Modal opened');
}

function closeEventModal() {
    document.getElementById('eventModal').style.display = 'none';
}

function handleCreateEvent(event) {
    event.preventDefault();
    console.log('handleCreateEvent called');
    createEvent();
    return false;
}

function createEvent() {
    console.log('createEvent called');
    
    const nameInput = document.getElementById('eventNameInput');
    const typeRadio = document.querySelector('input[name="eventType"]:checked');
    
    if (!nameInput || !typeRadio) {
        console.error('Form elements not found!');
        alert('Възникна грешка при създаване на събитието. Моля, опитайте отново.');
        return;
    }
    
    const name = nameInput.value.trim();
    const eventType = typeRadio.value;

    console.log('Creating event - Name:', name, 'Type:', eventType);

    if (!name) {
        alert('Моля, въведи име на събитието!');
        nameInput.focus();
        return;
    }

    app.currentEvent = {
        name: name,
        type: eventType,
        createdAt: new Date()
    };

    app.participants = [];
    app.results = [];

    console.log('✅ Event created successfully:', app.currentEvent);

    closeEventModal();
    updateUI();
}

function resetEvent() {
    if (confirm('Наистина ли искаш да отмениш събитието? Всички данни ще бъдат изтрити.')) {
        app.currentEvent = null;
        app.participants = [];
        app.results = [];
        updateUI();
    }
}

function updateEventDisplay() {
    if (!app.currentEvent) return;
    
    document.getElementById('currentEventName').textContent = app.currentEvent.name;
    
    const eventTypeText = app.currentEvent.type === 'distance' 
        ? '📏 Дистанция + Време' 
        : '🔄 Повторения + Време';
    document.getElementById('currentEventType').textContent = eventTypeText;
}

function showAddParticipantModal() {
    console.log('showAddParticipantModal called');
    
    if (!app.currentEvent) {
        alert('Трябва да създадеш събитие първо!');
        return;
    }
    
    const modal = document.getElementById('participantModal');
    const input = document.getElementById('participantNameInput');
    
    if (!modal) {
        console.error('Participant modal not found!');
        return;
    }
    
    modal.style.display = 'flex';
    
    if (input) {
        input.value = '';
        input.focus();
    }
    
    console.log('Participant modal opened');
}

function closeParticipantModal() {
    document.getElementById('participantModal').style.display = 'none';
    document.getElementById('participantNameInput').value = '';
}

function handleAddParticipant(event) {
    event.preventDefault();
    console.log('handleAddParticipant called');
    addParticipant();
    return false;
}

function addParticipant() {
    console.log('addParticipant called');
    
    const input = document.getElementById('participantNameInput');
    
    if (!input) {
        console.error('Participant name input not found!');
        alert('Възникна грешка. Моля, опитайте отново.');
        return;
    }
    
    const name = input.value.trim();

    if (!name) {
        alert('Моля, въведи име на участника!');
        input.focus();
        return;
    }

    if (app.participants.some(p => p.name.toLowerCase() === name.toLowerCase())) {
        alert('Този участник вече е добавен!');
        input.focus();
        return;
    }

    const participant = {
        id: Date.now(),
        name: name,
        totalPoints: 0
    };

    app.participants.push(participant);
    console.log('✅ Participant added:', participant);
    
    closeParticipantModal();
    updateUI();
}

function removeParticipant(participantId) {
    if (confirm('Наистина ли искаш да премахнеш този участник?')) {
        app.participants = app.participants.filter(p => p.id !== participantId);
        app.results = app.results.filter(r => r.participantId !== participantId);
        updateUI();
    }
}

// ===================================
// POINTS CALCULATION
// ===================================

function calculatePointsForEvent() {
    // Get all results for this event, sorted by ranking
    const sortedResults = [...app.results].sort((a, b) => {
        if (app.currentEvent.type === 'distance') {
            // Distance: greater distance = better, less time preferred
            return b.distance - a.distance || a.time - b.time;
        } else {
            // Reps: more reps = better, less time preferred
            return b.reps - a.reps || a.time - b.time;
        }
    });

    // Assign points based on ranking
    const pointsMap = new Map();
    const maxPoints = app.participants.length;

    sortedResults.forEach((result, index) => {
        const points = maxPoints - index;
        pointsMap.set(result.participantId, points);
    });

    return { sortedResults, pointsMap };
}

function submitResult() {
    const participantSelect = document.getElementById('participantSelect');
    const participantId = parseInt(participantSelect.value);
    
    // Get time from MM:SS.CC format
    const minutes = parseInt(document.getElementById('minutesInput').value) || 0;
    const seconds = parseInt(document.getElementById('secondsInput').value) || 0;
    const centis = parseInt(document.getElementById('centisInput').value) || 0;
    
    // Convert to total seconds
    const time = minutes * 60 + seconds + centis / 100;

    console.log('submitResult called - Time:', { minutes, seconds, centis, time });

    if (!participantId) {
        alert('Моля, избери участник!');
        return;
    }

    if (isNaN(time) || (minutes === 0 && seconds === 0 && centis === 0)) {
        alert('Моля, въведи валидно време!');
        return;
    }

    let result = {
        id: Date.now(),
        participantId: participantId,
        time: time
    };

    if (app.currentEvent.type === 'distance') {
        const distance = parseFloat(document.getElementById('distanceInput').value);
        if (!distance || distance < 0) {
            alert('Моля, въведи валидна дистанция!');
            return;
        }
        result.distance = distance;
    } else {
        const reps = parseInt(document.getElementById('repetitionsInput').value);
        if (!reps || reps < 1) {
            alert('Моля, въведи валидно число на повторения!');
            return;
        }
        result.reps = reps;
    }

    // Check if participant already has a result and update or add
    const existingIndex = app.results.findIndex(r => r.participantId === participantId);
    if (existingIndex !== -1) {
        app.results[existingIndex] = result;
        console.log('✅ Result updated:', result);
        alert('Резултатът е обновен!');
    } else {
        app.results.push(result);
        console.log('✅ Result registered:', result);
        alert('Резултатът е регистриран!');
    }

    // Update participant total points
    const { pointsMap } = calculatePointsForEvent();
    app.participants.forEach(p => {
        p.totalPoints = pointsMap.get(p.id) || 0;
    });

    // Clear inputs
    document.getElementById('distanceInput').value = '';
    document.getElementById('repetitionsInput').value = '';
    document.getElementById('minutesInput').value = '';
    document.getElementById('secondsInput').value = '';
    document.getElementById('centisInput').value = '';
    document.getElementById('participantSelect').value = '';

    updateUI();
}

function removeResult(resultId) {
    if (confirm('Наистина ли искаш да премахнеш този резултат?')) {
        app.results = app.results.filter(r => r.id !== resultId);

        // Recalculate points
        const { pointsMap } = calculatePointsForEvent();
        app.participants.forEach(p => {
            p.totalPoints = pointsMap.get(p.id) || 0;
        });

        updateUI();
    }
}

// ===================================
// UI UPDATES
// ===================================

function updateParticipantsList() {
    const list = document.getElementById('participantsList');
    
    if (app.participants.length === 0) {
        list.innerHTML = '<p class="info-text">Няма добавени участници</p>';
        return;
    }

    list.innerHTML = app.participants.map(p => `
        <div class="participant-item">
            <span class="participant-name">${p.name}</span>
            <button class="btn-sm btn-danger" onclick="removeParticipant(${p.id})">Премахни</button>
        </div>
    `).join('');
}

function updateParticipantSelect() {
    const select = document.getElementById('participantSelect');
    const currentValue = select.value;

    select.innerHTML = '<option value="">-- Избери участник --</option>';
    
    app.participants.forEach(p => {
        const option = document.createElement('option');
        option.value = p.id;
        option.textContent = p.name;
        select.appendChild(option);
    });

    // Restore previous selection if it still exists
    if (currentValue && app.participants.find(p => p.id == currentValue)) {
        select.value = currentValue;
    }
}

function updateCalculatorVisibility() {
    if (app.currentEvent.type === 'distance') {
        document.getElementById('distanceGroup').style.display = 'block';
        document.getElementById('repetitionsGroup').style.display = 'none';
    } else {
        document.getElementById('distanceGroup').style.display = 'none';
        document.getElementById('repetitionsGroup').style.display = 'block';
    }
}

function updateResultsTable() {
    const body = document.getElementById('resultsBody');

    if (app.results.length === 0) {
        body.innerHTML = '<div class="info-text" style="grid-column: 1/-1; margin: 20px 0;">Няма резултати</div>';
        return;
    }

    // Get sorted results and points
    const { sortedResults, pointsMap } = calculatePointsForEvent();

    body.innerHTML = sortedResults.map((result, index) => {
        const participant = app.participants.find(p => p.id === result.participantId);
        const points = pointsMap.get(result.participantId) || 0;
        const place = index + 1;
        
        // Format time as MM:SS.CC
        const minutes = Math.floor(result.time / 60);
        const seconds = Math.floor(result.time % 60);
        const centis = Math.round((result.time % 1) * 100);
        const timeFormatted = `${minutes}:${String(seconds).padStart(2, '0')}.${String(centis).padStart(2, '0')}`;
        
        let resultText = '';
        if (app.currentEvent.type === 'distance') {
            resultText = `${result.distance.toFixed(2)} м / ${timeFormatted}`;
        } else {
            resultText = `${result.reps} повтор. / ${timeFormatted}`;
        }

        const medal = place === 1 ? '🥇' : place === 2 ? '🥈' : place === 3 ? '🥉' : '  ';

        return `
            <div class="table-row">
                <div class="col-rank">${medal} ${place}</div>
                <div class="col-name">${participant.name}</div>
                <div class="col-result">${resultText}</div>
                <div class="col-points">${points}</div>
                <div class="col-action">
                    <button class="btn-sm btn-danger" onclick="removeResult(${result.id})">✕</button>
                </div>
            </div>
        `;
    }).join('');
}

function updateLeaderboard() {
    const body = document.getElementById('leaderboardBody');

    if (app.participants.length === 0) {
        body.innerHTML = '<div class="info-text" style="grid-column: 1/-1; padding: 20px;">Няма участници</div>';
        return;
    }

    // Sort by total points (descending)
    const sorted = [...app.participants].sort((a, b) => b.totalPoints - a.totalPoints);

    body.innerHTML = sorted.map((p, index) => {
        const position = index + 1;
        const medal = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : '  ';

        return `
            <div class="table-row">
                <div class="col-position">${medal} ${position}</div>
                <div class="col-name">${p.name}</div>
                <div class="col-total-points">${p.totalPoints}</div>
            </div>
        `;
    }).join('');
}

// ===================================
// MODAL CLOSE ON OUTSIDE CLICK
// ===================================

window.addEventListener('click', function(event) {
    const eventModal = document.getElementById('eventModal');
    const participantModal = document.getElementById('participantModal');

    if (event.target === eventModal) {
        closeEventModal();
    }
    if (event.target === participantModal) {
        closeParticipantModal();
    }
});

// ===================================
// INITIALIZATION
// ===================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded');
    console.log('Elements found:', {
        eventModal: !!document.getElementById('eventModal'),
        eventNameInput: !!document.getElementById('eventNameInput'),
        participantModal: !!document.getElementById('participantModal'),
        participantNameInput: !!document.getElementById('participantNameInput'),
        noEventState: !!document.getElementById('state-no-event'),
        eventActiveState: !!document.getElementById('state-event-active')
    });
    updateUI();
});
