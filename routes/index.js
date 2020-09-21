const express = require('express');
const router = express.Router();
const Message = require('../models/message');

router.get('/login', (req, res) => {
  const room = {
    website: req.query.website,
    hateSpeechFlag: false,
  };
  Message.find(room, (err, messages) => {
    console.log('logged in');
    if (err) {
      console.log(err);
    }
    if (messages.length <= 50) {
      res.send(messages);
    } else {
      const limMessages = messages.slice(messages.length - 50);
      res.send(limMessages);
    }
  });
});

module.exports = router;
