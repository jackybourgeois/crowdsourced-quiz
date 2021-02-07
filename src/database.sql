CREATE TABLE IF NOT EXISTS questions (
    id text,
    timestamp int,
    module_id int,
    question_text text,
    answer_a_text text,
    answer_b_text text,
    answer_c_text text,
    correct_answer text,
    reference text
);
CREATE TABLE IF NOT EXISTS attempts (
    id text,
    timestamp int,
    question_id int,
    attempt text,
    is_correct int
);
CREATE TABLE IF NOT EXISTS feedback (
    id text,
    timestamp int,
    attempt_id int,
    is_helpful int
);