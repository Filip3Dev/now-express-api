const express = require("express");
const connectToDatabase = require("./db");
const Users = require("./models/User");
const Group = require("./models/Group");
const Message = require("./models/Message");
const authService = require("./services/auth");
const md5 = require("md5");
const cors = require('cors');
const conf = require("./config");
const guid = require("guid");
const bodyParser = require("body-parser");
const app = express();
const Pusher = require("pusher");

const channels_client = new Pusher({
  appId: global.pusher_app_id,
  key: global.pusher_app_key,
  secret: global.pusher_app_secret,
  cluster: global.pusher_app_cluster,
  encrypted: false
});

const port = 5000;
var corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200
}

app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json({
  limit: '50mb', extended: true
}));
app.use(bodyParser.urlencoded({
  limit: '50mb', extended: true
}));
app.use(cors(corsOptions));

app.get("/", (req, res) => {
  res.send("Welcome to a basic express App");
});

app.get("/list-users", async (req, res) => {
  await connectToDatabase();
  let usuario = await Users.find({});
  res.json(usuario);
});

app.post("/create-user", async (req, res) => {
  const { name, email, password } = req.body;
  await connectToDatabase();
  try {
    let usuario = await Users.create({
      name: name,
      email: email,
      password: md5(password + global.SALT_KEY)
    });
    res.send({ message: "Usuario criado com sucesso!", data: usuario, error: false });
  } catch (error) {
    res.send({ message: "Falha ao cadastrar o usuario!", error: true, data: error });
  }
});

app.post("/upload-image-user", async (req, res) => {
  const { url_photo, user } = req.body;
  await connectToDatabase();
  try {
    let usuario = await Users.findByIdAndUpdate(user, { user_image: url_photo })
    res.send({ message: "Usuario editado com sucesso!", data: usuario, error: false });
  } catch (error) {
    res.send({ message: "Falha ao cadastrar o usuario!", error: true, data: error });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  await connectToDatabase();
  try {
    let usuario = await Users.findOne({
      email: email,
      password: md5(password + global.SALT_KEY)
    });
    if (!usuario) {
      res.status(404).send({
        message: "Usuario ou senha invalidos!",
        error: true
      });
      return;
    }
    const token = await authService.generateToken({
      id: usuario._id,
      email: usuario.email,
      name: usuario.name,
      image: usuario.user_image
    });
    res.status(201).send({ token: token, data: usuario, error: false });
  } catch (error) {
    console.log(error)
    res.send({ message: "Falha ao cadastrar o usuario!", error: true, data: error });
  }
});

app.post("/create-group", async (req, res) => {
  const { group_name, private, group_image } = req.body;
  const token = req.body.token || req.query.token || req.headers['x-access-token'];
  let user
  try {
    user = await authService.decodeToken(token);
  } catch (error) {
   res.send({ message: "Falha verificar o usuario!", error: true, data: error }); 
  }

  await connectToDatabase();
  let dados = {
    owner: user.id,
    name: group_name,
    private: private,
    group_image: group_image,
    cod: "COD-" + guid.raw().substring(0, 8)
  };
  try {
    let grupo = await Group.create(dados);
    res.send({ message: "Grupo criado com sucesso!", error: false, data: grupo });
  } catch (error) {
    res.send({ message: "Falha ao criar grupo!", error: true, data: error });
  }
});

app.post("/send-message", async (req, res) => {
  const { message, group } = req.body;
  const token = req.body.token || req.query.token || req.headers['x-access-token'];
  let user
  try {
    user = await authService.decodeToken(token);
  } catch (error) {
   res.send({ message: "Falha verificar o usuario!", error: true, data: error }); 
  }

  await connectToDatabase();
  let dados = { owner: user.id, group: group, message: message, hash: md5(message + global.SALT_KEY)};
  let messagen = await Message.create(dados);
  let grupo = await Group.findById(group);
  channels_client.trigger(grupo.cod, "message", {
    message: message,
    user: user.name,
    user_id: user.id,
    message_id: messagen._id,
    image: user.image
  });
  res.send({ error: false });
});

app.get("/list-groups", async (req, res) => {
  let limit = Number(req.query.limit) || 20;
  let page = Number(req.query.page) || 1;

  await connectToDatabase();
  try {
    if (page == 1) {
      const dados = await Group.find({ private: false }).sort({ ativo: "asc" }).limit(limit);
      const itens = await Group.find({ private: false }).estimatedDocumentCount();
      res.send({ error: false, data: dados, itens: itens });
      return 0;
    }
    let skiper = limit * (page - 1);
    const dados = await Group.find({ private: false }).sort({ ativo: "asc" }).skip(skiper).limit(page);
    const itens = await Group.find({ private: false }).estimatedDocumentCount();
    res.send({ error: false, data: dados, itens: itens });
    return 0;
  } catch (error) {
    res.send({ message: "Falha ao listar os grupos!", error: true, data: error });
    return 0;
  }
});

app.listen(port, () => {
  console.log(`Server is booming on port 5000 Visit http://localhost:5000`);
});
