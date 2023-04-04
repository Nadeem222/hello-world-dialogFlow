import express from 'express';
import mongoose from 'mongoose';
import morgan from 'morgan';
import moment from 'moment';
import momentTZ from 'moment-timezone';
import path from "path";
// import cors from "cors";


const app = express()
app.use(express.json())
app.use(morgan('dev'))
// app.use(cors)

const PORT = process.env.PORT || 5001;

const webhookRequest = {
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
app.get("/ping", (req, res) => {
  req.send("ping back");
})

app.post('/webhook', async (req, res) => {

  try {
    const body = req.body;

    const intentName = body.queryResult.intent.displayName
    const params = body.queryResult.parameters


    switch (intentName) {
      case 'Default Welcome Intent': {
        const currentTime = momentTZ.tz(moment(), "Asia/Karachi")

        const currentHour = +moment(currentTime).format('HH');

        console.log(currentHour);

        let greeting = '';

        if (currentHour < 6) {
          greeting = "Good Night"
        } else if (currentHour < 12) {
          greeting = "Good Morning"
        } else if (currentHour < 15) {
          greeting = "Good Afternoon"
        } else if (currentHour < 17) {
          greeting = "Good Evening"
        } else {
          greeting = "Good Night"
        }

        let responseText = `${greeting}!welcome to Planzo Pizza,how can i help you?`

        console.log(responseText);

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
      }

        break;

      case 'newOrder':
        console.log("collected params:", params);
        console.log("collected params:", params.name);

        const newOrder = new orderModel({
          orderName: params.person.name,
          pizzaSize: params.pizzaSize,
          pizzaFlavours: params.pizzaFlavours,
          qty: params.qty
        });

        const savedOrder = await newOrder.save();
        console.log("New Order added", savedOrder);

        let responseText = `you said ${params.qty} ${params.pizzaSize} ${params.pizzaFlavours} pizza,
          your pizza is on the way.`

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

        break;

      case 'checkOrderStatus': {

        let responseText = ' ';
        const recentOrders = await orderModel.find({}).sort({ createdOn: -1 }).limit(15);

        let latestPendingOrders = []

        for (let i = 0; 1 < recentOrders.length; i++) {
          if (recentOrders[1].status === 'pending') {
            latestPendingOrders.push(recentOrders[i])
          } else {
            break;
          }
        }

        if (latestPendingOrders.length === 0) {

          responseText = `${recentOrders.orderName},your order for 
            ${recentOrders.qty} ${recentOrders.pizzaSize}
            ${recentOrders.pizzaFlavours} pizza is ${recentOrders.status}
            ${moment(recentOrders.createdOn).fromNow()}`
          return recentOrders;
        } else {
          responseText += `${latestPendingOrders[0].orderName},you have ${latestPendingOrders.length} pending ${latestPendingOrders.length > 1 ? "orders." : "order"}`
          latestPendingOrders.map(eachOrder, i => {

            if (latestPendingOrders.length > 1) {
              responseText += `order number ${i + 1},`
            }else{
              responseText += ` for`
            }
            responseText += ` ${eachOrder.qty} ${eachOrder.pizzaSize} ${eachOrder.pizzaFlavours} pizza,`
          })

          responseText += `please be patient, your order will be delivered soon.`
        }
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

        break;
      }


      default:
        res.send({
          "fulfillmentMessages": [
            {
              "text": {
                "text": [
                  "sorry webhook dont know answer for this question"
                ]
              }
            }
          ]
        })
        break;
    }
  } catch (e) {
    console.log("Error catching ", e);

    res.send({
      "fulfillmentMessages": [
        {
          "text": {
            "text": [
              "something went wrong on server,please try again"
            ]
          }
        }
      ]
    })
  }
})



const _dirname = path.resolve();

app.post('/', express.static(path.join(_dirname, "web")));
app.use('/', express.static(path.join(_dirname, "web")));
app.use('*', express.static(path.join(_dirname, "web")));


app.listen(PORT, () => {
  console.log(`Example app listening on PORT ${PORT}`)
})

let orderSchema = new mongoose.Schema({
  orderName: { type: String, required: true },
  pizzaSize: { type: String, required: true },
  pizzaFlavours: { type: String, required: true },
  qty: { type: Number, required: true },
  status: { type: String, default: "pending" },
  createdOn: { type: Date, default: Date.now }
});
const orderModel = mongoose.model('orders', orderSchema);

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

