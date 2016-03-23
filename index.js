var http = require('http');

var powerBallHttpOptions = {
	host: 'www.powerball.com',
	path: '/powerball/winnums-text.txt'
};

var cb;

exports.handler = function (event, context) {
    try {
        console.log("event.session.application.applicationId=" + event.session.application.applicationId);

        if (event.request.type === "IntentRequest" && event.request.intent.name == "AMAZON.StopIntent") {
            console.log("Stopped powerball intent.");
            context.succeed(buildResponse('{}', buildSpeechletResponse("Powerball", "Goodbye", "", true)));    
        }
        
        http.get(powerBallHttpOptions, function (response) {
            var responseBody = "";
            var alexaSession = '{}';
            response.on('data', function(d) { responseBody += d;});
            response.on('end', function () {
                var results = parseLatestPowerball(responseBody);
                var lotteryNumberSpeech = convertResultsToSpeech(results);                
                console.log('parsed out');
                context.succeed(buildResponse(alexaSession, buildSpeechletResponse("Powerball", lotteryNumberSpeech, "", true)));
            });
        });
    } catch (e) {
        context.fail("Exception: " + e);
    }
};

function convertResultsToSpeech(results) {
    if (results == null) { return "Sorry, I was unable to find powerball results for that day."; }
    
    var speech = "The winning powerball numbers for " + results.date + " were " +
                    ", " + results.ball1 +
                    ", " + results.ball2 +
                    ", " + results.ball3 +
                    ", " + results.ball4 +
                    ", " + results.ball5 +
                    ", and the powerball was " + results.powerball +
                    ".  There was a " + results.powerplay + " times power play multiplier.";
    return speech;
}

function parseLatestPowerball(values) {
	var lines = values.split('\n');
	var results;
	if (lines.length > 2) {
		var numbers = lines[1].split('  ');
		if (numbers.length >= 7) {
			var powerPlay = null;
			if (numbers.length > 7) { powerPlay = numbers[7].replace('\r', ''); }
			
			results = {
				date: numbers[0],
				ball1: numbers[1],
				ball2: numbers[2],
				ball3: numbers[3],
				ball4: numbers[4],
				ball5: numbers[5],
				powerball: numbers[6],
				powerplay: powerPlay
			};
		}
	}
	
	return results;
}

function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        card: {
            type: "Simple",
            title: "Lottery Numbers - " + title,
            content: output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: "1.0",
        sessionAttributes: sessionAttributes,
        response: speechletResponse
    };
}