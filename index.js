const express = require("express");
const cors = require("cors");
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();

const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

function verifyJWT(req, res, next) {
      const authHeader = req.headers.authorization;
      if(!authHeader){
        return res.status(401).send({message: "Unauthorized Access"})
      }
      const token = authHeader.split(' ')[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded)=> {
        if(err){ 
          return res.status(403).send({message: "Forbidden Access"})
        }
        req.decoded = decoded;
      })
      next();
}


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.d5cdx.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
async function run() {
  try {
    await client.connect();
    const inventoryCollection = client.db("fruitFest").collection("products");
    const myProductsCollection = client
      .db("fruitFest")
      .collection("my-products");

    //Auth
    app.post("/get-token",async(req, res) => {
      const user = req.body;
      const accessToken = jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{
        expiresIn: '3d'
      });
      res.send({accessToken});
    })

    //Inventory Collection API
    app.get("/inventory", async (req, res) => {
      const query = {};
      const cursor = inventoryCollection.find(query);
      const products = await cursor.toArray();
      res.send(products);
    });
    //read only selected product
    app.get("/inventory/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const product = await inventoryCollection.findOne(query);
      res.send(product);
    });

    // update a product quantity
    app.put("/inventory/:id", async (req, res) => {
      const id = req.params.id;
      const updatedQuantity = req.body;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          quantity: updatedQuantity.quantity,
        },
      };
      const result = await inventoryCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });
    // delete a product
    app.delete("/inventory/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await inventoryCollection.deleteOne(query);
      res.send(result);
    });
    // insert a new product
    app.post("/inventory", async (req, res) => {
      const newProduct = req.body;
      const result = await inventoryCollection.insertOne(newProduct);
      res.send(result);
    });

    //myProducts API
    app.get("/my-products",verifyJWT, async (req, res) => {
      const decodedEmail = req.decoded.email;
      const email = req.query.email;
      if(decodedEmail === email) {
        const query = { email: email };
        const cursor = myProductsCollection.find(query);
        const myProducts = await cursor.toArray();
        res.send(myProducts);
      }
      else{
        return res.status(403).send({message: "Forbidden Access"});
      }
    });
    // add a product in myProductsCollection
    app.post("/my-products", async (req, res) => {
      const myProduct = req.body;
      const myProducts = await myProductsCollection.insertOne(myProduct);
      res.send(myProducts);
    });
    // delete a product from myProductsCollection
    app.delete("/my-products/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await myProductsCollection.deleteOne(query);
      res.send(result);
    });
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Fruit Feast Server Running");
});

app.listen(port, () => {
  console.log("Listening to port: ", port);
});
