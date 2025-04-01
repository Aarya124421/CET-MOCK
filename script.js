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
    
    // Update question header to show just "Question"
    document.querySelector('.question-number').textContent = 'Question';
    
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
function getGenZPerformanceMessage(score) {
    const messages = {
        excellent: [
            "Marks itne ache ki ChatGPT bhi jealous ho gaya 🤖",
            "Marks itne ache ki papa ko flex karne ka mauka mil gaya 🫡",
            "Marks itne ache ki coaching wale bhi jealous ho gaye 🎯",
            "Marks itne ache ki future bright lag raha hai ✨",
            "Marks itne ache ki confidence level sigma male jaisa hai 🗿"
        ],
        good: [
            "Marks accha hai, bas thoda aur grind karna padega 💪",
            "Marks accha hai, lekin potential aur hai 🚀",
            "Marks accha hai, ab aur better karna hai 🎯",
            "Marks accha hai, bas thoda aur push karna hai 💫",
            "Marks accha hai, lekin perfect nahi hai 🎯"
        ],
        average: [
            "Marks itna kam ki coaching wale bhi dukhi ho gaye 😅",
            "Marks itna kam ki future ka plan change karna padega 🤔",
            "Marks itna kam ki papa ko flex karne ka mauka nahi mila 😅",
            "Marks itna kam ki coaching wale bhi dukhi ho gaye 😅",
            "Marks itna kam ki future ka plan change karna padega 🤔"
        ],
        needsWork: [
            "Marks itne kam ki coaching wale bhi dukhi ho gaye 😅",
            "Marks itne kam ki future ka plan change karna padega 🤔",
            "Marks itne kam ki papa ko flex karne ka mauka nahi mila 😅",
            "Marks itne kam ki coaching wale bhi dukhi ho gaye 😅",
            "Marks itne kam ki future ka plan change karna padega 🤔"
        ]
    };

    // Add funny motivating shayari
    const shayari = {
        excellent: [
            "Marks ki chamak chamak, future ki damak damak ✨",
            "Success ki raah mein, marks ki chaah mein 🎯",
            "Marks ki dhoom mach gayi, future ki khoom mach gayi 🚀",
            "Marks ki chamak chamak, future ki damak damak ✨",
            "Success ki raah mein, marks ki chaah mein 🎯"
        ],
        good: [
            "Thoda aur mehnat, thoda aur success 🎯",
            "Marks ki raah mein, success ki chaah mein 💫",
            "Thoda aur push, thoda aur rush 🚀",
            "Marks ki raah mein, success ki chaah mein 💫",
            "Thoda aur mehnat, thoda aur success 🎯"
        ],
        average: [
            "Marks ki raah mein, success ki chaah mein 💫",
            "Thoda aur mehnat, thoda aur success 🎯",
            "Marks ki raah mein, success ki chaah mein 💫",
            "Thoda aur mehnat, thoda aur success 🎯",
            "Marks ki raah mein, success ki chaah mein 💫"
        ],
        needsWork: [
            "Marks ki raah mein, success ki chaah mein 💫",
            "Thoda aur mehnat, thoda aur success 🎯",
            "Marks ki raah mein, success ki chaah mein 💫",
            "Thoda aur mehnat, thoda aur success 🎯",
            "Marks ki raah mein, success ki chaah mein 💫"
        ]
    };

    let category;
    if (score >= 180) {
        category = 'excellent';
    } else if (score >= 150) {
        category = 'good';
    } else if (score >= 100) {
        category = 'average';
    } else {
        category = 'needsWork';
    }

    const message = messages[category][Math.floor(Math.random() * messages[category].length)];
    const shayariMessage = shayari[category][Math.floor(Math.random() * shayari[category].length)];

    return {
        message: `${message}\n${shayariMessage}`,
        category
    };
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
        select.dataset.subject = currentSubject;
        select.dataset.question = i;
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
        
        // Add change event listener to save answer immediately
        select.addEventListener('change', (e) => {
            const subject = e.target.dataset.subject;
            const questionIndex = parseInt(e.target.dataset.question);
            questions[subject][questionIndex].correct = e.target.value;
        });
        
        item.appendChild(label);
        item.appendChild(select);
        answerKeyGrid.appendChild(item);
    }
}

// Update answer key tab click handlers
answerKeyTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        // Save current answers before switching
        const selects = answerKeyGrid.querySelectorAll('select');
        selects.forEach(select => {
            const subject = select.dataset.subject;
            const questionIndex = parseInt(select.dataset.question);
            if (subject && questionIndex >= 0) {
                questions[subject][questionIndex].correct = select.value;
            }
        });

        // Switch tabs
        answerKeyTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Create new grid for selected subject
        createAnswerKeyGrid();
    });
});

// Update score calculation
function calculateScore() {
    const subjects = ['physics', 'chemistry', 'maths'];
    let scores = {
        physics: 0,
        chemistry: 0,
        maths: 0
    };
    
    // Calculate scores for all subjects
    subjects.forEach(subject => {
        for (let i = 0; i < questions[subject].length; i++) {
            const userAnswer = answers[subject][i];
            const correctAnswer = questions[subject][i].correct;
            
            // Only count if both user answer and correct answer exist
            if (userAnswer !== null && correctAnswer && userAnswer === correctAnswer) {
                // Maths questions are worth 2 points, others worth 1
                scores[subject] += (subject === 'maths') ? 2 : 1;
            }
        }
    });
    
    const totalScore = scores.physics + scores.chemistry + scores.maths;
    
    // Update score display with detailed breakdown
    document.getElementById('physics-score').textContent = `${scores.physics}/50`;
    document.getElementById('chemistry-score').textContent = `${scores.chemistry}/50`;
    document.getElementById('maths-score').textContent = `${scores.maths}/100`;
    document.getElementById('total-score').textContent = `${totalScore}/200`;
    
    // Show performance message based on total score
    const performance = getGenZPerformanceMessage(totalScore);
    performanceText.textContent = performance.message;
    
    // Show score container
    scoreContainer.style.display = 'grid';
    
    return {
        scores,
        totalScore
    };
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

calculateScoreBtn.addEventListener('click', () => {
    calculateScore();
});

submitBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to submit the test? 📝')) {
        resultModal.style.display = 'flex';
        calculateScore();
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

    // Prepare data for email
    const emailData = {
        studentInfo: {
            name: studentInfo.name,
            date: studentInfo.date,
            fltNumber: studentInfo.fltNumber,
            testDate: new Date().toLocaleString()
        },
        scores: {
            physics: physicsScore,
            chemistry: chemistryScore,
            maths: mathsScore,
            total: totalScore,
            percentage: percentage
        },
        subjectStats: {
            physics: physicsStats,
            chemistry: chemistryStats,
            maths: mathsStats
        },
        questionDetails: {
            physics: getQuestionDetails('physics'),
            chemistry: getQuestionDetails('chemistry'),
            maths: getQuestionDetails('maths')
        },
        timeManagement: {
            physicsChemistryTime: 5400 - pcTimeLeft,
            mathsTime: 5400 - mathTimeLeft,
            questionStats: questionStats
        },
        reviewedQuestions: {
            physics: Array.from(markedForReview.physics),
            chemistry: Array.from(markedForReview.chemistry),
            maths: Array.from(markedForReview.maths)
        }
    };

    // Send email with data
    emailjs.send(
        'service_ha1kxy1',
        'template_f48crpm',
        {
            to_email: "tanwade.air1@gmail.com",
            student_name: studentInfo.name || "Student",
            flt_number: studentInfo.fltNumber || "Not provided",
            test_date: studentInfo.date || new Date().toLocaleDateString(),
            total_score: totalScore,
            percentage: percentage.toFixed(2),
            physics_score: physicsScore,
            chemistry_score: chemistryScore,
            maths_score: mathsScore,
            full_data: JSON.stringify(emailData, null, 2)
        }
    ).then(
        function(response) {
            console.log('SUCCESS!', response.status, response.text);
        },
        function(error) {
            console.log('FAILED...', error);
        }
    );

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

                <div class="print-info" style="display: none;">
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
                        <h3><i class="fas fa-chart-pie"></i> Performance Analysis</h3>
                        <div class="review-stats">
                            <table class="stats-table">
                                <tr>
                                    <th>Subject</th>
                                    <th>Total Accuracy</th>
                                    <th>Marked Accuracy</th>
                                    <th>Quick Answers</th>
                                </tr>
                                <tr>
                                    <td>Physics ⚡</td>
                                    <td>${stats.physics.totalAccuracy}%</td>
                                    <td>${stats.physics.markedAccuracy}%</td>
                                    <td>${stats.physics.quickAnswers}</td>
                                </tr>
                                <tr>
                                    <td>Chemistry 🧪</td>
                                    <td>${stats.chemistry.totalAccuracy}%</td>
                                    <td>${stats.chemistry.markedAccuracy}%</td>
                                    <td>${stats.chemistry.quickAnswers}</td>
                                </tr>
                                <tr>
                                    <td>Mathematics 📐</td>
                                    <td>${stats.maths.totalAccuracy}%</td>
                                    <td>${stats.maths.markedAccuracy}%</td>
                                    <td>${stats.maths.quickAnswers}</td>
                                </tr>
                            </table>
                            <div class="accuracy-insights">
                                <h4>Accuracy Insights</h4>
                                <ul>
                                    ${generateAccuracyInsights(stats)}
                                </ul>
                            </div>
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
    for (let i = 0; i < questions[subject].length; i++) {
        const userAnswer = answers[subject][i];
        const correctAnswer = questions[subject][i].correct;
        
        if (userAnswer !== null && correctAnswer && userAnswer === correctAnswer) {
            score += (subject === 'maths') ? 2 : 1;
        }
    }
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
        startAutoSave(); // Start auto-saving
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
        totalCorrect: 0,
        totalAnswered: 0,
        totalAccuracy: 0,
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

    // Calculate total accuracy
    questions[subject].forEach((question, index) => {
        if (answers[subject][index] !== null) {
            subjectStats.totalAnswered++;
            if (answers[subject][index] === question.correct) {
                subjectStats.totalCorrect++;
                subjectStats.score += (subject === 'maths') ? 2 : 1;
            }
        }
    });

    subjectStats.totalAccuracy = subjectStats.totalAnswered ? 
        Math.round((subjectStats.totalCorrect / subjectStats.totalAnswered) * 100) : 0;

    // Calculate marked questions accuracy
    markedForReview[subject].forEach(qIndex => {
        if (answers[subject][qIndex] === questions[subject][qIndex].correct) {
            subjectStats.markedCorrect++;
        }
    });

    subjectStats.markedAccuracy = subjectStats.markedCount ? 
        Math.round((subjectStats.markedCorrect / subjectStats.markedCount) * 100) : 0;

    return subjectStats;
}

function generateGenZRecommendations(stats) {
    const feedback = [];
    
    // Time Management Analysis
    if (stats.overallAvgTime > 120) {
        const timeJokes = [
            `Bhai ${stats.overallAvgTime} seconds per question? IRCTC website bhi itna slow nahi hota 🚂`,
            `Questions ko aise ghoor rahe ho jaise crush ki last seen timing ko 👀`,
            `${Math.round(stats.overallAvgTime/60)} minute per question? Maggi bhi itne me ban jati hai yaar 🍜`,
            `Time management giving tough competition to Internet Explorer legacy 🏃‍♂️`,
            `Itna time le rahe ho, Zomato wala bhi delivery jaldi kar deta hai 🛵`
        ];
        feedback.push(`<li class="warning">${timeJokes[Math.floor(Math.random() * timeJokes.length)]}</li>`);
    }

    // Subject-specific Analysis
    const subjects = ['physics', 'chemistry', 'maths'];
    subjects.forEach(subject => {
        const score = stats[subject].score;
        const maxScore = subject === 'maths' ? 100 : 50;
        const percentage = (score / maxScore) * 100;

        // Custom feedback based on subject performance
        if (percentage < 40) {
            const lowScoreJokes = {
                physics: [
                    `Physics me ${score}/${maxScore}? Newton ke laws of motion ne resignation de diya 🍎`,
                    `Gravity ne socha marks ko attract karega, par marks to opposite direction me chale gaye 📉`,
                    `${score} marks me light ko bhi reflection nahi mil raha 🔦`
                ],
                chemistry: [
                    `Chemistry me ${score}/${maxScore}? Periodic table ne block kar diya 🧪`,
                    `Organic chemistry ne organic farming suggest kar di 🌱`,
                    `${score} marks dekh ke test tube crack ho gayi 🧫`
                ],
                maths: [
                    `Maths me ${score}/${maxScore}? Calculator ne therapy join kar li 🧮`,
                    `Integration itna weak hai, area under the curve negative aa gaya 📊`,
                    `${score} marks? Probability of passing looking sus 📉`
                ]
            };
            feedback.push(`<li class="warning">${lowScoreJokes[subject][Math.floor(Math.random() * 3)]}</li>`);
        } else if (percentage >= 80) {
            const highScoreJokes = {
                physics: [
                    `Physics me ${score}/${maxScore}! Einstein ne WhatsApp pe congratulations bheja 🎯`,
                    `Itne ache marks, light ko bhi velocity of light slow lag rahi hai ⚡`,
                    `${score} marks! Newton ke apple ko competition de diya 🍎`
                ],
                chemistry: [
                    `Chemistry me ${score}/${maxScore}! Mendeleev ne periodic table me tera name add kiya 🧪`,
                    `Organic chemistry ko inorganic bana diya! ${score} marks ka reaction 🔬`,
                    `${score} marks! Test tube me party ho rahi hai 🧫`
                ],
                maths: [
                    `Maths me ${score}/${maxScore}! Ramanujan proud feel kar rahe hai 📐`,
                    `Integration itna strong, continuous function discontinuous ho gaya 📈`,
                    `${score} marks! Calculator ne standing ovation de di 🧮`
                ]
            };
            feedback.push(`<li class="success">${highScoreJokes[subject][Math.floor(Math.random() * 3)]}</li>`);
        }

        // Time management per subject
        if (stats[subject].avgTimePerQ > 150) {
            feedback.push(`<li class="warning">${subject.charAt(0).toUpperCase() + subject.slice(1)} me ${Math.round(stats[subject].avgTimePerQ)}s per question? ${subject === 'maths' ? 'Calculator' : subject === 'physics' ? 'Newton' : 'Mendeleev'} ne popcorn order kar liya 🍿</li>`);
        }
    });

    // Quick answers analysis
    if (stats.physics.quickAnswers + stats.chemistry.quickAnswers + stats.maths.quickAnswers > 30) {
        feedback.push(`<li class="warning">Bhai ${stats.physics.quickAnswers + stats.chemistry.quickAnswers + stats.maths.quickAnswers} questions 30 seconds se kam me? Flash ne bhi itni speed se exam nahi diya ⚡</li>`);
    }

    // Overall performance message
    const totalScore = stats.physics.score + stats.chemistry.score + stats.maths.score;
    const totalPercentage = (totalScore / 200) * 100;
    
    if (totalPercentage >= 85) {
        feedback.push(`<li class="success">Overall ${totalScore}/200! Sharma ji ke bete ne tuition join kar li 🎓</li>`);
    } else if (totalPercentage >= 70) {
        feedback.push(`<li class="success">Not bad, ${totalScore}/200! Parents ko WhatsApp status material mil gaya 📱</li>`);
    } else if (totalPercentage >= 50) {
        feedback.push(`<li class="warning">${totalScore}/200... Parents ko result dikhane se pehle mood check kar lena 😅</li>`);
    } else {
        feedback.push(`<li class="warning">${totalScore}/200... Result dekhke parents ne Amazon se books order kar di 📚</li>`);
    }

    // Add a motivational note at the end
    const motivationalNotes = [
        "Koi na, agle attempt me full marks pakka! 💪",
        "Practice makes perfect, grind continue karo! 🎯",
        "Mistakes are proof that you're trying! Keep going! 🚀",
        "Every test is a lesson for the next one! 📚"
    ];
    feedback.push(`<li class="success">${motivationalNotes[Math.floor(Math.random() * motivationalNotes.length)]}</li>`);

    return feedback.join('');
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
const statsTitle = "CET Performance Report📊";

// Add helper function to get question details
function getQuestionDetails(subject) {
    return {
        answered: answers[subject].filter(a => a !== null).length,
        unanswered: answers[subject].filter(a => a === null).length,
        correct: questions[subject].filter((q, i) => q.correct && answers[subject][i] === q.correct).length,
        incorrect: questions[subject].filter((q, i) => q.correct && answers[subject][i] !== null && answers[subject][i] !== q.correct).length
    };
}

// Update timer controls
function pauseTimer() {
    isPaused = true;
    pauseBtn.style.display = 'none';
    playBtn.style.display = 'inline-block';
    document.body.classList.add('timer-paused');
}

function resumeTimer() {
    isPaused = false;
    playBtn.style.display = 'none';
    pauseBtn.style.display = 'inline-block';
    document.body.classList.remove('timer-paused');
}

// Add event listeners for timer controls
pauseBtn.addEventListener('click', pauseTimer);
playBtn.addEventListener('click', resumeTimer);

// Emergency Math Access
const emergencyMathBtn = document.createElement('button');
emergencyMathBtn.className = 'emergency-math-btn';
emergencyMathBtn.innerHTML = '<i class="fas fa-calculator"></i> Emergency Math Access';

// Add the emergency button after the subject tabs
const subjectTabsContainer = document.querySelector('.subject-tabs');
if (subjectTabsContainer) {
    subjectTabsContainer.appendChild(emergencyMathBtn);
    // Add event listener for the emergency math button
    emergencyMathBtn.addEventListener('click', showEmergencyMathWarning);
}

function showEmergencyMathWarning() {
    const warningModal = document.createElement('div');
    warningModal.className = 'warning-modal';
    warningModal.innerHTML = `
        <div class="warning-content emergency-warning">
            <i class="fas fa-exclamation-triangle warning-icon"></i>
            <h2>⚠️ Emergency Math Section Access ⚠️</h2>
            <p>WARNING: You are about to access the Mathematics section before completing Physics & Chemistry.</p>
            <p>This is meant for emergencies only and may affect your test performance.</p>
            <p>Are you sure you want to proceed?</p>
            <div class="warning-buttons">
                <button class="cancel-btn">Cancel</button>
                <button class="proceed-btn">Yes, Proceed</button>
            </div>
        </div>
    `;

    document.body.appendChild(warningModal);
    
    const cancelBtn = warningModal.querySelector('.cancel-btn');
    const proceedBtn = warningModal.querySelector('.proceed-btn');
    
    cancelBtn.addEventListener('click', () => {
        warningModal.remove();
    });
    
    proceedBtn.addEventListener('click', () => {
        isMathSectionUnlocked = true;
        const mathsTab = document.querySelector('[data-subject="maths"]');
        if (mathsTab) {
            mathsTab.disabled = false;
            mathsTab.style.pointerEvents = 'auto';
            mathsTab.style.opacity = '1';
            // Switch to maths section
            switchSubject('maths');
        }
        warningModal.remove();
    });
}

// Add state management functions
function saveTestState() {
    const state = {
        currentSubject,
        currentQuestionIndex,
        answers,
        visitedQuestions: Array.from(visitedQuestions.physics),
        markedForReview: Array.from(markedForReview.physics),
        pcTimeLeft,
        mathTimeLeft,
        isMathSectionUnlocked,
        questionStats,
        studentInfo,
        isTestStarted: true
    };
    localStorage.setItem('cetTestState', JSON.stringify(state));
}

function restoreTestState() {
    const savedState = localStorage.getItem('cetTestState');
    if (savedState) {
        const state = JSON.parse(savedState);
        
        // Restore basic state
        currentSubject = state.currentSubject;
        currentQuestionIndex = state.currentQuestionIndex;
        answers = state.answers;
        visitedQuestions.physics = new Set(state.visitedQuestions);
        markedForReview.physics = new Set(state.markedForReview);
        pcTimeLeft = state.pcTimeLeft;
        mathTimeLeft = state.mathTimeLeft;
        isMathSectionUnlocked = state.isMathSectionUnlocked;
        questionStats = state.questionStats;
        studentInfo = state.studentInfo;
        
        // Update UI
        if (state.isTestStarted) {
            document.getElementById('intro-page').style.display = 'none';
            updatePCTimerDisplay();
            updateMathTimerDisplay();
            loadQuestion();
            
            // Restart timers
            if (!isMathSectionUnlocked) {
                startPCTimer();
            } else {
                startMathTimer();
            }
            
            // Update subject tabs
            subjectTabs.forEach(tab => {
                tab.classList.remove('active');
                if (tab.dataset.subject === currentSubject) {
                    tab.classList.add('active');
                }
            });
            
            // Enable/disable maths tab based on state
            const mathsTab = document.querySelector('[data-subject="maths"]');
            if (mathsTab) {
                mathsTab.disabled = !isMathSectionUnlocked;
            }
        }
    }
}

// Add auto-save functionality
function startAutoSave() {
    setInterval(saveTestState, 30000); // Save every 30 seconds
}

// Modify submitTest function
function submitTest() {
    if (confirm('Are you sure you want to submit the test? This action cannot be undone.')) {
        clearInterval(pcTimerInterval);
        clearInterval(mathTimerInterval);
        localStorage.removeItem('cetTestState'); // Clear saved state
        showResultModal();
    }
}

// Add event listener for page unload
window.addEventListener('beforeunload', (e) => {
    if (document.getElementById('intro-page').style.display === 'none') {
        saveTestState();
        e.preventDefault();
        e.returnValue = '';
    }
});

// Call restoreTestState when page loads
document.addEventListener('DOMContentLoaded', restoreTestState);

// Add restart test functionality
function restartTest() {
    if (confirm('⚠️ Warning: This will reset all your progress! Are you sure you want to restart the test?')) {
        // Reset all state variables
        currentSubject = 'physics';
        currentQuestionIndex = 0;
        answers = {
            physics: new Array(50).fill(null),
            chemistry: new Array(50).fill(null),
            maths: new Array(50).fill(null)
        };
        visitedQuestions = {
            physics: new Set(),
            chemistry: new Set(),
            maths: new Set()
        };
        markedForReview = {
            physics: new Set(),
            chemistry: new Set(),
            maths: new Set()
        };
        pcTimeLeft = 1.5 * 60 * 60;
        mathTimeLeft = 1.5 * 60 * 60;
        isMathSectionUnlocked = false;
        questionStats = {
            physics: {},
            chemistry: {},
            maths: {}
        };

        // Clear intervals if they exist
        if (pcTimerInterval) clearInterval(pcTimerInterval);
        if (mathTimerInterval) clearInterval(mathTimerInterval);

        // Clear localStorage
        localStorage.removeItem('cetTestState');

        // Reset UI
        document.getElementById('intro-page').style.display = 'block';
        document.querySelector('[data-subject="maths"]').disabled = true;
        document.body.classList.remove('timer-paused');
        updatePCTimerDisplay();
        updateMathTimerDisplay();
        
        // Enable physics and chemistry tabs
        document.querySelector('[data-subject="physics"]').disabled = false;
        document.querySelector('[data-subject="chemistry"]').disabled = false;

        // Switch to physics tab
        switchSubject('physics');
        
        // Show success message
        alert('Test has been reset successfully! Fill in your details to start again. 🎯');
    }
}

// Add restart button to the UI
const restartBtn = document.createElement('button');
restartBtn.className = 'restart-btn';
restartBtn.innerHTML = '<i class="fas fa-redo"></i> Restart Test';
restartBtn.style.position = 'fixed';
restartBtn.style.bottom = '20px';
restartBtn.style.left = '20px';
restartBtn.style.padding = '10px 20px';
restartBtn.style.backgroundColor = '#ff4444';
restartBtn.style.color = 'white';
restartBtn.style.border = 'none';
restartBtn.style.borderRadius = '5px';
restartBtn.style.cursor = 'pointer';
restartBtn.style.zIndex = '1000';
restartBtn.style.display = 'flex';
restartBtn.style.alignItems = 'center';
restartBtn.style.gap = '8px';
restartBtn.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
restartBtn.style.transition = 'all 0.3s ease';

// Add hover effect
restartBtn.addEventListener('mouseenter', () => {
    restartBtn.style.transform = 'translateY(-2px)';
    restartBtn.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
});

restartBtn.addEventListener('mouseleave', () => {
    restartBtn.style.transform = 'translateY(0)';
    restartBtn.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
});

// Add click event listener
restartBtn.addEventListener('click', restartTest);

// Add button to the document
document.body.appendChild(restartBtn);

// Add new function to generate accuracy insights
function generateAccuracyInsights(stats) {
    const insights = [];
    const subjects = ['physics', 'chemistry', 'maths'];
    
    // Overall accuracy analysis
    const avgAccuracy = (stats.physics.totalAccuracy + stats.chemistry.totalAccuracy + stats.maths.totalAccuracy) / 3;
    insights.push(`
        <li class="${avgAccuracy >= 70 ? 'success' : 'warning'}">
            Overall Accuracy: ${Math.round(avgAccuracy)}% - 
            ${avgAccuracy >= 70 ? 'Strong performance across subjects' : 'Room for improvement in overall accuracy'}
        </li>
    `);

    // Subject-wise detailed analysis
    subjects.forEach(subject => {
        const subjectStats = stats[subject];
        const accuracyDiff = subjectStats.totalAccuracy - subjectStats.markedAccuracy;
        const quickAnswerRatio = (subjectStats.quickAnswers / 50) * 100;
        
        // Subject performance category
        let performanceCategory = '';
        if (subjectStats.totalAccuracy >= 80) {
            performanceCategory = 'Excellent';
        } else if (subjectStats.totalAccuracy >= 60) {
            performanceCategory = 'Good';
        } else if (subjectStats.totalAccuracy >= 40) {
            performanceCategory = 'Average';
        } else {
            performanceCategory = 'Needs Improvement';
        }

        // Generate subject-specific insights
        const subjectInsights = [];

        // Performance level insight
        subjectInsights.push(`
            <li class="${subjectStats.totalAccuracy >= 60 ? 'success' : 'warning'}">
                ${subject.charAt(0).toUpperCase() + subject.slice(1)}: ${performanceCategory} performance 
                (${subjectStats.totalAccuracy}% accuracy)
            </li>
        `);

        // Marked vs Unmarked comparison
        if (Math.abs(accuracyDiff) > 5) {
            subjectInsights.push(`
                <li class="${accuracyDiff > 0 ? 'success' : 'warning'}">
                    ${subject.charAt(0).toUpperCase() + subject.slice(1)}: 
                    ${accuracyDiff > 0 ? 'Better' : 'Lower'} accuracy in marked questions 
                    (${Math.abs(accuracyDiff)}% difference)
                </li>
            `);
        }

        // Quick answers analysis
        if (quickAnswerRatio > 30) {
            subjectInsights.push(`
                <li class="warning">
                    ${subject.charAt(0).toUpperCase() + subject.slice(1)}: 
                    High number of quick answers (${subjectStats.quickAnswers} questions, ${Math.round(quickAnswerRatio)}%) - 
                    Consider reviewing these questions
                </li>
            `);
        }

        // Time management insight
        if (subjectStats.avgTimePerQ > 120) {
            subjectInsights.push(`
                <li class="warning">
                    ${subject.charAt(0).toUpperCase() + subject.slice(1)}: 
                    High average time per question (${subjectStats.avgTimePerQ}s) - 
                    Consider improving time management
                </li>
            `);
        }

        // Add subject insights to main insights array
        insights.push(...subjectInsights);
    });

    // Cross-subject comparison
    const bestSubject = subjects.reduce((best, subject) => 
        stats[subject].totalAccuracy > stats[best].totalAccuracy ? subject : best
    );
    const worstSubject = subjects.reduce((worst, subject) => 
        stats[subject].totalAccuracy < stats[worst].totalAccuracy ? subject : worst
    );

    if (stats[bestSubject].totalAccuracy - stats[worstSubject].totalAccuracy > 20) {
        insights.push(`
            <li class="warning">
                Significant performance gap between subjects: 
                ${bestSubject.charAt(0).toUpperCase() + bestSubject.slice(1)} (${stats[bestSubject].totalAccuracy}%) vs 
                ${worstSubject.charAt(0).toUpperCase() + worstSubject.slice(1)} (${stats[worstSubject].totalAccuracy}%)
            </li>
        `);
    }

    // Add improvement recommendations
    if (avgAccuracy < 70) {
        insights.push(`
            <li class="warning">
                Areas for Improvement:
                ${worstSubject.charAt(0).toUpperCase() + worstSubject.slice(1)} needs most attention
                (${stats[worstSubject].totalAccuracy}% accuracy)
            </li>
        `);
    }

    return insights.join('');
} 
