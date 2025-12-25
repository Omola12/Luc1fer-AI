async function sendMessage(){
  const msgInput = document.getElementById("message");
  const chatBox = document.getElementById("chat-box");
  const message = msgInput.value;
  if(!message) return;
  chatBox.innerHTML += `<div class="user-msg">You: ${message}</div>`;
  msgInput.value = "";
  const res = await fetch("/api/chat", {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({message})
  });
  const data = await res.json();
  chatBox.innerHTML += `<div class="ai-msg">LUMINITE: ${data.reply}</div>`;
  chatBox.scrollTop = chatBox.scrollHeight;
}
