import express from 'express';
import mongoose from 'mongoose';
import moment from 'moment';
import momentTZ from 'moment-timezone';
import morgan from 'morgan';

const app = express()
app.use(express.json())
app.use(morgan('dev'))


const PORT = process.env.PORT || 3001;

const webhook = {
  "responseId": "response-id",
  "session": "projects/project-id/agent/sessions/session-id",
  "queryResult": {
    "queryText": "End-user expression",
    "parameters": {
      "param-name": "param-value"
    },
    "allRequiredParamsPresent": true,
    "fulfillmentText": "Response configured for matched intent",
    "fulfillmentMessages": [
      {
        "text": {
          "text": [
            "Response configured for matched intent"
          ]
        }
      }
    ],
    "outputContexts": [
      {
        "name": "projects/project-id/agent/sessions/session-id/contexts/context-name",
        "lifespanCount": 5,
        "parameters": {
          "param-name": "param-value"
        }
      }
    ],
    "intent": {
      "name": "projects/project-id/agent/intents/intent-id",
      "displayName": "matched-intent-name"
    },
    "intentDetectionConfidence": 1,
    "diagnosticInfo": {},
    "languageCode": "en"
  },
  "originalDetectIntentRequest": {}
}

app.get("/ping" , (req , res ) => {
  res.send("ping back");
})



app.post("/webhook", async (req, res) => {
  try {
  
    const body = req.body;

    const intentName = body.queryResult.intent.displayName;
    const params = body.queryResult.parameters;

    if(intentName === "Default Welcome Intent"){
      const currentTime = momentTZ.tz(moment(), "Asia/Karachi");

      const currentHour = moment(currentTime).format('HH');
      console.log(currentHour);

      let greeting = "";

      if(currentHour < 6 ){
        greeting = "Good night"
      }else if(currentHour < 12){
        greeting = "Good morning"
      }else if(currentHour < 15){
        greeting = "Good afternoon"
      }else if(currentHour < 17){
        greeting = "Good Evening"
      }else {
        "Good night"
      }

      let responseText = `${greeting}!welcome to planzo pizza,how can i help you?`

      res.send({
        "fullfillmentMessages":[
          {
            "text": {
              "text":[
                responseText,
              ]
            }
          }
        ]
      })
    }else if(intentName === "newOrder"){
      console.log("collected params:" , params);

      let responseText = `you said ${params.qty} ${params.pizzaSize} ${params.pizzaFlavours} pizza,your pizza is on the way,this reply came from webhook server`

      res.send({
        "fulfillmentMessages": [
          {
            "text": {
              "text": [
                responseText,
              ]
            }
          }
        ]
      })
    }else{
      res.send({
        "fulfillmentMessages": [
          {
            "text": {
              "text": [
                "Sorry webhook dont know the answer of your question"
              ]
            }
          }
        ]
      })
    }
  }catch (e) {
    res.status(500).send({
      message: "server error"
    })
  }
})


// const _dirname = path.resolve();

// app.get('/', express.static(path.join(_dirname, "web")));
// app.use('/', express.static(path.join(_dirname, "web")));
// // app.use('*' , express.static(path.join(_dirname, "web")));

app.listen(PORT, () => {
  console.log(`Example app listening on PORT ${PORT}`)
})

let productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: Number,
  category: String,
  description: String,
  createdOn: { type: Date, default: Date.now }
});
const productModel = mongoose.model('products', productSchema);


let mongodbUri = 'mongodb+srv://dbuser:snadeema@cluster0.intzdzn.mongodb.net/?retryWrites=true&w=majority'

mongoose.connect(mongodbUri);

mongoose.connection.on('connected', function () {
  console.log("Mongoose is connected");
});

mongoose.connection.on('disconnected', function () {
  console.log("Mongoose is disconnected");
  process.exit(1);
});

mongoose.connection.on('error', function (err) {
  console.log('Mongoose connection error:', err);
  process.exit(1);
})

process.on('SIGINT', function () {
  console.log("app is terminatiing");
  mongoose.connection.close(function () {
    conloge.log('Mongoose default connection closed');
    process.exit(0);
  })
})

