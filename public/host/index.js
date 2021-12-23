const socket = io()

let players = document.createElement("h4")
players.innerHTML += "Players: <br><br>"
let names = 0
let loader = document.createElement("div")
loader.classList.add("loader")

let counter = 0
let answerCount = document.createElement("p")
answerCount.innerText = `Number of answers submitted so far: ${counter}` 


socket.on('connected', async (code) => {
  swal({
    title: `Your Game Code is ${code}`,
    button: "Start",
    content: players,
    closeOnClickOutside: false,
    closeOnEsc: false
  }).then(_ => {
    socket.emit("start")
    swal({
      title: "Waiting for players to answer...",
      buttons: false,
      content: answerCount,
      closeOnClickOutside: false,
      closeOnEsc: false
    })
  })
})

socket.on('name', async (name) => {
  names += 1
  players.innerHTML += `&ensp; <span class="badge bg-warning text-dark"> ${name}</span> &ensp;`
})

socket.on('answer', async (a) => {
  counter += 1
  answerCount.innerText = `Number of answers submitted so far: ${counter}`  
})

socket.on("timeUp", async (scores) => {
    let scoreDisplay = document.createElement("ol")
    counter = 0
    // socket.emit("score", scores)
    swal({
        title: "Leaderboard:",
        button: "Next",
        content: scoreDisplay,
        closeOnClickOutside: false,
        closeOnEsc: false
    }).then(_ => {
        socket.emit("next")
        answerCount.innerText = `Number of answers submitted so far: ${counter}` 
        swal({
            title: "Waiting for players to answer",
            buttons: false,
            content: answerCount,
            closeOnClickOutside: false,
            closeOnEsc: false
        })
        if (counter === names) {
          socket.emit("timeUp")
        }
    })

    for ([player, score] of scores) {
        scoreDisplay.innerHTML += `<li><b>${player}</b>: ${score}</li>`
    }
})

socket.on("gameover", async (leaderboard) => {
    let leaderboardDisplay = document.createElement("ul")
    for (player of leaderboard) {
        leaderboardDisplay.innerHTML += `<li><b>${player[0]}</b>: ${player[1]}</li>`
    }
    swal({
        title: "Game over!",
        icon: "info",
        content: leaderboardDisplay,
        buttons: false,
        closeOnClickOutside: false,
        closeOnEsc: false
    })
})