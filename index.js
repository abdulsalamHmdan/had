var express = require('express')
var session = require('express-session')
var { Resend } = require('resend');
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
const resend = new Resend('re_3ZjE8aHS_PUbPf4uQ6hSeLBrmNk9YvYNw');

async function sendBookingNotification(bookingData = {}) {


    try {
        await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: 'jalyat.ar@gmail.com',
            subject: "📢لديك حجز جديد ",
            html: `
        <h3>تم استلام حجز جديد ✅</h3>
        <p><strong>الجهة:</strong> ${bookingData.entityName}</p>
        <p><strong>الاسم:</strong> ${bookingData.bookerName}</p>
        <p><strong>التاريخ:</strong> ${bookingData.date}</p>
        <p><strong>الفترة:</strong> ${bookingData.timePeriod}</p>
        <p><strong>نوع الحجز:</strong> ${bookingData.type}</p>
        <a href='https://had-iwvj.onrender.com/admin'><strong>الذهاب للموقع</a>
      `
        });
        console.log("✅ تم إرسال الإشعار بالبريد");
    } catch (error) {
        console.error("❌ فشل إرسال الإشعار:", error);
    }
}

app.get('/send', async function (req, res) {
    sendBookingNotification()
    res.send("done");
})
app.get('/', async function (req, res) {
    res.render("welcom");
})
app.get('/hjz', async function (req, res) {
    await client.connect();
    const db = client.db("had");
    const collection = db.collection('hjz');
    const user = await collection.find({ accepted: { $ne: "no" } }).project({ date: 1, type: 1, timePeriod: 1, _id: 0 }).toArray()
    const collection2 = db.collection('days');
    const user2 = await collection2.find().toArray()
    client.close()
    // console.log(user)
    res.render("had", { arr: JSON.stringify(user), block: JSON.stringify(user2) });
})
app.get('/days', async function (req, res) {
    if (req.session.admin) {
        await client.connect();
        const db = client.db("had");
        const collection = db.collection('days');
        const user = await collection.find().toArray()
        client.close()
        res.render("days", { arr: JSON.stringify(user), block: JSON.stringify([]) });
    } else {
        res.send("غير مصرح لك بالدخول");
    }
})
app.get('/admin', async function (req, res) {
    if (req.session.admin) {
        await client.connect();
        const db = client.db("had");
        const collection = db.collection('hjz');
        const user = await collection.find({}).toArray()
        client.close()
        res.render("admin", { arr: JSON.stringify(user) });
    } else {
        res.render("login");

    }
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
    const data = JSON.parse(req.body.data);
    await collection.insertOne(data).then(() => {
        sendBookingNotification(data)
        res.send('saved')
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


app.post('/login', express.urlencoded({ extended: false }), function (req, res) {
    if (req.body.user == "admin" && req.body.pass == "112233") {
        req.session.regenerate(function (err) {
            if (err) next(err)
            req.session.admin = true
            req.session.save(function (err) {
                if (err) return next(err)
                res.send('exist')
            })
        })
    } else {
        res.send('notFound');
    }
})

app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).send('Error during logout');
        }
        // Optionally, clear the session cookie from the client's browser
        res.clearCookie('connect.sid'); // Replace 'connect.sid' with your session cookie name
        res.redirect('/admin');
    });
});


app.listen(3070)
console.log("http://127.0.0.1:3070")