const onQuestionsChangeCallbacks = [];
export function onQuestionsChange(callback) {
    onQuestionsChangeCallbacks.push(callback);
}
const onAnswersChangeCallbacks = [];
export function onAnswersChange(callback) {
    onAnswersChangeCallbacks.push(callback);
}
export function triggerOnQuestionsChange() {
    onQuestionsChangeCallbacks.forEach((callback) => callback());
}
export function triggerOnAnswersChange() {
    onAnswersChangeCallbacks.forEach((callback) => callback());
}
export function resetFeedbackToUnknown(questionUuid) {
    const unknownRadio = document.querySelector(`input[name="feedback-${questionUuid}"][value="unknown"]`);
    if (unknownRadio) {
        unknownRadio.checked = true;
    }
}
export function onAnswerInputChange(event) {
    const target = event.target;
    const questionUuid = target.getAttribute("data-id");
    if (questionUuid) {
        resetFeedbackToUnknown(questionUuid);
    }
    triggerOnAnswersChange();
}
export function addQuestion(question, triggerChange = true) {
    const uuid = question ? question.uuid : crypto.randomUUID();
    const questionsContainer = document.querySelector("#create-questions-container");
    const questionElement = document.createElement("div");
    questionElement.classList.add("question");
    questionElement.id = uuid;
    questionElement.innerHTML = `
    <label for="question-${uuid}" onInput="triggerOnQuestionsChange()">Question :</label>
    <input type="text" id="question-${uuid}" onInput="triggerOnQuestionsChange()" name="question" required>
    <div class="options">
      <label>
        <input type="radio" name="type-${uuid}" value="short" onChange="triggerOnQuestionsChange()" checked>
        Réponse courte
      </label>
      <label>
        <input type="radio" name="type-${uuid}" value="long" onChange="triggerOnQuestionsChange()">
        Réponse longue
      </label>
    </div>
    <button class="remove-question" onclick="removeQuestion(event)">Supprimer</button>
  `;
    questionsContainer.appendChild(questionElement);
    if (question) {
        const input = questionElement.querySelector('input[name="question"]');
        input.value = question.statement;
        const typeInput = questionElement.querySelector(`input[name="type-${uuid}"][value="${question.type}"]`);
        typeInput.checked = true;
    }
    if (triggerChange) {
        triggerOnQuestionsChange();
    }
}
export function removeQuestion(event) {
    const target = event.target;
    if (target.classList.contains("remove-question")) {
        const questionElement = target.parentElement;
        // On s'assure que l'élément a la classe "question"
        if (questionElement?.classList.contains("question")) {
            questionElement.remove();
        }
    }
    triggerOnQuestionsChange();
}
export function getQuestions() {
    const questions = [];
    const questionElements = document.querySelectorAll(".question");
    questionElements.forEach((question) => {
        const input = question.querySelector('input[name="question"]');
        const statement = input?.value.trim();
        const checkedType = question.querySelector('input[name^="type-"]:checked')?.value;
        const type = checkedType === "long" ? "long" : "short";
        if (statement) {
            questions.push({ uuid: question.id, statement, type });
        }
    });
    return questions;
}
export function clearQuestions() {
    const questionsContainer = document.querySelector("#create-questions-container");
    questionsContainer.innerHTML = "";
}
export function setQuestions(questions, triggerChange = true) {
    clearQuestions();
    questions.forEach((question) => {
        addQuestion({ ...question }, triggerChange);
    });
}
export function getAnswers() {
    const answers = {};
    const questionElements = document.querySelectorAll(".question-to-answer");
    questionElements.forEach((questionElement) => {
        const answerInput = questionElement.querySelector(".answer-input");
        const answer = answerInput?.value.trim();
        const questionId = answerInput?.getAttribute("data-id");
        if (answer && questionId) {
            // Get the selected feedback radio button
            const selectedFeedback = questionElement.querySelector('input[name^="feedback-"]:checked');
            const feedbackValue = selectedFeedback?.value;
            answers[questionId] = {
                content: answer,
                feedback: feedbackValue || "unknown"
            };
        }
    });
    console.log(answers);
    return answers;
}
export function setAnswers(answers, triggerChange = true) {
    Object.entries(answers).forEach(([id, answer]) => {
        const answerInput = document.querySelector(`#answer-${id}`);
        if (answerInput) {
            answerInput.value = answer.content;
            // Set the feedback radio button if feedback is provided
            if (answer.feedback) {
                const feedbackRadio = document.querySelector(`input[name="feedback-${id}"][value="${answer.feedback}"]`);
                if (feedbackRadio) {
                    feedbackRadio.checked = true;
                }
            }
        }
    });
    if (triggerChange) {
        triggerOnAnswersChange();
    }
}
export function updateAnswerContainer(type) {
    const questions = getQuestions();
    const answerContainer = document.querySelector("#answer-questions-container");
    // On vide le conteneur d'aperçu
    answerContainer.innerHTML = type === "preview" ? "<h2>Aperçu du questionnaire (vue élève)</h2>" : "";
    let questionsListHtml = "<div class='questions-list'>";
    questions.forEach((question) => {
        let questionHtml = `<div class="question-to-answer">
      <div class="question-content">
        <div class="question-statement">${question.statement}</div>`;
        if (question.type === "short") {
            questionHtml += `<input type="text" onInput="onAnswerInputChange(event)" data-id="${question.uuid}" id="answer-${question.uuid}" class="answer-input short-answer" placeholder="Votre réponse ici..."${type === "correct" ? " disabled" : ""}>`;
        }
        else {
            questionHtml += `<textarea onInput="onAnswerInputChange(event)" data-id="${question.uuid}" id="answer-${question.uuid}" class="answer-input long-answer" placeholder="Votre réponse ici..."${type === "correct" ? " disabled" : ""}></textarea>`;
        }
        questionHtml += `</div>
      <div class="feedback-buttons">
        <label class="feedback-button correct">
          <input onChange="triggerOnAnswersChange()" type="radio" name="feedback-${question.uuid}" value="correct" onchange="triggerOnAnswersChange()">
          <span class="feedback-icon">✓</span>
        </label>
        <label class="feedback-button unknown">
          <input onChange="triggerOnAnswersChange()" type="radio" name="feedback-${question.uuid}" value="unknown" checked>
          <span class="feedback-icon">?</span>
        </label>
        <label class="feedback-button error">
          <input onChange="triggerOnAnswersChange()" type="radio" name="feedback-${question.uuid}" value="error">
          <span class="feedback-icon">✗</span>
        </label>
      </div>
    </div>`;
        questionsListHtml += questionHtml;
    });
    questionsListHtml += `</div>`;
    answerContainer.innerHTML += questionsListHtml;
    if (Object.keys(questions).length === 0) {
        answerContainer.innerHTML +=
            '<p class="empty">Aucune question ajoutée.</p>';
    }
}
export function previewSurvey() {
    const questionsContainer = document.querySelector("#create-questions-container");
    const answerContainer = document.querySelector("#answer-questions-container");
    const addQuestionButton = document.querySelector("#add-question");
    const previewButton = document.querySelector("#preview");
    const editButton = document.querySelector("#edit");
    // On masque l'éditeur et on affiche le mode aperçu
    questionsContainer.style.display = "none";
    addQuestionButton.style.display = "none";
    previewButton.style.display = "none";
    editButton.style.display = "inline-block";
    updateAnswerContainer("preview");
    answerContainer.style.display = "block";
}
export function editSurvey() {
    const questionsContainer = document.querySelector("#create-questions-container");
    const answerContainer = document.querySelector("#answer-questions-container");
    const addQuestionButton = document.querySelector("#add-question");
    const previewButton = document.querySelector("#preview");
    const editButton = document.querySelector("#edit");
    // On masque le mode aperçu et on affiche l'éditeur
    questionsContainer.style.display = "block";
    answerContainer.style.display = "none";
    addQuestionButton.style.display = "inline-block";
    previewButton.style.display = "inline-block";
    editButton.style.display = "none";
}
export function answerSurvey() {
    const questionsContainer = document.querySelector("#create-questions-container");
    const answerContainer = document.querySelector("#answer-questions-container");
    const menu = document.querySelector("menu");
    // On masque le mode aperçu et on affiche l'éditeur
    questionsContainer.style.display = "none";
    answerContainer.style.display = "block";
    menu.style.display = "none";
}
export function correctSurvey() {
    console.log("Correction du sondage");
    answerSurvey();
    const answerContainer = document.querySelector("#answer-questions-container");
    answerContainer.classList.add("correction-mode");
    const inputsAndTextareas = document.querySelectorAll(".answer-input");
    inputsAndTextareas.forEach((el) => {
        el.disabled = true;
    });
}
export function changeTheme(theme) {
    const body = document.body;
    body.setAttribute("data-theme", theme);
}
export function showApp() {
    const loadingScreen = document.getElementById("loading-screen");
    const app = document.getElementById("app");
    loadingScreen.style.display = "none";
    app.style.display = "block";
}
//# sourceMappingURL=script.js.map