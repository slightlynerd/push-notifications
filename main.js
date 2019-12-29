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
// Get a reference to firebase messaging and initialize it
let messaging = firebase.messaging();
messaging.usePublicVapidKey('BMNCFdYP9hEfMALOAqDsCcSyjM8Q9z3ZUMDrrxmisG_qeB_-6z5_olTgvYnfIVp990GqkEFt4--JI9n_MqnkRL4');

// read messages from database
const readMessages = () => {
  const dom = document.getElementById('messages');
  const list = document.createElement('ul');
  db.ref('/messages').on('value', (snapshot) => {
    list.innerHTML = null;
    snapshot.forEach(childSnap => {
      const listItem = document.createElement('li');
      listItem.innerText = childSnap.val().text;
      list.appendChild(listItem);
    });
    dom.appendChild(list);
  });
};

// add messages to database
const addMessage = () => {
  const messageBox = document.getElementById('messageBox');
  db.ref('/messages').push({
    text: messageBox.value,
  }).then((key) => {
    messageBox.value = null;
  });
};

const registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('./firebase-messaging-sw.js')
      .then(function (registration) {
        console.log('Registration successful, scope is:', registration.scope);
      })
      .catch(function (err) {
        console.log('Service worker registration failed, error:', err);
      });
  }
};

const deleteUserToken = (token) => {
  db.ref('/fcmTokens').once('value', snapshot => {
    snapshot.forEach(childSnap => {
      if (childSnap.val().id === token) {
        const key = childSnap.key;
        db.ref('/fcmTokens/' + key).set(null);
      }
    });
  });
};

const saveUserToken = (token) => {
  // Saving the Device Token to the database.
  db.ref('/fcmTokens').push({ id: token });
  updateBtn();
};

const unsubscribeUser = () => {
  messaging.getToken().then((currentToken) => {
    messaging.deleteToken(currentToken).then(() => {
      deleteUserToken(currentToken);
      messaging = null;
      updateBtn();
    }).catch((err) => {
      console.log('Unable to delete token. ', err);
    });
  }).catch((err) => {
    console.log('Error retrieving Instance ID token. ', err);
    showToken('Error retrieving Instance ID token. ', err);
  });
};

const subscribeUser = () => {
  console.log('Requesting notifications permission...');
  messaging.requestPermission().then(() => {
    // Notification permission granted.
    saveMessagingDeviceToken();
  }).catch(function (error) {
    console.error('Unable to get permission to notify.', error);
    pushBtn.disabled = true;
  });
};

const saveMessagingDeviceToken = () => {
  messaging.getToken().then((currentToken) => {
    if (currentToken) {
      saveUserToken(currentToken);
      updateBtn();
    } else {
      // Need to request permissions to show notifications.
      subscribe();
    }
    messaging.onTokenRefresh(() => {
      messaging.getToken().then((currentToken) => {
        saveUserToken(currentToken);
        updateBtn();
      });
    });
  }).catch(function (error) {
    console.error('Unable to get messaging token.', error);
  });
};

const getMessageToken = () => {
  return new Promise((resolve, reject) => {
    messaging.getToken().then((currentToken) => {
      if (currentToken) {
        resolve(currentToken);
      }
      else {
        reject(null);
      }
    });
  })
};

const pushBtn = document.getElementById('pushBtn');
pushBtn.addEventListener('click', () => {
  if (Notification.permission === 'granted') {
    console.log('unsub');
    unsubscribeUser();
  }
  else if (Notification.permission === 'default') {
    console.log('sub');
    subscribeUser();
  }
  else {
    pushBtn.disabled = true;
    pushBtn.innerText = 'Push notifications blocked';
  }
});

const updateBtn = async () => {
  pushBtn.disabled = true;
  const token = await getMessageToken();
  console.log(token);
  if (!token) {
    pushBtn.innerText = 'Enable push notifications';
  }
  else {
    pushBtn.innerText = 'Disable push notifications';
  }
  pushBtn.disabled = false;
};

const initializeUI = async () => {
  // check if notifications are supported
  if ('Notification' in window) {
    pushBtn.disabled = false;
    switch (Notification.permission) {
      case 'granted':
        pushBtn.innerText = 'Disable push notifications';
        break;
      case 'denied':
        pushBtn.innerText = 'Push notifications blocked';
        pushBtn.disabled = true;
        break;
      default:
        pushBtn.innerText = 'Enable push notifications';
        break;
    }
    messaging.onMessage((payload) => {
      alert(payload);
    });
    navigator.serviceWorker.addEventListener('message', ({ data }) => {
      console.log(data);
    });
  }
  else {
    pushBtn.innerText = 'Push messaging not supported by this browser';
  }
  // fetch messages from database
  readMessages();
};

registerServiceWorker();
initializeUI();