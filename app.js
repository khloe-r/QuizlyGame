// Create HTTP Server
const express = require('express')
const app = express()
const http = require('http').createServer(app)

// Start socket.io
const io = require('socket.io')(http)

const events = require('events')
const timeUpEvent = new events.EventEmitter()
const dayjs = require("dayjs");
var relativeTime = require('dayjs/plugin/relativeTime')
dayjs.extend(relativeTime)

// Create SQLite Database
const sqlite3 = require('sqlite3').verbose();
let db = new sqlite3.Database('./questions.db');

let create_db = `CREATE TABLE defaultQuestions (question_id INTEGER PRIMARY KEY, text TEXT NOT NULL, time INTEGER, answers TEXT NOT NULL, correctAnswer TEXT NOT NULL)`

// Question Data
const questions = [{
        text: "In Spain, people eat 12 ____ right before midnight. One for each bell strike.",
        time: 10,
        answers: [
            "grapes",
            "pieces of bread"
        ],
        correctAnswer: "grapes"
    },
    {
        text: "Which country has a giant hour glass wheel that needs to be turned on its head at midnight?",
        time: 10,
        answers: [
            "Hungary",
            "Romania",
            "Belgium",
            "Switzerland"
        ],
        correctAnswer: "Hungary"
    },
    {
        text: "In Belgium, kids prepare ______ in school for their grandparents and godparents.",
        time: 10,
        answers: [
            "small gifts",
            "party crowns and hats",
            "songs",
            "New Year's letters"
        ],
        correctAnswer: "New Year's letters"
    },
    {
        text: "Which country calls New Year's Eve Hogmanay?",
        time: 10,
        answers: [
            "Ireland",
            "Scotland",
            "Greenland",
            "England"
        ],
        correctAnswer: "Scotland"
    },
    {
        text: "People in Finland predict what'll happen in the new year by _______.",
        time: 10,
        answers: [
            "reading tea leaves",
            "reading palms",
            "casting molten tin into water and interpreting the shape",
            "visiting fortune tellers"
        ],
        correctAnswer: "casting molten tin into water and interpreting the shape"
    },
    {
        text: "What is baked into sweets as a good luck token in Bolivia?",
        time: 10,
        answers: [
            "Pomegranate seeds",
            "Grapes",
            "Almonds",
            "Coins"
        ],
        correctAnswer: "Coins"
    },
    {
        text: "In which city in the U.S. do millions of people gather to watch the ball drop at midnight?",
        time: 10,
        answers: [
            "New York City, NY",
            "Washington, D.C.",
            "Austin, TX",
            "Dallas, TX"
        ],
        correctAnswer: "New York City, NY"
    },
    {
        text: "In Russia, people write down wishes on paper. What do they do with them afterwards?",
        time: 10,
        answers: [
            "Put them in a jar and keep it closed for a year.",
            "Burn them, throw it in a Champagne glass and drink it.",
            "Burn them in the fire place.",
            "Tie them to balloons and let them fly away."
        ],
        correctAnswer: "Burn them, throw it in a Champagne glass and drink it."
    },
    {
        text: "People in Colombia believe that _____ will increase their chances to travel in the new year.",
        time: 10,
        answers: [
            "packing their suitcases by midnight",
            "making a wish on their passports",
            "buying a new suitcase by midnight",
            "running around the block with their suitcases"
        ],
        correctAnswer: "running around the block with their suitcases"
    },
    {
        text: "Why do Ecuadorians burn homemade puppets at midnight?",
        time: 10,
        answers: [
            "It's a replacement for fireworks, as those are illegal.",
            "To burn away the old year and start with a clean slate.",
            "They believe puppets are evil.",
            "To protect themselves against spirits."
        ],
        correctAnswer: "To burn away the old year and start with a clean slate."
    },
]

const q_data = questions.map((q) => {
 return [q.text, q.time, q.answers.toString(), q.correctAnswer]
})


db.serialize(function() {
    db.run('DROP TABLE IF EXISTS defaultQuestions');
    db.run(create_db, function (err) {
      if (err === null) {
        q_data.map((q) => {
          db.run(`INSERT INTO defaultQuestions (text, time, answers, correctAnswer) VALUES(?,?,?,?)`, q);
        }) 

      }
    });
  })

let selectQuestions = 'SELECT * FROM defaultQuestions'

let qstions = []

const c = Buffer.from(dayjs().format(), 'binary').toString('base64').substring(23, 29)


io.on('connection', (socket) => {
  let attempt = ""
  let timestamp = ""

  db.all(selectQuestions, [], (err, rows) => {
    if (err) {
      throw err;
    }
    rows.forEach((row) => {
      qstions.push(row);
      console.log(qstions[0])
    });
  });
  
  const code = c 
  
  io.emit('connected', code)

  socket.on("code", (gameCode) => {
    console.log(gameCode, code)
    if (gameCode === code) {
      socket.emit("validPin", code)
    } else {
      socket.emit("invalidPin")
    }
  })

  socket.once("name", (name) => {
    userPointsMap[socket.id] = [name, 0]
    io.emit("name", name)
  })

  socket.once("start", async () => {
    for (const question of qstions) {
      await new Promise(async (resolve) => {
        const toSend = {
          ...question
        }
        
        delete toSend.correctAnswer
        io.emit('question', toSend)

        await new Promise((endTimer) => {
            setTimeout(() => {
                endTimer()
            }, question.time * 1000)
            socket.once("skip", () => {
                endTimer()
            })
            socket.once("roundOver", () => {
                endTimer()
            })
        })
        timeUpEvent.emit("timeUp", [question.correctAnswer, dayjs(), question.time])
        const sortedValues = Object.values(userPointsMap).sort(([, a], [, b]) => b - a)
        const top5 = sortedValues.slice(0, 5)

        io.emit("timeUp", top5)

        socket.once("next", () => {
          resolve()
        })

      })
    }

    const sortedValues = Object.values(userPointsMap).sort(([, a], [, b]) => b - a)
    io.emit("gameover", sortedValues)
    db.close();
    process.exit(0)
  })

  socket.on("answer", answer => {
    attempt = answer[0]
    timestamp = answer[1]
    io.emit("answer", answer[0])
  })

  timeUpEvent.on("timeUp", (answerInfo) => {
    console.log(attempt, answerInfo[0])
    console.log(sortLeaderboard())
    if (attempt) {
      if(attempt === answerInfo[0]) {
        userPointsMap[socket.id][1] += (answerInfo[2]*1000) - (answerInfo[1].diff(timestamp))
        socket.emit("correct", sortLeaderboard().indexOf(socket.id))
      } else {
        sortLeaderboard()
        socket.emit("incorrect", sortLeaderboard().indexOf(socket.id))
      }
      attempt = ""
    } else {
      sortLeaderboard()
      socket.emit("noAnswer", sortLeaderboard().indexOf(socket.id))
    }
  })
})

app.use(express.static('public'))
http.listen(3000, () => {
  console.log('listening on *:3000')
})

function sortLeaderboard() {
  let scores = {}
  let leaderboard = []
  for (let user in userPointsMap) {
    if (userPointsMap[user][1] in scores) {
      scores[userPointsMap[user][1]].push(user)
    } else {
      scores[userPointsMap[user][1]] = [user]
    }
  }
  mxvalue = Math.max(...Object.keys(scores))
  for (let i = mxvalue; i >= 0; i--) {
    if (i in scores) {
      leaderboard = leaderboard.concat(scores[i])
    }
  }
  return leaderboard
}


// Points

let userPointsMap = {}