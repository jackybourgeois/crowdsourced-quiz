# Import the package for the database
import sqlite3
# Import uuid to generate unique IDs (for questions, attempts and feedback)
import uuid
# Import time to save the record time of question, attempts and feedback
import time
# Import random betavariate for the selection of questions
from random import betavariate

class DatabaseStore:

  def __init__(self, database_path):
    self.database_path = database_path
    self.createDatabase()

  def createDatabase(self):
    """
    Create the 3 tables questions, attempts and feedback if they do not exist yet.
    """
    # Read sql script from file
    with open('database.sql', 'r') as sql_file:
      sql_script = sql_file.read()
    
    # Get DB connection
    conn = sqlite3.connect(self.database_path)
    c = conn.cursor()
    # Execute script
    c.executescript(sql_script)
    # Commit changes and close the connection
    conn.commit()
    conn.close()

  def countQuestions(self, modules):
    """[summary]
    Count the questions for the given module(s)
    """
    # Get DB connection
    conn = sqlite3.connect(self.database_path)
    c = conn.cursor()
    query = 'SELECT COUNT(*) '
    query += 'FROM questions q '
    query += 'WHERE module_id IN ({seq}) '
    query = query.format(seq=','.join(['?']*len(modules)))
    c.execute(query, modules)
    number_questions = c.fetchone()[0]
    # Close the connection
    conn.close()
    return number_questions

  def selectQuestion(self, current_module_id, progress):
    """
    Select a question based on helpfulness, in the current module or below (if progress above .7).
    """
    modules = [current_module_id]
    
    # If progress above .7, include previous module
    if (progress > 0.7 and current_module_id > 1):
      for i in range(1, current_module_id-1):
            modules.push(i)
    
    # Count the questions available for the selected module(s)
    number_questions = self.countQuestions(modules)

    # Get a random number based on the betavariate (1,1) across the number of available questions
    selection = int(betavariate(1, 1)*(number_questions-1))

    # Get the selected question from questions available for the selected module(s)
    query = 'SELECT q.id, q.module_id, q.question_text, q.answer_a_text, q.answer_b_text, q.answer_c_text, SUM(f.is_helpful) AS \'helpful\' '
    query += 'FROM questions q LEFT JOIN attempts a ON q.id=a.question_id LEFT JOIN feedback f ON a.id=f.attempt_id '
    query += 'WHERE q.module_id IN ({seq}) '
    query += 'GROUP BY q.id '
    query += 'ORDER BY helpful DESC ' # we put the helpful at the top, to match the betavariate selection
    query += 'LIMIT 1 OFFSET ?;'      # the limit with offset picks 1 question based on the random number
    query = query.format(seq=','.join(['?']*(len(modules))))

    # Get DB connection
    conn = sqlite3.connect(self.database_path)
    c = conn.cursor()
    # put the module IDs and the selection together for the query
    t = modules
    t.append(selection)
    print(query)
    print(t)
    # Execute the query to question the row of the selected question
    c.execute(query, t)
    row = c.fetchone()
    # Close the connection
    conn.close()

    # Return a JSON structure with the information of the selected question
    return {
      "id": row[0],
      "module_id": row[1],
      "question_text": row[2],
      "answer_a": row[3],
      "answer_b": row[4],
      "answer_c": row[5]
    }

  def retrieveAnswer(self, question_id):
    """
    Retrieve the answer of a given question by ID.
    """
    # Retrieve the answer based on the question ID
    query = 'SELECT id, module_id, correct_answer, reference '
    query += 'FROM questions '
    query += 'WHERE id = ?'


    # Get DB connection
    conn = sqlite3.connect(self.database_path)
    c = conn.cursor()
    # Parameters need to be in a tuple/list
    t = (question_id,)
    c.execute(query, t)
    row = c.fetchone()
    # Close the connection
    conn.close()

    # Return a JSON structure with the information of the answer
    return {
      "question_id": row[0],
      "module_id": row[1],
      "correct_answer": row[2],
      "reference": row[3],
    }

  def deleteQuestions(self, questions_to_delete):
    """
    Delete questions from the database based on a list of question IDs
    """
    # Get DB connection
    conn = sqlite3.connect(self.database_path)
    c = conn.cursor()

    # Execute query for each question to delete
    for id in questions_to_delete:
      t = (id,)
      c.execute('DELETE FROM questions WHERE id = ?', t)
    
    # Commit change and close the connection
    conn.commit()
    conn.close()

    return True


  def saveQuestion(self, module_id, question_text, answer_a, answer_b, answer_c, answer, reference):
    """
    Save question in a database
    """
    # Get DB connection
    conn = sqlite3.connect(self.database_path)
    c = conn.cursor()
    # Generate ID and timestamp
    question_id = str(uuid.uuid4())
    ts = int(time.time())
    # Put the parameters together
    t = (question_id, ts, module_id, question_text, answer_a, answer_b, answer_c, answer, reference)
    # Insert a row of data
    c.execute('INSERT INTO questions VALUES (?,?,?,?,?,?,?,?,?)', t)
    # Commit change and close the connection
    conn.commit()
    conn.close()

  def saveAttempt(self, question_id, attempt, is_correct):
    """
    Save attempt in a database
    """
    # Get DB connection
    conn = sqlite3.connect(self.database_path)
    c = conn.cursor()
    # Generate ID and timestamp
    attempt_id = str(uuid.uuid4())
    ts = int(time.time())
    # Put the parameters together
    t = (attempt_id, ts, question_id, attempt, is_correct)
    # Insert a row of data
    c.execute('INSERT INTO attempts VALUES (?,?,?,?,?)', t)
    # Commit change and close the connection
    conn.commit()
    conn.close()
    return attempt_id

  def saveFeedback(self, attempt_id, is_helpful):
    """
    Save feedback in a database
    """
    # Get DB connection
    conn = sqlite3.connect(self.database_path)
    c = conn.cursor()
    # Generate ID and timestamp
    feedback_id = str(uuid.uuid4())
    ts = int(time.time())
    # Transform helpfulness true/false into 1/-1
    helpful = -1
    if is_helpful == 'true':
      helpful = 1
    # Put the parameters together
    t = (feedback_id, ts, attempt_id, helpful)
    # Insert a row of data
    c.execute('INSERT INTO feedback VALUES (?,?,?,?)', t)
    # Commit change and close the connection
    conn.commit()
    conn.close()
  
  def list(self):
    """
    List all questions from the database
    """
    # Get DB connection
    conn = sqlite3.connect(self.database_path)
    c = conn.cursor()

    # Retrieve all questions, sorted by helpfulness
    query = 'SELECT q.id, q.module_id, q.question_text, q.answer_a_text, q.answer_b_text, q.answer_c_text, q.correct_answer, q.reference, COUNT(*) AS \'num_attempts\', SUM(a.is_correct) AS \'correct_attempt\', SUM(f.is_helpful) AS \'helpful\' '
    query += 'FROM questions q LEFT JOIN attempts a ON q.id=a.question_id LEFT JOIN feedback f ON a.id=f.attempt_id '
    query += 'GROUP BY q.id '
    query += 'ORDER BY helpful DESC'

    questions = []
    # For all questions found, build a JSON object and add them to the list of questions
    for row in c.execute(query):
      questions.append({
        "id": row[0],
        "module": row[1],
        "question_text": row[2],
        "answer_a": row[3],
        "answer_b": row[4],
        "answer_c": row[5],
        "correct_answer": row[6],
        "reference": row[7],
        "attempts": row[8],
        "correct_attempts": row[9],
        "helpful": row[10]
      })

    # Close the connection
    conn.close()
    return {"questions":questions}