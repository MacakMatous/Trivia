let currentQuestionIndex = 0;
let score = 0;
let questions = [];
let userAnswers = [];
let quizSettings;
let totalQuestions = 0;
let quizFinished = false;

document.addEventListener('DOMContentLoaded', async function () {
  quizSettings = JSON.parse(localStorage.getItem('quizSettings'));

  if (!quizSettings) {
    window.location.href = 'index.html';
    return;
  }

  const quizState = localStorage.getItem('quizState');
  if (quizState !== 'inProgress') {
    window.location.href = 'index.html';
    return;
  }

  const loadingElement = document.getElementById('loading');
  const countdownElement = document.getElementById('countdown');
  if (loadingElement) {
    loadingElement.style.display = 'block';
  }

  // Calculate expected total questions upfront
  const { numEasyQuestions, numMediumQuestions, numHardQuestions } = quizSettings;
  totalQuestions = numEasyQuestions + numMediumQuestions + numHardQuestions;

  try {
    const { theme } = quizSettings;

    // Start the countdown and fetch questions simultaneously
    let countdown = 10;
    const countdownInterval = setInterval(() => {
      countdown--;
      countdownElement.textContent = countdown;
      if (countdown === 0) {
        clearInterval(countdownInterval);
      }
    }, 1000);

    // Fetch all questions
    if (numEasyQuestions > 0) {
      await fetchQuestions(theme, 'easy', numEasyQuestions);
    }
    if (numMediumQuestions > 0) {
      await delay(5000); // Delay for 5 seconds to respect the rate limit
      await fetchQuestions(theme, 'medium', numMediumQuestions);
    }
    if (numHardQuestions > 0) {
      await delay(5000); // Delay for 5 seconds to respect the rate limit
      await fetchQuestions(theme, 'hard', numHardQuestions);
    }

    // Verify all questions were fetched successfully
    if (questions.length !== totalQuestions) {
      throw new Error('Failed to fetch all required questions');
    }

    localStorage.setItem('questions', JSON.stringify(questions));

    if (loadingElement) {
      loadingElement.style.display = 'none';
    }

    displayQuestion();
  } catch (error) {
    console.error('Error fetching questions:', error);
    alert('Failed to fetch all required questions. Please try again.');
    window.location.href = 'index.html';
  }
});

const fetchQuestions = async (theme, difficulty, numQuestions) => {
  try {
    let url;
    if (theme === 'any') {
      url = `https://opentdb.com/api.php?amount=${numQuestions}&difficulty=${difficulty}`;
    } else {
      url = `https://opentdb.com/api.php?amount=${numQuestions}&category=${theme}&difficulty=${difficulty}`;
    }
    console.log(`Fetching ${difficulty} questions from URL: ${url}`);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (data.response_code !== 0) {
      throw new Error(`API error! response_code: ${data.response_code}`);
    }
    questions = questions.concat(data.results);
    console.log(`Fetched ${difficulty} questions:`, data.results); // Log fetched questions for debugging

    // Store fetched questions in localStorage
    localStorage.setItem('questions', JSON.stringify(questions));
  } catch (error) {
    console.error(`Failed to fetch ${difficulty} questions:`, error);
    alert(`Failed to fetch ${difficulty} questions. Please try again later.`);
  }
};

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const displayQuestion = () => {
  if (currentQuestionIndex >= totalQuestions) {
    localStorage.setItem('userAnswers', JSON.stringify(userAnswers));
    localStorage.setItem('finalScore', JSON.stringify(score));
    localStorage.setItem('quizState', 'completed'); // Update state to completed
    quizFinished = true; // Set the flag to true when the quiz is finished

    // Update high score if the current score is higher
    const highScore = JSON.parse(localStorage.getItem('highScore')) || 0;
    if (score > highScore) {
      localStorage.setItem('highScore', JSON.stringify(score));
    }
    window.location.href = 'results.html'; // Redirect to results page when questions finish
    return;
  }

  const question = questions[currentQuestionIndex];
  let answers = [...question.incorrect_answers, question.correct_answer];

  // Shuffle the answers
  const decodeHTML = str => new DOMParser().parseFromString(str, 'text/html').body.textContent;
  answers = shuffleArray(answers.map(decodeHTML));

  const questionText = document.getElementById('question');

  questionText.innerHTML = question.question;

  const difficultyText = document.createElement('p');
  difficultyText.textContent = `Difficulty: ${question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}`;
  difficultyText.classList.add('difficulty-text', question.difficulty);
  questionText.appendChild(difficultyText);

  const answersDiv = document.getElementById('answers');
  answersDiv.innerHTML = '';


  answers.forEach(answer => {
    const answerButton = document.createElement('button');
    answerButton.textContent = answer;
    answerButton.classList.add('answer-btn');
    answerButton.onclick = () => checkAnswer(answer, answerButton);
    answersDiv.appendChild(answerButton);
  });

  document.getElementById('next-question').style.display = 'none'; // Hide Next button initially
  document.getElementById('progress').textContent = `Question ${currentQuestionIndex + 1} / ${totalQuestions}`;
  document.getElementById('score').textContent = `Score: ${score}`; // Display current score

  // Save progress
  saveProgress();

};

const checkAnswer = (answer, button) => {
  const correctAnswer = questions[currentQuestionIndex].correct_answer;

  // Disable all answer buttons to prevent multiple clicks
  const answerButtons = document.querySelectorAll('.answer-btn');
  answerButtons.forEach(btn => btn.disabled = true);

  if (answer === correctAnswer) {
    button.classList.add('correct');
    const difficulty = questions[currentQuestionIndex].difficulty;
    score += difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3;
  } else {
    button.classList.add('incorrect');
    // Highlight the correct answer
    answerButtons.forEach(btn => {
      if (btn.textContent === correctAnswer) {
        btn.classList.add('correct');
      }
    });
  }

  userAnswers.push({ question: questions[currentQuestionIndex], selectedAnswer: answer });
  currentQuestionIndex++;
  document.getElementById('next-question').style.display = 'block';

  // Save progress
  saveProgress();
};

const saveProgress = () => {
  const progress = {
    currentQuestionIndex,
    score,
    questions,
    userAnswers
  };
  localStorage.setItem('quizProgress', JSON.stringify(progress));
};

const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const countQuestionsByDifficulty = (questions) => {
  return questions.reduce((counts, question) => {
    counts[question.difficulty] = (counts[question.difficulty] || 0) + 1;
    return counts;
  }, { easy: 0, medium: 0, hard: 0 });
};

document.getElementById('next-question').addEventListener('click', displayQuestion);

// Add confirmation when exiting or refreshing mid-game
window.addEventListener('beforeunload', function (e) {
  if (!quizFinished) {
    const confirmationMessage = 'Are you sure you want to leave? Your progress will be lost.';
    e.preventDefault();
    e.returnValue = confirmationMessage; // For most browsers
    return confirmationMessage; // For some older browsers
  }
});