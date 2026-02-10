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
const resend = new Resend('re_GFZ3sUGo_GUVWhPR4AWWPDbtFKi1uW43J');
const { minify } = require('html-minifier');
// const url =
//   "mongodb+srv://family:aS0507499583@cluster0.dvljyns.mongodb.net/soqy?retryWrites=true&w=majority";
// mongoose
//   .connect(url)
//   .then(() => console.log("تم الاتصال بقاعدة البيانات بنجاح!"))
//   .catch((err) => console.log("فشل الاتصال:", err));
async function sendBookingNotification(bookingData = {}) {

    //jalyat.ar@gmail.com
    try {
        const html = await ejs.renderFile(`views/email.ejs`, { bookingData });
        const minimized = minify(html, {
            collapseWhitespace: true,
            removeComments: true,
            minifyCSS: true
        });
        await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: 'alqsmalrbyhad@gmail.com',
            subject: "📢لديك حجز جديد ",
            html: minimized
        });
        // console.log(html);
        console.log("✅ تم إرسال الإشعار بالبريد");
        return true;
    } catch (error) {
        console.error("❌ فشل إرسال الإشعار:", error);
        return false;
    }
}

app.get('/send', async function (req, res) {
    // res.render("email", { bookingData: {} })
    res.send(sendBookingNotification() ? "done" : "faild");
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
    console.log(req.body);
    if (req.body.user == "1014772139" && req.body.pass == +"0505152317") {
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


const port = process.env.PORT || 3070;
app.listen(port, () => {
    console.log(`http://localhost:${port}`);
});