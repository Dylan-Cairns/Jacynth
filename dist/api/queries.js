var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
export const storeUserNick = (request, response) => {
    const { nickname, userID } = request.body;
    pool.query('UPDATE users SET nickname = $1 WHERE id = $2', [nickname, userID], (error, results) => {
        if (error) {
            throw error;
        }
        response.status(201).send(`user nick added`);
    });
};
export const getUserNickname = (request, response) => {
    const { userID } = request.body;
    pool.query(`SELECT nickname FROM users WHERE id=$1`, [userID], (error, results) => {
        if (error) {
            throw error;
        }
        response.status(200).json(results.rows);
    });
};
export const findExistingNick = (nickname) => {
    return pool.query(`SELECT nickname FROM users WHERE nickname = $1`, [
        nickname
    ]);
};
export const findNickforUser = (userID) => __awaiter(void 0, void 0, void 0, function* () {
    return pool.query(`SELECT nickname FROM users WHERE id = $1`, [userID]);
});
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
export const getSPHighScore = (request, response) => {
    pool.query(`SELECT row_number() over() as "Place", * FROM (
      SELECT
    "Score", 
    "Player Name", 
    "Layout", 
    (SELECT users.nickname FROM users WHERE users.id = opp_id) as "Opponent",
    "Date"
    FROM
    (SELECT
    score as "Score",
    u.nickname as "Player Name",
    l.name as "Layout",
    g.end_time as "Date",
    (SELECT 
         users.id
      FROM users
      INNER JOIN users_games
        ON users.id = users_games.user_id
      WHERE game_id = ug.game_id AND users.id != u.id) as opp_id
  FROM
    users_games ug
  INNER JOIN users u
    ON ug.user_id = u.id
  INNER JOIN games g
    ON ug.game_id = g.id
  INNER JOIN layouts l
    ON g.layout_id = l.id
  WHERE u.id != 'easyAI' AND u.id != 'mediumAI'
  )_
  WHERE opp_id = 'mediumAI'
  ORDER BY "Score" DESC)_
  LIMIT 5;`, (error, results) => {
        if (error) {
            throw error;
        }
        response.status(200).json(results.rows);
    });
};
export const getMPHighScore = (request, response) => {
    pool.query(`SELECT row_number() over() as "Place", * FROM (
      SELECT
    "Score", 
    "Player Name", 
    "Layout", 
    (SELECT users.nickname FROM users WHERE users.id = opp_id) as "Opponent",
    "Date"
    FROM
    (SELECT
    score as "Score",
    u.nickname as "Player Name",
    l.name as "Layout",
    g.end_time as "Date",
    (SELECT 
         users.id
      FROM users
      INNER JOIN users_games
        ON users.id = users_games.user_id
      WHERE game_id = ug.game_id AND users.id != u.id) as opp_id
  FROM
    users_games ug
  INNER JOIN users u
    ON ug.user_id = u.id
  INNER JOIN games g
    ON ug.game_id = g.id
  INNER JOIN layouts l
    ON g.layout_id = l.id
  WHERE u.id != 'easyAI' AND u.id != 'mediumAI'
  )_
  WHERE opp_id != 'easyAI' AND opp_id !='mediumAI'
  ORDER BY "Score" DESC)_
  LIMIT 5;`, (error, results) => {
        if (error) {
            throw error;
        }
        response.status(200).json(results.rows);
    });
};