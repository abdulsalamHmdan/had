var express = require('express')
var session = require('express-session')
var app = express()
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true
}));
const path = require("path");
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, 'public')));
const { MongoClient, ObjectId } = require('mongodb');
const ejs = require('ejs');
const url = "mongodb+srv://family:aS0507499583@cluster0.dvljyns.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(url);

app.get('/', async function (req, res) {
    res.render("login");
})
app.get('/hjz', async function (req, res) {
    await client.connect();
    const db = client.db("had");
    const collection = db.collection('hjz');
    const user = await collection.find({ accepted: { $ne: "no" } }).project({ date: 1, type: 1, _id: 0 }).toArray()
    const collection2 = db.collection('days');
    const user2 = await collection2.find().toArray()
    client.close()
    // console.log(user)
    res.render("had", { arr: JSON.stringify(user), block: JSON.stringify(user2) });
})
app.get('/days', async function (req, res) {
    await client.connect();
    const db = client.db("had");
    const collection = db.collection('days');
    // const user = await collection.find({ accepted: { $ne: "no" } }).project({ date: 1, type: 1, _id: 0 }).toArray()
    const user = await collection.find().toArray()
    client.close()
    // console.log(user)
    res.render("days", { arr: JSON.stringify(user), block: JSON.stringify([]) });
})
app.get('/admin', async function (req, res) {
    await client.connect();
    const db = client.db("had");
    const collection = db.collection('hjz');
    const user = await collection.find({}).toArray()
    client.close()
    // console.log(user)

    res.render("admin", { arr: JSON.stringify(user) });
})

app.post('/changeS', async function (req, res) {
    await client.connect();
    const db = client.db("had");
    const collection = db.collection('hjz');
    await collection.updateOne({ _id: new ObjectId(req.body.id) }, { $set: { accepted: req.body.st } }).then(() => {
        res.send('done');
    }).catch(err => {
        res.send('notFound');
    })
})

app.post('/saveHjz', async function (req, res) {
    await client.connect();
    const db = client.db("had");
    const collection = db.collection(req.body.collection);
    await collection.insertOne(JSON.parse(req.body.data)).then(() => {
        // req.session[req.body.type] = "done"
        // req.session.save(function (err) {
        //     if (err) return next(err)
        res.send('saved')
        // })

    }).catch(err => {
        res.send('notFound');
    })
})
app.post('/delete', async function (req, res) {
    await client.connect();
    const db = client.db("had");
    const collection = db.collection(req.body.collection);
    await collection.deleteOne({ _id: new ObjectId(req.body.id) }).then(() => {
        res.send('deleted')

    }).catch(err => {
        res.send('notFound');
    })
})



app.listen(3070)
console.log("http://127.0.0.1:3070")