const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();

const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

//username: fruitFestUser, pass: MraSE6IWTrPRRgl2

const uri =
  "mongodb+srv://fruitFestUser:MraSE6IWTrPRRgl2@cluster0.d5cdx.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
async function run() {
  try {
    await client.connect();
    const inventoryCollection = client.db("fruitFest").collection("products");

    //read created collections of inventory
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
