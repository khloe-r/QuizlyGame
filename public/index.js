const socket = io()
const waitingMessages = [
  'But were you too fast?',
  "Woah that was fast!",
  'Speeding through I see...',
  'Take it slow there partner!',
  'Fingers crossed!',
  'Just in the nick of time!'
]


let loader = document.createElement("div")
loader.classList.add("loader")
let placement = 1

socket.on('connected', async () => {
    const gameCode = await swal(`Enter game code:`,
    {
        title: "Welcome to Quizly!",
        content: "input",
        button: "Next",
        closeOnClickOutside: false,
        closeOnEsc: false
    })

    socket.emit("code", gameCode)

    socket.on('invalidPin', async _ => {
      const codeGame = await swal(`Invalid! Enter game code:`, {
          content: "input",
          button: "Next",
          closeOnClickOutside: false,
          closeOnEsc: false
      })

      socket.emit("code", codeGame)
    })

    socket.on('validPin', async (pin) => {
      const name = await swal("Your name:", {
        content: "input",
        button: "Join",
        closeOnClickOutside: false,
        closeOnEsc: false
      })
      socket.emit("name", name)
      swal({
        title: "Waiting for host",
        buttons: false,
        content: loader,
        closeOnClickOutside: false,
        closeOnEsc: false
      })  
    })
})

socket.on('question', (question) => {
  btns = {}
  ans = question.answers.split(',')
  ans.map((a, i) => {
    btns[i+1] = {
      text: a,
      value: i+1
    }
  })
  swal({
    title: question.text,
    buttons: btns,
    closeOnClickOutside: false,
    closeOnEsc: false
  }).then(answer => {
    socket.emit("answer", [ans[answer - 1], dayjs()])
    swal({
      title: waitingMessages[Math.floor(Math.random() * 6)],
      buttons: false,
      content: loader,
      closeOnClickOutside: false,
      closeOnEsc: false
    })
  })
})

socket.on("correct", async (place) => {
  placement = place + 1
  swal({
    title: "Correct!",
    text: `Keep it up :) You're #${place+1}`,
    icon: "success",
    buttons: false,
    closeOnClickOutside: false,
    closeOnEsc: false
  })
})

socket.on("incorrect", async (place) => {
  placement = place + 1
  swal({
    title: "Sorry! That was incorrect",
    text: `Better luck next time! You're #${place+1}`,
    icon: "error",
    buttons: false,
    closeOnClickOutside: false,
    closeOnEsc: false
  })
})

socket.on("noAnswer", async (place) => {
  placement = place + 1
  swal({
    title: "Not fast enough!",
    text: `Oops :( You're #${place+1}`,
    icon: "warning",
    buttons: false,
    closeOnClickOutside: false,
    closeOnEsc: false
  })
})

socket.on("gameover", async (leaderboard) => {
    let leaderboardDisplay = document.createElement("p")
    leaderboardDisplay.innerHTML = `You finished at #${placement}! Woohoo!`
    console.log(leaderboard)
    console.log(socket.id)
    swal({
        title: "Game over!",
        icon: "info",
        content: leaderboardDisplay,
        buttons: false,
        closeOnClickOutside: false,
        closeOnEsc: false
    })
})