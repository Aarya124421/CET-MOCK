// Sample questions data structure (50 questions per subject)
const questions = {
    physics: Array(50).fill(null).map((_, index) => ({
        question: `Physics Question ${index + 1}`,
        options: ["A", "B", "C", "D"],
        correct: null // To be filled with correct answers
    })),
    chemistry: Array(50).fill(null).map((_, index) => ({
        question: `Chemistry Question ${index + 1}`,
        options: ["A", "B", "C", "D"],
        correct: null // To be filled with correct answers
    })),
    maths: Array(50).fill(null).map((_, index) => ({
        question: `Mathematics Question ${index + 1}`,
        options: ["A", "B", "C", "D"],
        correct: null // To be filled with correct answers
    }))
};

// State management
let currentSubject = 'physics';
let currentQuestionIndex = 0;
let answers = {
    physics: new Array(50).fill(null),
    chemistry: new Array(50).fill(null),
    maths: new Array(50).fill(null)
};
let visitedQuestions = {
    physics: new Set(),
    chemistry: new Set(),
    maths: new Set()
};
let markedForReview = {
    physics: new Set(),
    chemistry: new Set(),
    maths: new Set()
};
let pcTimeLeft = 1.5 * 60 * 60; // 1.5 hours in seconds
let mathTimeLeft = 1.5 * 60 * 60; // 1.5 hours in seconds
let pcTimerInterval;
let mathTimerInterval;
let isPaused = false;
let isMathSectionUnlocked = false;
let tempSelectedAnswer = null; // Temporary storage for selected answer
let questionStats = {
    physics: {},
    chemistry: {},
    maths: {}
};
let studentInfo = {
    name: '',
    date: '',
    fltNumber: ''
};

// DOM Elements
const pcTimeDisplay = document.getElementById('pc-time');
const mathTimeDisplay = document.getElementById('math-time');
const pauseBtn = document.getElementById('pauseBtn');
const playBtn = document.getElementById('playBtn');
const prevBtn = document.getElementById('prevBtn');
const saveNextBtn = document.getElementById('saveNextBtn');
const submitBtn = document.getElementById('submitBtn');
const questionText = document.getElementById('question-text');
const optionsContainer = document.querySelector('.options-container');
const subjectTabs = document.querySelectorAll('.tab-btn');
const themeToggle = document.querySelector('.theme-toggle');
const resultModal = document.getElementById('resultModal');
const closeModal = document.getElementById('closeModal');
const performanceText = document.getElementById('performance-text');
const answerKeyGrid = document.getElementById('answer-key-grid');
const answerKeyTabs = document.querySelectorAll('.answer-key-tab');
const calculateScoreBtn = document.getElementById('calculateScoreBtn');
const scoreContainer = document.querySelector('.score-container');

// Timer functions
function startPCTimer() {
    pcTimerInterval = setInterval(() => {
        if (!isPaused) {
            pcTimeLeft--;
            updatePCTimerDisplay();
            checkTimeWarning();
            if (pcTimeLeft <= 0) {
                clearInterval(pcTimerInterval);
                lockPCSection();
            }
        }
    }, 1000);
}

function startMathTimer() {
    mathTimerInterval = setInterval(() => {
        if (!isPaused && isMathSectionUnlocked) {
            mathTimeLeft--;
            updateMathTimerDisplay();
            checkTimeWarning();
            if (mathTimeLeft <= 0) {
                clearInterval(mathTimerInterval);
                lockMathSection();
            }
        }
    }, 1000);
}

function updatePCTimerDisplay() {
    const hours = Math.floor(pcTimeLeft / 3600);
    const minutes = Math.floor((pcTimeLeft % 3600) / 60);
    const seconds = pcTimeLeft % 60;
    pcTimeDisplay.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function updateMathTimerDisplay() {
    const hours = Math.floor(mathTimeLeft / 3600);
    const minutes = Math.floor((mathTimeLeft % 3600) / 60);
    const seconds = mathTimeLeft % 60;
    mathTimeDisplay.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function lockPCSection() {
    const pcTab = document.querySelector('[data-subject="physics"]');
    const chemTab = document.querySelector('[data-subject="chemistry"]');
    pcTab.disabled = true;
    chemTab.disabled = true;
    isMathSectionUnlocked = true;
    startMathTimer();
    alert('Physics and Chemistry section is now locked! Mathematics section is unlocked. 🎯');
}

function lockMathSection() {
    const mathTab = document.querySelector('[data-subject="maths"]');
    mathTab.disabled = true;
    alert('Time\'s up! Mathematics section is now locked. ⏰');
}

// Question navigation
function loadQuestion() {
    const currentQuestions = questions[currentSubject];
    const question = currentQuestions[currentQuestionIndex];
    
    questionText.textContent = question.question;
    optionsContainer.innerHTML = '';
    
    question.options.forEach((option, index) => {
        const optionElement = document.createElement('div');
        optionElement.className = 'option';
        optionElement.dataset.option = option;
        optionElement.textContent = option;
        
        // Show selected state based on saved answer
        if (answers[currentSubject][currentQuestionIndex] === option) {
            optionElement.classList.add('selected');
        }
        
        optionElement.addEventListener('click', () => selectOption(option));
        optionsContainer.appendChild(optionElement);
    });
    
    visitedQuestions[currentSubject].add(currentQuestionIndex);
    updateNavigationButtons();
    updateQuestionPalette();
    updateQuestionStats();
}

function selectOption(selectedOption) {
    const options = document.querySelectorAll('.option');
    options.forEach(option => {
        if (option.dataset.option === selectedOption) {
            option.classList.add('selected');
        } else {
            option.classList.remove('selected');
        }
    });
    tempSelectedAnswer = selectedOption;
    updateQuestionPalette();
}

function updateNavigationButtons() {
    prevBtn.disabled = currentQuestionIndex === 0;
    saveNextBtn.disabled = false;
}

// Subject switching
function switchSubject(subject) {
    if (subject === 'maths' && !isMathSectionUnlocked) {
        if (confirm('Mathematics section will be unlocked after completing Physics and Chemistry. Do you want to proceed anyway? 📚')) {
            currentSubject = subject;
            currentQuestionIndex = 0;
            loadQuestion();
            
            subjectTabs.forEach(tab => {
                tab.classList.remove('active');
                if (tab.dataset.subject === subject) {
                    tab.classList.add('active');
                }
            });
        }
        return;
    }
    
    currentSubject = subject;
    currentQuestionIndex = 0;
    loadQuestion();
    
    subjectTabs.forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.subject === subject) {
            tab.classList.add('active');
        }
    });
}

// Question palette
function updateQuestionPalette() {
    const paletteGrid = document.getElementById('palette-grid');
    paletteGrid.innerHTML = '';
    
    const currentQuestions = questions[currentSubject];
    currentQuestions.forEach((_, index) => {
        const paletteItem = document.createElement('div');
        paletteItem.className = 'palette-item';
        
        // Current question
        if (index === currentQuestionIndex) {
            paletteItem.classList.add('current');
        }
        // Marked for review and answered
        if (markedForReview[currentSubject].has(index) && answers[currentSubject][index] !== null) {
            paletteItem.classList.add('marked-answered');
        }
        // Marked for review but not answered
        else if (markedForReview[currentSubject].has(index)) {
            paletteItem.classList.add('marked');
        }
        // Answered but not marked
        else if (answers[currentSubject][index] !== null) {
            paletteItem.classList.add('answered');
        }
        // Visited but not answered
        else if (visitedQuestions[currentSubject].has(index)) {
            paletteItem.classList.add('visited');
        }
        
        paletteItem.textContent = index + 1;
        paletteItem.addEventListener('click', () => {
            currentQuestionIndex = index;
            loadQuestion();
        });
        paletteGrid.appendChild(paletteItem);
    });
    
    updatePaletteSummary();
}

function saveAndNext() {
    // Save the temporary answer if one was selected
    if (tempSelectedAnswer !== null) {
        answers[currentSubject][currentQuestionIndex] = tempSelectedAnswer;
        tempSelectedAnswer = null;
        updatePaletteSummary();
    }
    
    if (currentQuestionIndex < questions[currentSubject].length - 1) {
        currentQuestionIndex++;
        loadQuestion();
    }
}

function updatePaletteSummary() {
    const answeredCount = answers[currentSubject].filter(answer => answer !== null).length;
    const markedCount = markedForReview[currentSubject].size;
    const unansweredCount = 50 - answeredCount;
    
    document.getElementById('answered-count').textContent = answeredCount;
    document.getElementById('unanswered-count').textContent = unansweredCount;
    document.getElementById('marked-count').textContent = markedCount;
}

// Performance messages
function getGenZPerformanceMessage(totalScore) {
    const percentage = (totalScore / 200) * 100;
    
    const messages = {
        excellent: [
            "Vinod sir ko fire karne ke baad tumne toh coaching ko proud kar diya! 🎯",
            "Shelar sir calculating your rank: 'AIR 3 ka competition?' 🎯",
            "3 lakh ka investment turned into IIT dreams! Parents ko party do 💸",
            "Mangesh sir's calculator crashed calculating your score! 🔢",
            "Zondhale College ne admission deny kar diya, overqualified ho gaye 🎓",
            "Coaching ke bahar flex karne layak score hai! 📸",
            "Vinod sir ke replacement se better performance! 💪"
        ],
        good: [
            "Vinod sir ke farewell ke baad tumne toh coaching ko proud kar diya! 🎯",
            "VJTI ke gate tak pahunche, bas security ne roka hai 🏃",
            "Mangesh sir be like: 'IT confirm, CS ke liye pray karo' 🙏",
            "Zondhale se 10x better, VJTI se thoda neecha 🎯",
            "3 lakh ka return at least Tier-2 college mein toh milega 💰",
            "Coaching ke group mein flex karne layak score hai! 📱",
            "Parents ko result batane ke liye WhatsApp status ready hai 📸",
            "Mangesh sir's VJTI cutoff explanation > Your score 🎯",
            "Shelar sir's AIR 3 story se better performance! 🏆",
            "JEE Advanced ke liye bhi try kar sakte ho, confidence toh hai! 🚀",
            "Coaching ke bahar flex karne layak score hai! 💪"
        ],
        average: [
            "Vinod sir ke replacement se better performance nahi hai 💀",
            "3 lakh ka course, 3 rupee ka result 📉",
            "Mangesh sir's calculator is judging you 🔢",
            "Zondhale College ne welcome message bhej diya 📱",
            "Parents ko result batane se pehle job dhoond lo 💼",
            "Coaching ke group mein flex karne layak score nahi hai 😅",
            "Parents ko result batane ke liye WhatsApp status nahi hai 📱",
            "Mangesh sir's VJTI cutoff explanation < Your score 🎯",
            "Shelar sir's AIR 3 story se better performance nahi hai 🏆",
            "JEE Advanced ke liye bhi try kar sakte ho, confidence toh hai! 🚀",
            "Coaching ke bahar flex karne layak score nahi hai 💪"
        ],
        needsWork: [
            "Vinod sir ke replacement se better performance nahi hai 💀",
            "Zondhale College ne welcome message bhej diya 📱",
            "Parents ko result batane se pehle job dhoond lo 💼",
            "Coaching ke group mein flex karne layak score nahi hai 😅",
            "Parents ko result batane ke liye WhatsApp status nahi hai 📱",
            "Mangesh sir's VJTI cutoff explanation < Your score 🎯",
            "Shelar sir's AIR 3 story se better performance nahi hai 🏆",
            "JEE Advanced ke liye bhi try kar sakte ho, confidence toh hai! 🚀",
            "Coaching ke bahar flex karne layak score nahi hai 💪",
            "3 lakh ka course, 3 rupee ka result 📉",
            "Mangesh sir's calculator is judging you 🔢"
        ]
    };

    // Function to get random messages without repetition
    const getRandomMessage = (arr) => {
        const numMessages = Math.floor(Math.random() * 2) + 2; // 2-3 messages
        const shuffled = [...arr].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, numMessages).join('\n');
    };

    if (percentage >= 85) return { emoji: "🐐", message: getRandomMessage(messages.excellent) };
    if (percentage >= 70) return { emoji: "💫", message: getRandomMessage(messages.good) };
    if (percentage >= 50) return { emoji: "🫠", message: getRandomMessage(messages.average) };
    return { emoji: "💀", message: getRandomMessage(messages.needsWork) };
}

// Answer key input
function createAnswerKeyGrid() {
    answerKeyGrid.innerHTML = '';
    const currentSubject = document.querySelector('.answer-key-tab.active').dataset.subject;
    
    for (let i = 0; i < 50; i++) {
        const item = document.createElement('div');
        item.className = 'answer-key-item';
        
        const label = document.createElement('label');
        label.textContent = `Q${i + 1}`;
        
        const select = document.createElement('select');
        select.innerHTML = `
            <option value="">-</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="D">D</option>
        `;
        
        // Set the selected value if it exists
        if (questions[currentSubject][i].correct) {
            select.value = questions[currentSubject][i].correct;
        }
        
        item.appendChild(label);
        item.appendChild(select);
        answerKeyGrid.appendChild(item);
    }
}

// Score calculation
function calculateScore() {
    let scores = {
        physics: 0,
        chemistry: 0,
        maths: 0
    };
    
    // Calculate scores
    Object.keys(questions).forEach(subject => {
        questions[subject].forEach((question, index) => {
            // Only count if there's a correct answer set
            if (question.correct) {
                // Check if user's answer matches the correct answer
                if (answers[subject][index] === question.correct) {
                    if (subject === 'maths') {
                        scores[subject] += 2; // Maths: 2 points per correct answer
                    } else {
                        scores[subject] += 1; // Physics and Chemistry: 1 point per correct answer
                    }
                }
                // If answer is wrong or unattempted, no points (already 0)
            }
        });
    });
    
    const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
    
    // Update score display
    document.getElementById('physics-score').textContent = `${scores.physics}/50`;
    document.getElementById('chemistry-score').textContent = `${scores.chemistry}/50`;
    document.getElementById('maths-score').textContent = `${scores.maths}/100`;
    document.getElementById('total-score').textContent = `${totalScore}/200`;
    
    // Show performance message
    const performance = getGenZPerformanceMessage(totalScore);
    performanceText.textContent = performance.message;
    
    // Show score container
    scoreContainer.style.display = 'grid';
}

// Event listeners
saveNextBtn.addEventListener('click', saveAndNext);

prevBtn.addEventListener('click', () => {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        loadQuestion();
    }
});

subjectTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        switchSubject(tab.dataset.subject);
    });
});

answerKeyTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        answerKeyTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        createAnswerKeyGrid();
    });
});

calculateScoreBtn.addEventListener('click', () => {
    // Get answer key values
    const currentSubject = document.querySelector('.answer-key-tab.active').dataset.subject;
    const selects = answerKeyGrid.querySelectorAll('select');
    selects.forEach((select, index) => {
        questions[currentSubject][index].correct = select.value;
    });
    
    calculateScore();
});

submitBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to submit the test? 📝')) {
        resultModal.style.display = 'flex';
        createAnswerKeyGrid();
    }
});

closeModal.addEventListener('click', () => {
    resultModal.style.display = 'none';
});

themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const icon = themeToggle.querySelector('i');
    icon.classList.toggle('fa-moon');
    icon.classList.toggle('fa-sun');
});

// Add keyboard event listener to handle shortcuts
document.addEventListener('keydown', (event) => {
    // Only process keyboard shortcuts if not typing in an input field
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') return;
    
    switch(event.key) {
        case '1':
            // Select option A
            selectOption(questions[currentSubject][currentQuestionIndex].options[0]);
            break;
        case '2':
            // Select option B
            selectOption(questions[currentSubject][currentQuestionIndex].options[1]);
            break;
        case '3':
            // Select option C
            selectOption(questions[currentSubject][currentQuestionIndex].options[2]);
            break;
        case '4':
            // Select option D
            selectOption(questions[currentSubject][currentQuestionIndex].options[3]);
            break;
        case ' ':
            // Spacebar for Save & Next
            event.preventDefault(); // Prevent page scroll
            saveAndNext();
            break;
        case 'ArrowRight':
            // Right arrow for next question
            if (currentQuestionIndex < questions[currentSubject].length - 1) {
                currentQuestionIndex++;
                loadQuestion();
            }
            break;
        case 'ArrowLeft':
            // Left arrow for previous question
            if (currentQuestionIndex > 0) {
                currentQuestionIndex--;
                loadQuestion();
            }
            break;
    }
});

// Add function to toggle review status
function toggleMarkForReview() {
    if (markedForReview[currentSubject].has(currentQuestionIndex)) {
        markedForReview[currentSubject].delete(currentQuestionIndex);
    } else {
        markedForReview[currentSubject].add(currentQuestionIndex);
    }
    updateQuestionPalette();
}

// Add to event listeners section
document.getElementById('markReviewBtn').addEventListener('click', toggleMarkForReview);

// Add keyboard shortcut 'M' for marking questions
document.addEventListener('keydown', (event) => {
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') return;
    
    if (event.key.toLowerCase() === 'm') {
        toggleMarkForReview();
    }
    // ... existing keyboard shortcuts ...
});

// Add function to clear response
function clearResponse() {
    // Clear the selected option
    const options = document.querySelectorAll('.option');
    options.forEach(option => option.classList.remove('selected'));
    
    // Clear the answer if it was saved
    answers[currentSubject][currentQuestionIndex] = null;
    tempSelectedAnswer = null;
    
    // Update UI
    updateQuestionPalette();
    updatePaletteSummary();
}

// Add function to track time per question
function updateQuestionStats() {
    if (!questionStats[currentSubject][currentQuestionIndex]) {
        questionStats[currentSubject][currentQuestionIndex] = {
            timeSpent: 0,
            visits: 1,
            lastVisit: Date.now()
        };
    } else {
        questionStats[currentSubject][currentQuestionIndex].visits++;
        questionStats[currentSubject][currentQuestionIndex].timeSpent += 
            (Date.now() - questionStats[currentSubject][currentQuestionIndex].lastVisit) / 1000;
        questionStats[currentSubject][currentQuestionIndex].lastVisit = Date.now();
    }
}

// Add function to show statistics in new window
function showStatistics() {
    // Calculate scores first
    const physicsScore = calculateSubjectScore('physics');
    const chemistryScore = calculateSubjectScore('chemistry');
    const mathsScore = calculateSubjectScore('maths');
    const totalScore = physicsScore + chemistryScore + mathsScore;
    const percentage = (totalScore / 200) * 100;

    // Calculate stats for each subject
    const physicsStats = calculateSubjectStats('physics');
    const chemistryStats = calculateSubjectStats('chemistry');
    const mathsStats = calculateSubjectStats('maths');

    // Calculate overall average time
    const overallAvgTime = (physicsStats.avgTimePerQ + chemistryStats.avgTimePerQ + mathsStats.avgTimePerQ) / 3;

    // Combine all stats
    const stats = {
        physics: physicsStats,
        chemistry: chemistryStats,
        maths: mathsStats,
        totalScore: totalScore,
        overallAvgTime: overallAvgTime
    };

    // Get performance message
    const performance = getGenZPerformanceMessage(totalScore);

    // Create the stats HTML with the calculated stats
    let statsHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${statsTitle}</title>
            <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
            <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
            <style>
                :root {
                    --primary: #2196F3;
                    --primary-dark: #1976D2;
                    --success: #4CAF50;
                    --warning: #f44336;
                    --bg-light: #f5f7ff;
                    --card-shadow: 0 4px 20px rgba(0,0,0,0.1);
                }

                body { 
                    font-family: 'Poppins', sans-serif; 
                    padding: 30px;
                    background: var(--bg-light);
                    color: #333;
                    line-height: 1.6;
                }

                .stats-container { 
                    max-width: 1200px; 
                    margin: 0 auto;
                    background: white;
                    padding: 40px;
                    border-radius: 30px;
                    box-shadow: var(--card-shadow);
                }

                .header {
                    text-align: center;
                    margin-bottom: 40px;
                    position: relative;
                    padding-bottom: 20px;
                }

                .header::after {
                    content: '';
                    position: absolute;
                    bottom: 0;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 100px;
                    height: 4px;
                    background: var(--primary);
                    border-radius: 2px;
                }

                .header h1 {
                    color: var(--primary);
                    font-size: 2.8em;
                    margin-bottom: 15px;
                    font-weight: 700;
                    text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
                }

                .student-details {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 20px;
                    max-width: 800px;
                    margin: 30px auto;
                    padding: 20px;
                    background: var(--bg-light);
                    border-radius: 15px;
                }

                .student-details p {
                    text-align: center;
                    font-size: 1.1em;
                }

                .charts-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 30px;
                    margin: 40px 0;
                }

                .chart-container {
                    background: white;
                    padding: 25px;
                    border-radius: 20px;
                    box-shadow: 0 2px 15px rgba(0,0,0,0.05);
                    transition: transform 0.3s ease;
                }

                .chart-container:hover {
                    transform: translateY(-5px);
                }

                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 30px;
                    margin: 40px 0;
                }

                .stats-card {
                    background: white;
                    padding: 25px;
                    border-radius: 20px;
                    box-shadow: 0 2px 15px rgba(0,0,0,0.05);
                    transition: all 0.3s ease;
                }

                .stats-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 5px 20px rgba(0,0,0,0.1);
                }

                .stats-card h3 {
                    color: var(--primary);
                    margin-bottom: 20px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 1.4em;
                }

                .stats-card h3 i {
                    background: var(--primary);
                    color: white;
                    padding: 10px;
                    border-radius: 12px;
                    font-size: 0.9em;
                }

                .stats-table {
                    width: 100%;
                    border-collapse: separate;
                    border-spacing: 0;
                    margin: 15px 0;
                    border-radius: 10px;
                    overflow: hidden;
                }

                .stats-table th, .stats-table td {
                    padding: 15px;
                    text-align: left;
                    border: 1px solid #eee;
                }

                .stats-table th {
                    background: var(--primary);
                    color: white;
                    font-weight: 500;
                }

                .stats-table tr:nth-child(even) {
                    background: #f8f9ff;
                }

                .stats-table tr:hover {
                    background: #f0f4ff;
                }

                .performance-card {
                    background: linear-gradient(145deg, #f6f8ff, #e3f2fd);
                    padding: 40px;
                    border-radius: 30px;
                    margin: 40px 0;
                    box-shadow: var(--card-shadow);
                }

                .performance-card h2 {
                    text-align: center;
                    color: var(--primary-dark);
                    margin-bottom: 30px;
                    font-size: 2.5em;
                    font-weight: 700;
                }

                .performance-message {
                    background: white;
                    padding: 30px;
                    border-radius: 20px;
                    text-align: center;
                    box-shadow: 0 2px 15px rgba(0,0,0,0.05);
                }

                .emoji-rating {
                    font-size: 4em;
                    margin: 20px 0;
                    animation: bounce 1s infinite;
                }

                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }

                .btn {
                    background: var(--primary);
                    color: white;
                    border: none;
                    padding: 15px 30px;
                    border-radius: 12px;
                    cursor: pointer;
                    font-size: 1.1em;
                    margin: 10px;
                    transition: all 0.3s ease;
                    display: inline-flex;
                    align-items: center;
                    gap: 10px;
                }

                .btn:hover {
                    background: var(--primary-dark);
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(33, 150, 243, 0.3);
                }

                .warning { color: var(--warning); }
                .success { color: var(--success); }

                @media (max-width: 768px) {
                    .stats-grid, .charts-grid {
                        grid-template-columns: 1fr;
                    }

                    .student-details {
                        grid-template-columns: 1fr;
                    }

                    .header h1 {
                        font-size: 2em;
                    }

                    .stats-container {
                        padding: 20px;
                    }
                }

                @media print {
                    body { 
                        background: white;
                        padding: 0;
                    }
                    .stats-container {
                        box-shadow: none;
                    }
                    .no-print {
                        display: none;
                    }
                    .print-info {
                        display: block;
                    }
                }
            </style>
        </head>
        <body>
            <div class="stats-container">
                <div class="header">
                    <h1>${statsTitle}</h1>
                    <div class="student-details">
                        <p><strong>Name:</strong> ${studentInfo.name}</p>
                        <p><strong>Date:</strong> ${studentInfo.date}</p>
                        <p><strong>FLT Number:</strong> ${studentInfo.fltNumber}</p>
                    </div>
                </div>

                <div class="print-info">
                    <input type="text" id="studentName" placeholder="Enter your name">
                    <input type="text" id="examDate" placeholder="Date">
                    <input type="text" id="examNumber" placeholder="Exam/FLT Number">
                </div>

                <div class="charts-grid">
                    <div class="chart-container">
                        <canvas id="subjectScores"></canvas>
                    </div>
                    <div class="chart-container">
                        <canvas id="timeDistribution"></canvas>
                    </div>
                </div>

                <div class="stats-grid">
                    <div class="stats-card">
                        <h3><i class="fas fa-clock"></i> Time Analysis</h3>
                        <div class="time-analysis">
                            <table class="stats-table">
                                <tr>
                                    <th>Subject</th>
                                    <th>Avg Time/Q</th>
                                    <th>Total Time</th>
                                    <th>Quick Ans (<30s)</th>
                                </tr>
                                <tr>
                                    <td>Physics ⚡</td>
                                    <td>${stats.physics.avgTimePerQ}s</td>
                                    <td>${stats.physics.totalTime}m</td>
                                    <td>${stats.physics.quickAnswers}</td>
                                </tr>
                                <tr>
                                    <td>Chemistry 🧪</td>
                                    <td>${stats.chemistry.avgTimePerQ}s</td>
                                    <td>${stats.chemistry.totalTime}m</td>
                                    <td>${stats.chemistry.quickAnswers}</td>
                                </tr>
                                <tr>
                                    <td>Mathematics 📐</td>
                                    <td>${stats.maths.avgTimePerQ}s</td>
                                    <td>${stats.maths.totalTime}m</td>
                                    <td>${stats.maths.quickAnswers}</td>
                                </tr>
                            </table>
                        </div>
                    </div>

                    <div class="stats-card">
                        <h3><i class="fas fa-flag"></i> Marked for Review Analysis</h3>
                        <div class="review-stats">
                            <table class="stats-table">
                                <tr>
                                    <th>Subject</th>
                                    <th>Marked</th>
                                    <th>Correct</th>
                                    <th>Accuracy</th>
                                </tr>
                                <tr>
                                    <td>Physics ⚡</td>
                                    <td>${stats.physics.markedCount}</td>
                                    <td>${stats.physics.markedCorrect}</td>
                                    <td>${stats.physics.markedAccuracy}%</td>
                                </tr>
                                <tr>
                                    <td>Chemistry 🧪</td>
                                    <td>${stats.chemistry.markedCount}</td>
                                    <td>${stats.chemistry.markedCorrect}</td>
                                    <td>${stats.chemistry.markedAccuracy}%</td>
                                </tr>
                                <tr>
                                    <td>Mathematics 📐</td>
                                    <td>${stats.maths.markedCount}</td>
                                    <td>${stats.maths.markedCorrect}</td>
                                    <td>${stats.maths.markedAccuracy}%</td>
                                </tr>
                            </table>
                        </div>
                    </div>

                    <div class="stats-card">
                        <h3><i class="fas fa-chart-line"></i> Performance Insights</h3>
                        <ul>
                            ${generateSmartAnalysis(stats)}
                        </ul>
                    </div>

                    <div class="stats-card">
                        <h3><i class="fas fa-lightbulb"></i> Recommendations</h3>
                        <ul>
                            ${generateGenZRecommendations(stats)}
                        </ul>
                    </div>
                </div>

                <div class="performance-card">
                    <h2>Overall Performance ${percentage >= 85 ? "🔥" : percentage >= 70 ? "💫" : percentage >= 50 ? "💪" : "📚"}</h2>
                    <div class="performance-details">
                        <div class="score-summary">
                            <h3>Score Breakdown</h3>
                            <p>Physics: ${physicsScore}/50 ${physicsScore >= 40 ? "🎯" : "📈"}</p>
                            <p>Chemistry: ${chemistryScore}/50 ${chemistryScore >= 40 ? "⚗️" : "🧪"}</p>
                            <p>Mathematics: ${mathsScore}/100 ${mathsScore >= 80 ? "🎲" : "📊"}</p>
                            <h4>Total: ${totalScore}/200 (${percentage.toFixed(1)}%)</h4>
                        </div>
                        
                        <div class="performance-message">
                            <div class="emoji-rating">
                                ${performance.emoji}
                            </div>
                            <p>
                                ${performance.message}
                            </p>
                        </div>
                    </div>
                </div>

                <div class="no-print" style="text-align: center; margin-top: 20px;">
                    <button class="btn" onclick="window.print()">
                        <i class="fas fa-print"></i> Print Report
                    </button>
                </div>
            </div>

            <script>
                // Subject Scores Chart
                new Chart(document.getElementById('subjectScores'), {
                    type: 'bar',
                    data: {
                        labels: ['Physics ⚡', 'Chemistry 🧪', 'Mathematics 📐'],
                        datasets: [{
                            label: 'Score',
                            data: [${physicsScore}, ${chemistryScore}, ${mathsScore}],
                            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            title: {
                                display: true,
                                text: 'Subject-wise Scores 📊'
                            }
                        }
                    }
                });

                // Time Distribution Chart
                new Chart(document.getElementById('timeDistribution'), {
                    type: 'doughnut',
                    data: {
                        labels: ['Physics ⚡', 'Chemistry 🧪', 'Mathematics 📐'],
                        datasets: [{
                            data: [
                                ${stats.physics.totalTime},
                                ${stats.chemistry.totalTime},
                                ${stats.maths.totalTime}
                            ],
                            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56']
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            title: {
                                display: true,
                                text: 'Time Distribution ⏰'
                            }
                        }
                    }
                });
            </script>
        </body>
        </html>
    `;

    const statsWindow = window.open('', '_blank');
    statsWindow.document.write(statsHTML);
}

// Helper function to calculate subject score
function calculateSubjectScore(subject) {
    let score = 0;
    questions[subject].forEach((question, index) => {
        if (question.correct && answers[subject][index] === question.correct) {
            score += (subject === 'maths') ? 2 : 1;
        }
    });
    return score;
}

// Helper function to calculate subject time in minutes
function calculateSubjectTime(subject) {
    const stats = questionStats[subject];
    let totalTime = 0;
    Object.values(stats).forEach(stat => {
        totalTime += stat.timeSpent;
    });
    return Math.round(totalTime / 60); // Convert seconds to minutes
}

// Add these functions
function validateStudentInfo() {
    const name = document.getElementById('studentName').value.trim();
    const date = document.getElementById('examDate').value.trim();
    const fltNumber = document.getElementById('fltNumber').value.trim();
    
    if (name && date && fltNumber) {
        studentInfo = { name, date, fltNumber };
        return true;
    }
    return false;
}

function startTest() {
    if (validateStudentInfo()) {
        document.getElementById('intro-page').style.display = 'none';
        startPCTimer();
        loadQuestion();
    } else {
        alert('Please fill in all the required information! 📝');
    }
}

// Add event listener for start button
document.getElementById('startTestBtn').addEventListener('click', startTest);

// Remove the automatic timer start from initialization
// Initialize the test
loadQuestion(); // Keep this to load the first question

// Add to event listeners section
document.getElementById('clearResponseBtn').addEventListener('click', clearResponse);
document.getElementById('viewStatsBtn').addEventListener('click', showStatistics);

// Update timer function to check for warning
function updateTimer() {
    // ... existing timer code ...
    checkTimeWarning();
}

// Add this function to check for 15-minute warning
function checkTimeWarning() {
    // Check PC timer
    if (pcTimeLeft === 900 && !isMathSectionUnlocked) { // 15 minutes in seconds
        showWarning("15 minutes remaining for Physics & Chemistry sections!");
    }
    // Check Math timer
    if (mathTimeLeft === 900 && isMathSectionUnlocked) {
        showWarning("15 minutes remaining for Mathematics section!");
    }
}

// Add helper function to show warning
function showWarning(message) {
    const warning = document.createElement('div');
    warning.className = 'time-warning';
    warning.innerHTML = `
        <div class="warning-content">
            <i class="fas fa-exclamation-triangle"></i>
            <p>${message}</p>
            <button onclick="this.parentElement.parentElement.remove()">OK</button>
        </div>
    `;
    document.body.appendChild(warning);
}

// Add helper function to calculate subject statistics
function calculateSubjectStats(subject) {
    const subjectStats = {
        totalTime: 0,
        avgTimePerQ: 0,
        quickAnswers: 0,
        markedCount: markedForReview[subject].size,
        markedCorrect: 0,
        markedAccuracy: 0,
        score: 0
    };

    // Calculate time stats
    Object.values(questionStats[subject]).forEach(stat => {
        subjectStats.totalTime += stat.timeSpent;
        if (stat.timeSpent < 30) { // Less than 30 seconds
            subjectStats.quickAnswers++;
        }
    });

    // Calculate average time per question
    subjectStats.avgTimePerQ = Math.round(subjectStats.totalTime / 50);
    subjectStats.totalTime = Math.round(subjectStats.totalTime / 60); // Convert to minutes

    // Calculate marked questions accuracy
    markedForReview[subject].forEach(qIndex => {
        if (answers[subject][qIndex] === questions[subject][qIndex].correct) {
            subjectStats.markedCorrect++;
        }
    });

    subjectStats.markedAccuracy = subjectStats.markedCount ? 
        Math.round((subjectStats.markedCorrect / subjectStats.markedCount) * 100) : 0;

    // Calculate score
    questions[subject].forEach((question, index) => {
        if (question.correct && answers[subject][index] === question.correct) {
            subjectStats.score += (subject === 'maths') ? 2 : 1;
        }
    });

    return subjectStats;
}

function generateGenZRecommendations(stats) {
    const recommendations = [];
    
    const timeManagementJokes = [
        "Question solve karne mein utna time laga rahe ho jitna Mangesh sir VJTI cutoff explain karne mein lagate hai ⏰",
        "Time management worse than Vinod sir ka farewell timing 💀",
        "3 lakh ka course hai, Netflix subscription nahi - itna time waste mat karo 🎬",
        "Speed itni slow hai, lagta hai Shelar sir ke lectures mein so gaye the 😴"
    ];

    const subjectSpecificJokes = {
        physics: [
            "Physics mein gravity ka law samajh aaya par marks gravity ke saath gir gaye 📉",
            "Newton ke 3 laws yaad hai par 3 marks bhi nahi aaye 🍎",
            "Shelar sir ko AIR 3 laane mein physics ne help ki, tumhe fail karane mein bhi physics hi help karegi ⚡"
        ],
        chemistry: [
            "Organic chemistry ne organic farming ki tarah time maang liya 🌱",
            "Periodic table yaad hai par periodic testing mein fail ho gaye 🧪",
            "Chemical bonding strong hai par marks se bonding weak hai 🔬"
        ],
        maths: [
            "Integration kar liya par marks aggregate nahi ho rahe 📊",
            "Probability padhi hai par passing probability calculate karne mein dar lag raha hai 🎲",
            "Mangesh sir ka VJTI cutoff calculation > tumhara maths calculation 🔢"
        ]
    };

    // Add recommendations based on stats with coaching references
    if (stats.overallAvgTime > 120) {
        recommendations.push(`<li class="warning">${timeManagementJokes[Math.floor(Math.random() * timeManagementJokes.length)]}</li>`);
    }

    ['physics', 'chemistry', 'maths'].forEach(subject => {
        if (stats[subject].markedAccuracy < 50) {
            recommendations.push(`<li class="warning">${subjectSpecificJokes[subject][Math.floor(Math.random() * subjectSpecificJokes[subject].length)]}</li>`);
        }
    });

    // Always add one positive note with coaching reference
    const positiveNotes = [
        "Boards ❌ JEE ❌ par CET mein abhi bhi hope hai! 🎯",
        "3 lakh ka investment hai, return toh leke hi jaana hai! 💪",
        "Shelar sir ka AIR 3 nahi toh kam se kam passing marks toh le aao 🎓",
        "VJTI CS na sahi, kuch toh mil hi jayega! 🎲"
    ];

    recommendations.push(`<li class="success">${positiveNotes[Math.floor(Math.random() * positiveNotes.length)]}</li>`);

    return recommendations.join('');
}

// Update the recommendations to be more analytical
function generateSmartAnalysis(stats) {
    const analysis = [];
    
    // Physics Analysis
    if (stats.physics.score < 25) {
        analysis.push(`<li class="warning"><strong>Physics:</strong> Numerical problems need attention. Focus on units and equations. Common mistake: Direct formula application without understanding units.</li>`);
    }

    // Chemistry Analysis
    if (stats.chemistry.quickAnswers > 15) {
        analysis.push(`<li class="warning"><strong>Chemistry:</strong> Too many rushed answers in organic chemistry. Take time to draw structures and mechanisms.</li>`);
    }

    // Maths Analysis
    if (stats.maths.markedAccuracy < 50) {
        analysis.push(`<li class="warning"><strong>Mathematics:</strong> High uncertainty in marked questions. Review integration and coordinate geometry fundamentals.</li>`);
    }

    // Time Management
    if (stats.overallAvgTime > 120) {
        analysis.push(`<li class="warning"><strong>Time Management:</strong> Spending ${stats.overallAvgTime}s average per question. Target: 90s for physics/chemistry, 120s for maths.</li>`);
    }

    // Add a positive note
    const positiveNote = stats.totalScore > 100 ? 
        `<li class="success">Strong performance in calculation-based questions. Keep practicing similar patterns.</li>` :
        `<li class="success">Good attempt at conceptual questions. Focus on solving more practice papers.</li>`;
    
    analysis.push(positiveNote);

    return analysis.join('');
}

// Rename the stats page title to something more engaging
const statsTitle = "CET Performance Report: From Shelar to Zondhale Scale 📊"; 