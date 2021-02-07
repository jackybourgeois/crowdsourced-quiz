CREATE TABLE IF NOT EXISTS questions (
    id text,
    timestamp integer,
    module_id integer,
    question_text text,
    answer_a_text text,
    answer_b_text text,
    answer_c_text text,
    correct_answer text,
    reference text
);
CREATE TABLE IF NOT EXISTS attempts (
    id text,
    timestamp integer,
    question_id integer,
    attempt text,
    is_correct integer
);
CREATE TABLE IF NOT EXISTS feedback (
    id text,
    timestamp integer,
    attempt_id integer,
    is_helpful integer
);