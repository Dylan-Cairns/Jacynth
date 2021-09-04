import dotenv from 'dotenv';
dotenv.config();
import pkg from 'pg';
const { Pool } = pkg;
const pool = new Pool({
    user: process.env.DB_user,
    host: process.env.DB_host,
    database: 'jacynth',
    password: process.env.DB_password,
    port: process.env.DB_port ? parseInt(process.env.DB_port) : 5432
});
export const getUsers = (request, response) => {
    pool.query('SELECT * FROM users ORDER BY id ASC', (error, results) => {
        if (error) {
            throw error;
        }
        response.status(200).json(results.rows);
    });
};
export const storeGameResult = (request, response) => {
    const { user1ID, user1Score, user2ID, user2Score, layout } = request.body;
    console.log(user1ID, user1Score, user2ID, user2Score, layout);
    pool.query('SELECT add_game_record($1, $2, $3, $4, $5)', [user1ID, user1Score, user2ID, user2Score, layout], (error, results) => {
        if (error) {
            throw error;
        }
        response.status(201).send(`game record added`);
    });
};
export const getSPGameRecords = (request, response) => {
    const { userID } = request.body;
    pool.query(`SELECT row_number() over () as "#", * from ( SELECT DISTINCT ON (games.id)
    (SELECT nickname FROM users INNER JOIN users_games ON users.id = users_games.user_id WHERE id != $1 AND game_id = games.id ) AS "Opponent",
    (SELECT score FROM users_games WHERE game_id = games.id and user_id != $1) as "Opponent Score", 
    (SELECT score FROM users_games WHERE game_id = games.id and user_id = $1) as "Your Score",
    (SELECT
     CASE
      WHEN (SELECT score FROM users_games WHERE game_id = games.id and user_id = $1) > (SELECT score FROM users_games WHERE game_id = games.id and user_id != $1) THEN 'Won'
      WHEN (SELECT score FROM users_games WHERE game_id = games.id and user_id != $1) > (SELECT score FROM users_games WHERE game_id = games.id and user_id = $1) THEN 'Lost'
      ELSE 'Tie'
      END) as "Result",
    layouts.name AS "Layout", date(end_time) AS "Date"
   FROM
    users_games
   INNER JOIN
    users ON users_games.user_id = users.id
   INNER JOIN
    games ON users_games.game_id = games.id
   INNER JOIN layouts
    ON games.layout_id = layouts.id 
    WHERE games.id IN (SELECT __.game_id FROM (SELECT game_id FROM users_games WHERE user_id = $1)__ INNER JOIN users_games ON __.game_id = users_games.game_id WHERE user_id = 'easyAI' OR user_id = 'mediumAI')
    ORDER BY games.id asc)_;`, [userID], (error, results) => {
        if (error) {
            throw error;
        }
        response.status(200).json(results.rows);
    });
};
export const getMPGameRecords = (request, response) => {
    const { userID } = request.body;
    pool.query(`SELECT row_number() over () as "#", * from ( SELECT DISTINCT ON (games.id)
    (SELECT nickname FROM users INNER JOIN users_games ON users.id = users_games.user_id WHERE id != $1 AND game_id = games.id ) AS "Opponent",
    (SELECT score FROM users_games WHERE game_id = games.id and user_id != $1) as "Opponent Score", 
    (SELECT score FROM users_games WHERE game_id = games.id and user_id = $1) as "Your Score",
    (SELECT
     CASE
      WHEN (SELECT score FROM users_games WHERE game_id = games.id and user_id = $1) > (SELECT score FROM users_games WHERE game_id = games.id and user_id != $1) THEN 'Won'
      WHEN (SELECT score FROM users_games WHERE game_id = games.id and user_id != $1) > (SELECT score FROM users_games WHERE game_id = games.id and user_id = $1) THEN 'Lost'
      ELSE 'Tie'
      END) as "Result",
    layouts.name AS layout, date(end_time) AS "Date"
   FROM
    users_games
   INNER JOIN
    users ON users_games.user_id = users.id
   INNER JOIN
    games ON users_games.game_id = games.id
   INNER JOIN layouts
    ON games.layout_id = layouts.id 
    WHERE games.id IN (SELECT __.game_id FROM (SELECT game_id FROM users_games WHERE user_id = $1)__ INNER JOIN users_games ON __.game_id = users_games.game_id WHERE user_id != 'easyAI' AND user_id != 'mediumAI' AND user_id != $1)
    ORDER BY games.id asc)_;`, [userID], (error, results) => {
        if (error) {
            throw error;
        }
        response.status(200).json(results.rows);
    });
};
