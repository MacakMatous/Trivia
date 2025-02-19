let currentQuestionIndex = 0;
let score = 0;
let questions = [];
let userAnswers = [];
let quizSettings;
let totalQuestions = 0;

document.addEventListener('DOMContentLoaded', async function () {
  quizSettings = JSON.parse(localStorage.getItem('quizSettings'));

  if (!quizSettings) {
    window.location.href = 'index.html'; // If no settings, redirect to landing page
    return;
  }

  // Check if the user is allowed to be on this page
  const quizState = localStorage.getItem('quizState');
  if (quizState !== 'inProgress') {
    window.location.href = 'index.html'; // Redirect to landing page if not in progress
    return;
  }

  // Check if progress is already saved
  const savedProgress = JSON.parse(localStorage.getItem('quizProgress'));
  if (savedProgress) {
    currentQuestionIndex = savedProgress.currentQuestionIndex;
    score = savedProgress.score;
    questions = savedProgress.questions;
    userAnswers = savedProgress.userAnswers;
    totalQuestions = questions.length;
    displayQuestion();
    return;
  }

  // Check if questions are already fetched and stored in localStorage
  const storedQuestions = JSON.parse(localStorage.getItem('questions'));
  if (storedQuestions && storedQuestions.length > 0) {
    questions = storedQuestions;
    totalQuestions = questions.length;

    // Verify if the stored questions match the required number of questions
    const { numEasyQuestions, numMediumQuestions, numHardQuestions } = quizSettings;
    const questionCounts = countQuestionsByDifficulty(storedQuestions);

    if (
      questionCounts.easy === numEasyQuestions &&
      questionCounts.medium === numMediumQuestions &&
      questionCounts.hard === numHardQuestions
    ) {
      displayQuestion();
      return;
    }
  }

  // Debugging: Log the quiz settings
  console.log('Quiz Settings:', quizSettings);

  // Calculate the total number of questions
  const { theme, numEasyQuestions, numMediumQuestions, numHardQuestions } = quizSettings;
  totalQuestions = numEasyQuestions + numMediumQuestions + numHardQuestions;

  // Debugging: Log the total number of questions
  console.log('Total Questions:', totalQuestions);

  // Show loading indicator
  const loadingElement = document.getElementById('loading');
  if (loadingElement) {
    loadingElement.style.display = 'block';
  }

  try {
    let isFirstFetch = true;

    // Fetch questions based on the settings
    if (numEasyQuestions > 0) {
      await fetchQuestions(theme, 'easy', numEasyQuestions, isFirstFetch);
      isFirstFetch = false;
    }
    if (numMediumQuestions > 0) {
      await fetchQuestions(theme, 'medium', numMediumQuestions, isFirstFetch);
      isFirstFetch = false;
    }
    if (numHardQuestions > 0) {
      await fetchQuestions(theme, 'hard', numHardQuestions, isFirstFetch);
    }

    // Store fetched questions in localStorage
    localStorage.setItem('questions', JSON.stringify(questions));

    // Hide loading indicator
    if (loadingElement) {
      loadingElement.style.display = 'none';
    }

    // Display the first question
    displayQuestion();
  } catch (error) {
    alert('Failed to fetch questions. Please try again later.');
    console.error(error);
  }
});

const fetchQuestions = async (theme, difficulty, numQuestions, isFirstFetch) => {
  if (!isFirstFetch) {
    await delay(5000); // Delay for 5 seconds to respect the rate limit
  }

  try {
    let url;
    if (theme === 'any') {
      url = `https://opentdb.com/api.php?amount=${numQuestions}&difficulty=${difficulty}&type=multiple`;
    } else {
      url = `https://opentdb.com/api.php?amount=${numQuestions}&category=${theme}&difficulty=${difficulty}&type=multiple`;
    }
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

    // Display the first question as soon as it's fetched
    if (currentQuestionIndex === 0) {
      displayQuestion();
    }
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

    // Update high score if the current score is higher
    const highScore = JSON.parse(localStorage.getItem('highScore')) || 0;
    if (score > highScore) {
      localStorage.setItem('highScore', JSON.stringify(score));
    }

    window.location.href = 'results.html'; // Redirect to results page when questions finish
    return;
  }

  const question = questions[currentQuestionIndex];
  const answers = [...question.incorrect_answers, question.correct_answer];

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

  if (answer === correctAnswer) {
    button.classList.add('correct');
    const difficulty = questions[currentQuestionIndex].difficulty;
    score += difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3;
  } else {
    button.classList.add('incorrect');
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

const countQuestionsByDifficulty = (questions) => {
  return questions.reduce((counts, question) => {
    counts[question.difficulty] = (counts[question.difficulty] || 0) + 1;
    return counts;
  }, { easy: 0, medium: 0, hard: 0 });
};

document.getElementById('next-question').addEventListener('click', displayQuestion);
