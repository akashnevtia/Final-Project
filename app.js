require('dotenv').config()

//retriving the list of Voices
var list_of_voices = process.env.list_of_voices

const express = require('express')
const app = express()
const port = 3000

const bodyParser = require('body-parser');
const { query } = require('express');
const { urlencoded } = require('body-parser');
const request = require('request');

var urlencodedParser = bodyParser.urlencoded({ extended: false });
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.raw());

const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const cors = require("cors");
const {check, body, validationResult } = require('express-validator');
const { text } = require('express')

app.use(express.static('public'));
app.use(bodyParser.json());     
app.use(bodyParser.urlencoded({     
    extended: true
}));

const options = {
    swaggerDefinition: {
      info: {
        title: "Text To Speech API",
        version: "1.0",
        description: "UI for Text To Speech API",
      },
      host: "161.35.14.40:3000",
      basePath: "/",
    },
    apis: ["./app.js"],
  };

const specs = swaggerJsdoc(options);
app.use("/docs", swaggerUi.serve, swaggerUi.setup(specs));
app.use(cors());



/**
 * @swagger
 * definitions:
 *   Generate:
 *     
 */
/**
 * @swagger
 * /generate:
 *    post:
 *      description: get the audio file for given text
 *      produces:
 *          - audio/x-wav
 *      responses:
 *          200:
 *              description: Successfully converted text to speech
 *          500:
 *              description: Bad data 
 *      parameters:
 *          - name: generate
 *            description: parameters
 *            in: body
 *            required: true
 *            schema:
 *              $ref: '#/definitions/Generate'
 */


/**
 * @swagger
 * /voices:
 *    get:
 *      description: get the list of supported Voices
 *      produces:
 *          - application/json
 *      responses:
 *          200:
 *              description: Successfull
 *          500:
 *              description: Bad data 
 * 
 */

//endpoint for /voices
app.get("/voices",urlencodedParser,[],async(req, res) =>{
    request({
        method: 'GET',
        uri: process.env.VOICE_URL,
        headers: {
            'Host': process.env.VOICE_HOST,
            'Ocp-Apim-Subscription-Key': process.env.API_KEY
        }
    }, function (error, response, body) {
        if (!error){
               console.log("List Retrived "+response) 
        }
}).pipe(res);
});

//endpoint for generate to convert text to speech
app.post("/generate",urlencodedParser,[],(req, res) => {

    //checking if given values by user or else using default values
    if (req.body.TEXT){
        target_text = req.body.TEXT;
        console.log(target_text);
    } else {
        target_text = "What would you like to convert to speech?"
    }


    //checking if given values by user or else using default values
    if (req.body.VOICE){
        //checking if voice name exists 
        if(list_of_voices.indexOf(req.body.VOICE) !== -1){
            console.log("Passed validation")
             voice = req.body.VOICE;
         }else{
             console.log("Failed validation")
             res.send("API FAILED VOICE NAME ERROR");
         }
        console.log(voice);
    }else {
        voice = "en-US-JennyNeural";
    }

    //checking if given values by user or else using default values
    if (req.body.SPEAKING_SPEED){
        temp = req.body.SPEAKING_SPEED*100
        speaking_speed = Math.floor((-100)+temp);
        console.log(speaking_speed);
    } else {
        speaking_speed = 0;
        
    }

    //checking if given values by user or else using default values
    if (req.body.PITCH){
        pitch = req.body.PITCH;
        console.log(pitch);
    } else {
        pitch = 0;
        
    }

    //all inputs OK! genearting first request for acquring access token
    request({
        method: 'POST',
        uri: process.env.API_AUTH_URL,
        headers: {
            'Ocp-Apim-Subscription-Key': process.env.API_KEY
        }
    }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            GAT = body;
            var accessToken = body; 

            //access tocken accquired! generating request for text conversion
            request({
                method: 'POST',
                uri: process.env.API_URL,  
                headers: {
                    'Authorization': 'Bearer ' + accessToken,
                    'cache-control': 'no-cache',
                    'User-Agent': 'neural-speech-api',
                    'X-Microsoft-OutputFormat': 'riff-24khz-16bit-mono-pcm',
                    'Content-Type': 'application/ssml+xml'
                },
                body: '<speak xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xmlns:emo="http://www.w3.org/2009/10/emotionml" version="1.0" xml:lang="en-US"><voice name="'+voice+'"><prosody rate="'+speaking_speed+'%" pitch="'+pitch+'%">'+target_text+'</prosody></voice></speak>'
            }, function (error, response, body){
                //conversion success! pushing output 
                if (!error && response.statusCode == 200) {
                    console.log("Converted: " + target_text);  
                }
            }).pipe(res);
        
        }else {
            console.log("Access Token Failure")
            res.status(500).send('Text-to-speech API failed: ');
        }
        
    });
});

/**
 * @swagger
 * definitions:
 *    
 *    Generate:
 *        type: object
 *        required:
 *            - "TEXT"
 *        properties:
 *            TEXT:
 *                type: string
 *                example: type what you wanna listen
 *            VOICE:
 *                type: string
 *                example: en-US-AnaNeural
 *            SPEAKING_SPEED:
 *                type: numeric
 *                example: 1.0
 *            PITCH:
 *                type: numeric
 *                example: 0.0
 * 
 * 
 *  
*    
 */

app.listen(port, () => {

  console.log(`Example app listening at http://http://161.35.14.40:${port}`);
  });