const express = require('express');
const cors = require('cors');
const app = express()
require('dotenv').config()

const port = process.env.PORT || 5000
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


app.use(cors())
app.use(express.json())

// Blog_Wide
// klQlMHj1ioZeYOpK

const uri = `mongodb+srv://${process.env.BD_USER}:${process.env.DB_PASS}@cluster0.esqhd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");

        // blogs related apis
        const blogWideCollection = client.db('BlogWide').collection('blogs')

        // get/show all data in home page
        app.get('/homeBlogs', async (req, res) => {
            const cursor = blogWideCollection.find().limit(6)
            const result = await cursor.toArray()
            res.send(result)
        })

        // card Details
        app.get('/blogs/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await blogWideCollection.findOne(query)
            res.send(result)
        })

        // Updated blog API with search and category filter
        app.get('/blogs', async (req, res) => {
            const { category, search } = req.query;
            const query = {};

            // category filter (ignore if 'All')
            if (category && category !== 'All') {
                query.category = category;
            }

            // search filter
            if (search) {
                query.$or = [
                    { headline: { $regex: search, $options: 'i' } },
                    { short_description: { $regex: search, $options: 'i' } }
                ];
            }

            const result = await blogWideCollection.find(query).toArray();
            res.send(result);
        });

        // use Add Collection 
        const userWishList = client.db('BlogWide').collection('addWishList')

        // collect add to card to my collection list in data server
        app.post('/wishList', async (req, res) => {
            const item = req.body;
            if (!item.userEmail) {
                return res.status(400).send({ message: "User email is required" });
            }

            // Check by user and originalId
            const exists = await userWishList.findOne({ userEmail: item.userEmail, originalId: item.originalId });
            if (exists) {
                return res.status(400).send({ message: "This Item All Ready added your wish list" });
            }

            delete item._id; // remove _id if exists
            const result = await userWishList.insertOne(item);
            res.send(result);
        });

        // data get form database.and show the data in my Wish list
        app.get('/wishList', async (req, res) => {
            const userEmail = req.query.email;
            if (!userEmail) {
                return res.status(400).send({ message: "User email is required" });
            }
            const items = await userWishList.find({ userEmail }).toArray();
            // id convert to string
            const formattedItems = items.map(item => ({
                ...item,
                _id: item._id.toString()
            }));

            res.send(formattedItems);
        });

        // add item Delete Function
        app.delete('/wishList/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await userWishList.deleteOne(query)
            res.send(result)
        })

    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('BlogWide your favorite Website')
})

app.listen(port, () => {
    console.log(`BlogWide  page is waiting at: ${port}`);
})