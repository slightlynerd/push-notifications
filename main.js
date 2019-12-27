// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCsZ9jQ7XjmJhf6pqpOA0bFqXMJliMrhzs",
  authDomain: "n-chat-859fd.firebaseapp.com",
  databaseURL: "https://n-chat-859fd.firebaseio.com",
  projectId: "n-chat-859fd",
  storageBucket: "n-chat-859fd.appspot.com",
  messagingSenderId: "860424303470",
  appId: "1:860424303470:web:fa9a9f88392d9ddea9c77f",
  measurementId: "G-ZVRCM9SMHZ"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
firebase.analytics();
// Get a reference to the database service
const db = firebase.database();

const readMessages = () => {
  const dom = document.getElementById('messages');
  const list = document.createElement('ul');
  db.ref('/messages').on('value', (snapshot) => {
    list.innerHTML = null;
    snapshot.forEach(childSnap => {
      console.log(childSnap.val());
      const listItem = document.createElement('li');
      listItem.innerText = childSnap.val().text;
      list.appendChild(listItem);
    });
    dom.appendChild(list);
  });
};

const addMessage = () => {
  const messageBox = document.getElementById('messageBox');
  db.ref('/messages').push({
    text: messageBox.value,
  }).then((key) => {
    console.log(key);
    messageBox.value = null;
  });
};

readMessages();