// How many question to ask per quiz?
const QUESTION_TO_ASK = 10

// Keep track of the number of question asked and total score
let questionCount = 1
let score = 0

// Helper to retrieve a parameter from the URL
function getUrlVars() {
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
        vars[key] = value;
    });
    return vars;
}

// Look for the module param in the URL and set the relevant variable is found
function getModule() {
    var module_id = getUrlVars()["module"]
    // Hide forms if there is no module set
    if (module_id === undefined || module_id === "") {
        document.getElementById("question-section").style.display = "none"
    } else {
        document.getElementById("module-id-title").innerHTML = module_id
        document.getElementById("module-id-field").value = module_id
        document.getElementById("select-module").value = module_id
    }
}

// Calculate the progress
function getProgress() {
    return questionCount / QUESTION_TO_ASK
}

// Show an error message if a field is left empty
function somethingEmpty() {
    document.getElementById("something-empty").style.display = "block"
}

// Change/set module when selected in the dropdown menu
function selectModule(path) {
    module = document.getElementById("select-module").value
    document.location = "?module=" + module
}

// Get a question to answer from the server
function getQuestion() {
    var moduleId = document.getElementById("module-id-field").value
    if (moduleId === undefined || moduleId === "") {
        return;
    }
    const xhr = new XMLHttpRequest();
    const url = '/question/' + moduleId + "/" + getProgress();
    xhr.open("GET", url);
    xhr.onreadystatechange = (e) => {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            var status = xhr.status;
            if (status === 0 || (status >= 200 && status < 400)) {
                showQuestion(JSON.parse(xhr.responseText))
            }
        }
    }
    xhr.send();
}

// Parse json response from the server to show a question to answer
function showQuestion(json) {
    document.getElementById("question-id").value = json.id
    document.getElementById("submit-answer").style.display = "block"
    document.getElementById("answer-form").style.display = "none"
    document.getElementById("question-form").style.display = "block"
    document.getElementById("waiting").style.display = "none"
    document.getElementById("progress").innerHTML = questionCount + "/" + QUESTION_TO_ASK
    document.getElementById("question").innerHTML = json.question_text
    document.getElementById("answer-a").innerHTML = json.answer_a
    document.getElementById("answer-b").innerHTML = json.answer_b
    document.getElementById("answer-c").innerHTML = json.answer_c
}

// Parse json response from the server to show the answer and feedback form
function showAnswer(json) {
    document.getElementById("submit-answer").style.display = "none"
    document.getElementById("answer-form").style.display = "block"
    document.getElementById("question-form").style.display = "block"
    document.getElementById("attempt_id").value = json.attempt_id
    const answerMessage = document.getElementById("answer-message")
    if (json.attempt === json.correct_answer) {
        answerMessage.innerHTML = "That's correct!"
        score++
    } else {
        answerMessage.innerHTML = "Oups! The correct answer was " + json.correct_answer + "."
    }
    document.getElementById("reference").innerHTML = json.reference
    if (getProgress() == 1) {
        document.getElementById("button-next-question").innerHTML = "Submit"
    }
}

function submitAnswer() {
    const answers = document.getElementsByName('answer');
    let answer = ""

    for (i = 0; i < answers.length; i++) {
        if (answers[i].checked) {
            answer = answers[i].value
        }
    }

    if (answer !== "") {
        const xhr = new XMLHttpRequest();
        const url = '/answer';
        questionId = document.getElementById("question-id").value
        var params = 'question_id=' + questionId + '&answer=' + answer;
        xhr.open("POST", url, true);
        // Send the proper header information along with the request
        xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        xhr.onreadystatechange = (e) => {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                var status = xhr.status;
                if (status === 0 || (status >= 200 && status < 400)) {
                    json = JSON.parse(xhr.responseText)
                    showAnswer(json)
                }
            }
        }
        xhr.send(params);
    }
}

function submitFeedback() {
    feedback = ""
    const helpful = document.getElementsByName('helpful');
    for (i = 0; i < helpful.length; i++) {
        if (helpful[i].checked) {
            feedback = helpful[i].value
        }
    }

    if (feedback !== "") {
        const xhr = new XMLHttpRequest();
        const url = '/feedback/' + module_id + "/" + getProgress();

        var attempt_id = document.getElementById("attempt_id").value
        var params = 'attempt_id=' + attempt_id + '&is_helpful=' + feedback;
        xhr.open("POST", url, true);
        // Send the proper header information along with the request
        xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        xhr.onreadystatechange = (e) => {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                var status = xhr.status;
                if (status === 0 || (status >= 200 && status < 400)) {
                    json = JSON.parse(xhr.responseText)
                    if (questionCount < QUESTION_TO_ASK) {
                        questionCount++
                        getQuestion()
                    } else {
                        document.getElementById("answer-form").style.display = "none"
                        document.getElementById("question-form").style.display = "none"
                        document.getElementById("done").style.display = "block"
                        document.getElementById("score").innerHTML = 'Score: ' + score + '/' + QUESTION_TO_ASK
                    }
                }
            }
        }
        xhr.send(params);
    }

}

function submitQuestions() {
    let questionText1 = document.getElementById("question_text1").value
    if (questionText1 === "") return somethingEmpty()
    let answerA1 = document.getElementById("answer-a1").value
    if (answerA1 === "") return somethingEmpty()
    let answerB1 = document.getElementById("answer-b1").value
    if (answerB1 === "") return somethingEmpty()
    let answerC1 = document.getElementById("answer-c1").value
    if (answerC1 === "") return somethingEmpty()
    let correctAnswer1 = document.getElementById("correct_answer1").value
    if (correctAnswer1 === "") return somethingEmpty()
    let reference1 = document.getElementById("reference1").value
    if (reference1 === "") return somethingEmpty()

    let questionText2 = document.getElementById("question_text2").value
    if (questionText2 === "") return somethingEmpty()
    let answerA2 = document.getElementById("answer-a2").value
    if (answerA2 === "") return somethingEmpty()
    let answerB2 = document.getElementById("answer-b2").value
    if (answerB2 === "") return somethingEmpty()
    let answerC2 = document.getElementById("answer-c2").value
    if (answerC2 === "") return somethingEmpty()
    let correctAnswer2 = document.getElementById("correct_answer2").value
    if (correctAnswer2 === "") return somethingEmpty()
    let reference2 = document.getElementById("reference2").value
    if (reference2 === "") return somethingEmpty()

    const xhr = new XMLHttpRequest();
    const url = '/submit';
    var params =
        'module_id=' + encodeURIComponent(document.getElementById("module-id-field").value)
        + '&question_text1=' + encodeURIComponent(questionText1)
        + '&answer_a1=' + encodeURIComponent(answerA1)
        + '&answer_b1=' + encodeURIComponent(answerB1)
        + '&answer_c1=' + encodeURIComponent(answerC1)
        + '&correct_answer1=' + encodeURIComponent(correctAnswer1)
        + '&reference1=' + encodeURIComponent(reference1)
        + '&question_text2=' + encodeURIComponent(questionText2)
        + '&answer_a2=' + encodeURIComponent(answerA2)
        + '&answer_b2=' + encodeURIComponent(answerB2)
        + '&answer_c2=' + encodeURIComponent(answerC2)
        + '&correct_answer2=' + encodeURIComponent(correctAnswer2)
        + '&reference2=' + encodeURIComponent(reference2)
    xhr.open("POST", url, true);
    // Send the proper header information along with the request
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

    xhr.onreadystatechange = function () { // Call a function when the state changes.
        if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
            document.getElementById("something-empty").style.display = "none"
            document.getElementById("questions").style.display = "none"
            document.getElementById("response").style.display = "block"
        }
    }
    xhr.send(params);
}


function getListQuestions() {
    access = getUrlVars()["access"]
    if (access === undefined || access === "") return;
    const url = '/' + access + '/list';
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    // Send the proper header information along with the request
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

    xhr.onreadystatechange = function () { // Call a function when the state changes.
        if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
            var json = JSON.parse(xhr.responseText)
            showQuestions(json.questions)
            document.getElementById("restricted-message").style.display = "none";
            document.getElementById("restricted-page").style.display = "block";
        }
    }
    xhr.send()
}

function deleteSelected() {
    access = getUrlVars()["access"]
    if (access === undefined || access === "") return;
    var questions = document.getElementsByName("delete-question")
    var questionsToDelete = []
    for (var i = 0; i < questions.length; i++) {
        if (questions[i].checked === true) {
            questionsToDelete.push(questions[i].id)
        }
    }
    const xhr = new XMLHttpRequest();
    const url = '/' + access + '/delete';
    xhr.open("POST", url, true);
    // Send the proper header information along with the request
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.onreadystatechange = function () { // Call a function when the state changes.
        if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
            document.location.reload()
        }
    }
    json = { questionsToDelete: questionsToDelete }
    console.log(json)
    xhr.send(JSON.stringify(json))
}

function showQuestions(json) {
    questionHTML = ""
    for (var i = 0; i < json.length; i++) {
        questionHTML += '<div>'
        questionHTML += '<b><p><input type="checkbox" id="' + json[i].id + '" name="delete-question">' + json[i].question_text + '</p></b>'
        questionHTML += '<table style="width100%"><td style="max-width:400px;padding-right:50px"><ul>'
        questionHTML += '<li>A: ' + json[i].answer_a + '</li>'
        questionHTML += '<li>B: ' + json[i].answer_b + '</li>'
        questionHTML += '<li>C: ' + json[i].answer_c + '</li>'
        questionHTML += '</ul>'
        questionHTML += '<p>Correct answer: ' + json[i].correct_answer + '</p>'
        questionHTML += '</td><td style="max-width:400px;"><p>Explanation/Reference:<br>' + json[i].reference + '</p><hr>'
        if (json[i].helpful !== null) {
            questionHTML += '<p>Helpful: ' + json[i].helpful + '</p>'
            attempts = json[i].attempts
            correct = json[i].correct_attempts
            percent = Math.round(correct/attempts*100)
            questionHTML += '<p>Attempts (Correct/Total): ' + correct + '/' + attempts + ' (' + percent + '% success)</p>'
        } else{
            questionHTML += '<p>No Attempt yet</p>'
        }
        
        questionHTML += '</td></table></div>'
    }
    document.getElementById("list-questions").innerHTML = questionHTML
}