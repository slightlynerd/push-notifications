const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp(functions.config().firebase);

// Sends a notifications to all users when a new message is posted.
exports.sendNotifications = functions.database.ref('/messages/{msgID}').onCreate(
  async (snapshot) => {
    // Notification details.
    const text = snapshot.val().text;
    const payload = {
      notification: {
        title: `New message`,
        body: text ? (text.length <= 100 ? text : text.substring(0, 97) + '...') : '',
        icon: 'https://n-chat-859fd.web.app/firebase-logo.png',
        click_action: 'https://n-chat-859fd.web.app'
      }
    };

    console.log('Payload', payload)

    // Get the list of device tokens.
    const tokens = [];
    const tokenKeys = [];
    await admin.database().ref('/fcmTokens').once('value', snapshot => {
      snapshot.forEach(childSnapshot => {
        tokens.push(childSnapshot.val().id);
        tokenKeys.push(childSnapshot.key);
      });
    });

    if (tokens.length > 0) {
      // Send notifications to all tokens.
      const response = await admin.messaging().sendToDevice(tokens, payload);
      await cleanupTokens(response, tokenKeys);
      console.log('Notifications have been sent');
    }
  });

// Cleans up the tokens that are no longer valid.
function cleanupTokens(response, tokens) {
  // For each notification we check if there was an error.
  const tokensDelete = [];
  response.results.forEach((result, index) => {
    const error = result.error;
    if (error) {
      console.error('Failure sending notification to', tokens[index], error);
      // Cleanup the tokens who are not registered anymore.
      if (error.code === 'messaging/invalid-registration-token' ||
        error.code === 'messaging/registration-token-not-registered') {
        const deleteTask = admin.database().ref(`/fcmTokens/${tokens[index]}`).set({ id: null });
        tokensDelete.push(deleteTask);
      }
    }
  });
  return Promise.all(tokensDelete);
}