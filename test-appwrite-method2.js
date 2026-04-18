const { Account, Client } = require('node-appwrite');
const client = new Client();
const account = new Account(client);
console.log(account.updatePassword.toString());
