from flask import Flask, request, send_from_directory
from database import DatabaseStore

from dotenv import load_dotenv
from os import getenv
load_dotenv()
ACCESS = getenv("ACCESS")

store = DatabaseStore("data/quiz.db")

server = Flask('Distributed Quiz')

def select_question(module_id, progress):
    module_id = int(module_id)
    progress = float(progress)
    return store.selectQuestion(module_id, progress)

# Load the question page
@server.route('/count')
def serve_count():
    return server.send_static_file('count.html')

@server.route('/moderator')
def serve_moderator_page():
    return server.send_static_file('moderator.html')

@server.route('/assets/<path:path>')
def send_assets(path):
    return send_from_directory(server.static_folder + '/assets/', path)

@server.route('/submit_questions')
def serve_questions_form():
    return server.send_static_file('submit_questions.html')


@server.route('/submit', methods = ["POST"])
def receive_questions():
    module_id = int(request.form['module_id'])
    question_text = request.form['question_text1']
    a = request.form['answer_a1']
    b = request.form['answer_b1']
    c = request.form['answer_c1']
    correct_answer = request.form['correct_answer1']
    reference = request.form['reference1']

    correct_answer = request.form['correct_answer1']
    reference = request.form['reference1']
    store.saveQuestion(module_id, question_text, a, b, c, correct_answer, reference)

    if 'question_text2' in request.form:
        question_text = request.form['question_text2']
        a = request.form['answer_a2']
        b = request.form['answer_b2']
        c = request.form['answer_c2']
        correct_answer = request.form['correct_answer2']
        reference = request.form['reference2']
        store.saveQuestion(module_id, question_text, a, b, c, correct_answer, reference)

    return {"message":"Thank you for your contribution!"}

@server.route('/' + ACCESS + '/delete', methods = ["POST"])
def delete_questions():
    questions_to_delete = request.get_json()["questions_to_delete"]
    store.deleteQuestions(questions_to_delete)
    return {"message": "Delete Success"}

@server.route('/' + ACCESS + '/list')
def list_questions():
    module = request.args.get("module", default=0, type=int)
    return store.list(module)

@server.route('/answer_questions')
def answer_questions():
    return server.send_static_file('answer_questions.html')

@server.after_request
def after_request(response):
    header = response.headers
    header['Access-Control-Allow-Origin'] = '*'
    return response

@server.route('/question/<module_id>/<progress>')
def serve_question(module_id, progress):
    return store.selectQuestion(int(module_id), float(progress))

@server.route('/answer', methods = ['POST'])
def receive_answer():
    """Receive and store answer."""
    question_id = request.form['question_id']
    attempt = request.form['answer']
    question = store.retrieveAnswer(question_id)
    is_correct = 0
    if (question["correct_answer"] == attempt):
      is_correct = 1
    attempt_id = store.saveAttempt(question_id, attempt, is_correct)
    question["attempt"] = request.form['answer']
    question["attempt_id"] = attempt_id
    return question

@server.route('/feedback/<module_id>/<progress>', methods = ['POST'])
def receive_feedback(module_id, progress):
    """Receive and store feedback."""
    attempt_id = request.form['attempt_id']
    is_helpful = request.form['is_helpful']
    store.saveFeedback(attempt_id, is_helpful)
    return store.selectQuestion(int(module_id), float(progress))

# Start the server
server.run("0.0.0.0")
