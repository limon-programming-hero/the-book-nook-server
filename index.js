const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());
// app.use((req, res, next) => {
//     res.setHeader('Access-Control-Allow-Origin', '*');
//     res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, PATCH, DELETE');
//     res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
//     next();
// });

const uri = `mongodb+srv://${process.env.REACT_APP_USER}:${process.env.REACT_APP_PASSWORD}@the-book-nook.uvr1ogl.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri);

// jwt verify
const jwtVerify = (req, res, next) => {
    const rawToken = req.headers.authorization;
    // console.log(rawToken);
    if (!rawToken) {
        return res.status(401).send({ message: 'unauthorized user' })
    }
    const token = rawToken.split(' ')[1];
    jwt.verify(token, process.env.REACT_APP_JWT_TOKEN, function (err, decoded) {
        // console.log(token);
        if (err) {
            return res.status(403).send({ message: 'unauthorized access' })
        }
        req.decoded = decoded;
        next();
    })

}
async function run() {
    try {
        const bookCollections = client.db('the-book-nook').collection('books');
        const OrderCollection = client.db('the-book-nook').collection('orders');

        // books operations 
        app.get('/books', async (req, res) => {
            const query = {};
            const cursor = bookCollections.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })

        app.post('/books', jwtVerify, async (req, res) => {
            const data = req.body;
            const result = await bookCollections.insertOne(data);
            res.send(result);
        })
        app.delete('/books/:id', jwtVerify, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            // console.log(query);
            const result = await bookCollections.deleteOne(query);
            if (result.deletedCount === 1) {
                console.log("Successfully deleted one document.");
            } else {
                console.log("No documents matched the query. Deleted 0 documents.");
            }
            res.send(result);
        })

        // order operations
        app.get('/orders', jwtVerify, async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const cursor = OrderCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        });
        // app.get('/')
        app.post('/orders', jwtVerify, async (req, res) => {
            const data = req.body;
            const result = await OrderCollection.insertOne(data);
            res.send(result);
        })
        app.patch('/orders/:id', jwtVerify, async (req, res) => {
            const id = req.params.id;
            const status = req.body.status;
            const query = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: { status: status }
            }
            const result = await OrderCollection.updateOne(query, updateDoc);
            res.send(result)

        })

        // single book search by params
        app.get('/checkout/:id', jwtVerify, async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const query = { _id: new ObjectId(id) };
            const result = await bookCollections.findOne(query);
            res.send(result);
        })
        // inset jwt token
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.REACT_APP_JWT_TOKEN, { expiresIn: '5d' });
            // console.log(token);
            res.send({ token });
        })

    }
    finally {
        // await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send("welcome to server site.");
})
app.listen(port, () => {
    console.log(`listening on port ${port}`)
})