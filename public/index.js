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

socket.on('connected', async _ => {
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
    socket.emit("answer", question.answers[answer - 1])
    swal({
      title: waitingMessages[Math.floor(Math.random() * 6)],
      buttons: false,
      content: loader,
      closeOnClickOutside: false,
      closeOnEsc: false
    })
  })
})

socket.on("correct", async _ => {
  swal({
    title: "Correct!",
    text: "Keep it up :)",
    icon: "success",
    buttons: false,
    closeOnClickOutside: false,
    closeOnEsc: false
  })
})

socket.on("incorrect", async _ => {
  swal({
    title: "Sorry! That was incorrect",
    text: "Better luck next time!",
    icon: "error",
    buttons: false,
    closeOnClickOutside: false,
    closeOnEsc: false
  })
})

socket.on("noAnswer", async _ => {
  swal({
    title: "Not fast enough!",
    text: "Oops :(",
    icon: "warning",
    buttons: false,
    closeOnClickOutside: false,
    closeOnEsc: false
  })
})

socket.on("gameover", async (leaderboard) => {
    let leaderboardDisplay = document.createElement("ul")
    for (player of leaderboard) {
        leaderboardDisplay.innerHTML += `<li>${player[0]}: ${player[1]}</li>`
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