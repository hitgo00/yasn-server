const express = require('express');
const socket = require('socket.io');
const http = require('http');
const morgan = require('morgan');
const helmet = require('helmet');
const mongoose = require('mongoose');
const cors = require('cors');
const { OAuth2Client } = require('google-auth-library');
const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');
const indexRoutes = require('./routes/index');
const controllers = require('./controllers/index');
const toxicity = require('@tensorflow-models/toxicity');

// tfjs node backend intialization
require('@tensorflow/tfjs-node');

//importing Models
const User = require('./models/User');
const Post = require('./models/Post');
const Room = require('./models/room');

// DotENV config
require('dotenv').config();

// Declaring the express app
const app = express();

// Connecting to Database
const dbUrl = process.env.DB_URL || '';
const dbName = process.env.DB_NAME || '';
mongoose
  .connect(dbUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName,
  })
  .then(() => console.log('Connected to MongoDB...'))
  .catch((error) => console.log('MongoDB Error:\n', error));
mongoose.set('useCreateIndex', true);

// Morgan for logging requests
app.use(morgan('tiny'));

// A little security using helmet
app.use(helmet());

// CORS
app.use(cors());
// app.use(cors({ origin: ['http://localhost:3000', 'https://yasn.now.sh'] }));

const server = http.createServer(app);

// JSON parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Cookie middlewares
app.use(
  cookieSession({
    name: 'session',
    keys: ['#secretKey'],
  })
);
app.use(cookieParser());

const client_id = process.env.GOOGLE_CLIENT_ID;

//Google_Auth_Client
const client = new OAuth2Client(client_id);

//Auth Token verification middleware
app.use((req, res, next) => {
  let email;
  async function verify() {
    const ticket = await client.verifyIdToken({
      idToken: req.query.googleToken,
      audience: client_id, // Specify the CLIENT_ID of the app that accesses the backend
      // Or, if multiple clients access the backend:
      //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
    });
    const payload = ticket.getPayload();
    const userid = payload['sub'];
    const domain = payload['hd'];
    email = payload['email'];
  }
  verify()
    .then(() => {
      if (email !== req.query.email) {
        throw new Error('Invalid Email');
      } else {
        next();
      }
    })
    .catch((err) => {
      console.log(err);
      res.send('invalid token');
    });
});

//Routes
app.get('/checkprofile', (req, res) => {
  const email = req.query.email;
  User.find({ email }, (err, user) => {
    console.log(err);
    console.log(user);
    user.length !== 0 ? res.send(user) : res.send(false);
  });
});

app.post('/adduser', (req, res) => {
  console.log(req.cookies);
  console.log(req.body.name);
  const newUser = {
    name: req.body.name,
    email: req.body.email,
    username: req.body.username,
    clubsNumber: req.body.tags.length,
    bio: req.body.bio,
    gitHubUrl: req.body.gitHubUrl,
    linkedInUrl: req.body.linkedInUrl,
    instaUrl: req.body.instaUrl,
    clubsComm: req.body.tags,
  };
  User.find({ username: req.body.username }, (err, user) => {
    console.log(err);
    user.length !== 0 ? res.send('username already taken') : null;
  });

  User.create(newUser)
    .then((res) => console.log(res))
    .catch((err) => console.log(err));

  res.send('success');
});

app.get('/profile', (req, res) => {
  const email = req.query.email;
  User.find({ email })
    .populate('posts')

    .exec((err, user) => {
      if (err) {
        console.log(err);
      }
      user.length !== 0 ? res.send(user) : res.send(false);
    });
});

app.get('/username', (req, res) => {
  const username = req.query.username;
  User.find({ username })
    .populate('posts')

    .exec((err, user) => {
      if (err) {
        console.log(err);
      }
      console.log(user);
      user.length !== 0 ? res.send(user) : res.send(false);
    });
});

app.get('/home', (req, res) => {
  const tag = req.query.tag;

  Post.find(tag ? { tags: tag } : {})
    .sort({ date: -1 })
    .populate('creator')
    .exec((err, posts) => {
      if (err) {
        console.log(err);
      }
      res.send(posts);
    });
});

app.post('/addpost', async (req, res) => {
  const email = req.query.email;

  let postId;
  let userId = req.body.currentUserId;
  if (!userId) {
    await User.findOne({ email }, (err, user) => {
      if (err) console.log(err);
      userId = user._id;
      console.log(userId);
    });
  }

  const newPost = {
    creatorEmail: email,
    creator: userId,
    imageUrl: req.body.imageUrl,
    videoUrl: req.body.videoUrl,
    title: req.body.title,
    description: req.body.description,
    tags: req.body.tags,
    comments: req.body.comments,
    likes: { count: req.body.likesCount },
  };

  await Post.create(newPost)
    .then((res) => {
      console.log(res);
      postId = res._id;
    })
    .catch((err) => console.log(err));

  await Post.findOne({ _id: postId })
    .populate('creator')
    .exec((err, post) => {
      if (err) return handleError(err);
      console.log(post);
    });

  const updatedUser = await User.update(
    { _id: userId },
    {
      $push: { posts: postId },
    }
  );
  console.log(updatedUser);

  res.send('successfully added post');
});

app.post('/handlelike', async (req, res) => {
  let updatedPost;

  const postId = req.query._id;
  const userId = req.body.currentUserId;
  const liked = req.body.liked;
  console.log(postId);

  if (liked && userId) {
    updatedPost = await Post.updateOne(
      { _id: postId },
      { $push: { 'likes.likers': userId } }
    );
    console.log(updatedPost);
  } else {
    updatedPost = await Post.updateOne(
      { _id: req.query._id },
      { $pull: { 'likes.likers': userId } }
    );
    console.log(updatedPost);
  }

  res.send('success');
});

app.post('/addcomment', (req, res) => {
  Post.updateOne(
    { _id: req.body.postId },
    {
      $push: {
        comments: {
          commentBy: req.body.userId,
          comment: req.body.comment,
          username: req.body.username,
          name: req.body.name,
        },
      },
    }
  )
    .then((res) => {
      console.log(res);
    })
    .catch((err) => console.log(err));
  res.send('success');
});

//Darkrai chat part

// Creating the socket
const io = socket(server);

// Users count for each room
const rooms = {};

io.sockets.on('connection', function (socket) {
  console.log('Connection Established ', socket.id);
  socket.on('add_user', async function (data) {
    socket.username = data.username;
    socket.room = data.website;

    const roomExist = await Room.exists({ website: socket.room });

    if (roomExist) {
      socket.join(socket.room);
    } else {
      controllers.addRoom(socket.room);

      socket.join(socket.room);
    }

    if (!rooms[data.website]) {
      rooms[data.website] = 1;
    } else {
      rooms[data.website]++;
    }
    console.log('Number of users in', socket.room, ':', rooms[socket.room]);
  });

  socket.on('send_message', (data) => {
    // tfjs toxicity model prediction
    toxicity.load().then((model) => {
      model.classify(data.message).then((predictions) => {
        if (predictions[predictions.length - 1].results[0].match) {
          console.log('Toxic message detected. Deleting now...');
          io.sockets.in(socket.room).emit('delete_message', {
            message: data.message,
          });
          controllers.updateMessage(data.message);
        }
      });
    });

    controllers.addMessage(socket.username, data.message, data.website);
    io.sockets.in(socket.room).emit('receive_message', {
      username: socket.username,
      message: data.message,
    });
  });

  socket.on('Disconnect', (data) => {
    console.log('User Disconnected');
    rooms[data.website]--;
    console.log('Number of users in', socket.room, ':', rooms[socket.room]);
  });
});

// Specifying routes
app.use('/darkrai', indexRoutes);

const port = process.env.PORT || 4848;

server.listen(port, () => {
  console.log(
    `Server is running in ${process.env.NODE_ENV} mode on port ${port}...`
  );
});
